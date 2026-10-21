// API REST, persistência no Supabase, upload de arquivos e login de administrador.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { entities } from './entities.js';
import { hashPassword, verifyPassword, signToken, verifyToken, loadSecret } from './auth.js';
import { calcularCategoria, isIdadeDeMatriculaValida } from '../shared/athlete.js';
import { createSupabaseClient, loadEnv, PRIVATE_BUCKET, PRIVATE_UPLOAD_PREFIX, PUBLIC_BUCKET } from './supabase.js';
import { SupabaseStore } from './supabase-store.js';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const DIST_DIR = path.join(ROOT, 'dist');
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

let supabase;
let store;
const SECRET = loadSecret(DATA_DIR);

// ---------- Administrador inicial ----------
async function seedAdmin() {
  const users = await store.list('User');
  if (users.some((u) => u.role === 'admin')) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@arcoiris.local').toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }
  const now = new Date().toISOString();
  await store.insert('User', {
    id: store.newId(),
    email,
    full_name: 'Administrador',
    role: 'admin',
    passwordHash: hashPassword(password),
    created_date: now,
    updated_date: now,
  });
  console.log('\n[auth] Administrador criado.');
  console.log(`[auth]   e-mail: ${email}`);
  if (generated) console.log(`[auth]   senha (gerada, anote agora): ${password}`);
  else console.log('[auth]   senha: a definida em ADMIN_PASSWORD');
  console.log('[auth] Para trocar/criar admin depois: npm run create-admin -- email senha\n');
}

// ---------- Utilitários ----------
const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role });

function send(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(data);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readJson(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, 'Requisição muito grande.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Limite de tentativas em memória (janela deslizante simples)
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    throw new HttpError(429, 'Muitas tentativas. Aguarde um pouco e tente novamente.');
  }
  arr.push(now);
  buckets.set(key, arr);
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of buckets) {
    if (!arr.length || now - arr[arr.length - 1] > 3600 * 1000) buckets.delete(k);
  }
}, 10 * 60 * 1000).unref();

async function getUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const data = verifyToken(token, SECRET);
  if (!data) return null;
  return store.get('User', data.sub);
}

const isAdmin = (user) => user?.role === 'admin';

function can(def, action, user) {
  const rule = def.perms[action];
  return rule === 'public' || (rule === 'admin' && isAdmin(user));
}

function requireEntity(name) {
  const def = Object.hasOwn(entities, name) ? entities[name] : null;
  if (!def) throw new HttpError(404, `Entidade desconhecida: ${name}`);
  return def;
}

function forbid(user) {
  return new HttpError(user ? 403 : 401, user ? 'Acesso negado.' : 'Autenticação necessária.');
}

// ---------- Consulta ----------
function matches(doc, query) {
  for (const [k, v] of Object.entries(query || {})) {
    const val = doc[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.$in)) {
      if (!v.$in.some((x) => String(x) === String(val))) return false;
    } else if (v === null) {
      if (val != null) return false;
    } else if (typeof v === 'boolean' || typeof val === 'boolean') {
      if (val !== v) return false;
    } else if (String(val) !== String(v)) {
      return false;
    }
  }
  return true;
}

function sortDocs(docs, sort) {
  if (!sort) return docs;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const dir = desc ? -1 : 1;
  return docs.sort((a, b) => {
    const x = a[field];
    const y = b[field];
    if (x == null && y == null) return 0;
    if (x == null) return 1; // vazios sempre no fim
    if (y == null) return -1;
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
    return String(x).localeCompare(String(y), 'pt-BR', { numeric: true, sensitivity: 'base' }) * dir;
  });
}

// ---------- Validação ----------
function validate(def, data, { partial }) {
  for (const f of def.required || []) {
    const present = Object.hasOwn(data, f);
    if (partial && !present) continue;
    const v = data[f];
    if (v === undefined || v === null || v === '') {
      throw new HttpError(400, `Campo obrigatório: ${f}`);
    }
  }
  for (const [f, allowed] of Object.entries(def.enums || {})) {
    const v = data[f];
    if (v !== undefined && v !== null && v !== '' && !allowed.includes(v)) {
      throw new HttpError(400, `Valor inválido para ${f}: ${v}`);
    }
  }
}

const PROTECTED = new Set(['id', 'created_date', 'updated_date']);
const clean = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Corpo inválido.');
  }
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (!PROTECTED.has(k) && k !== '__proto__') out[k] = v;
  }
  return out;
};

async function createDoc(name, def, body, user) {
  let data = clean(body);
  if (!isAdmin(user) && def.forcePublicCreate) data = { ...data, ...def.forcePublicCreate };
  data = { ...(def.defaults || {}), ...data };
  if (name === 'Athlete' && !isAdmin(user)) {
    if (!isIdadeDeMatriculaValida(data.dataNascimento)) {
      throw new HttpError(400, 'A matrícula é destinada a atletas de 7 a 17 anos completos.');
    }
    data.categoria = calcularCategoria(data.dataNascimento);
  }
  validate(def, data, { partial: false });
  const now = new Date().toISOString();
  return store.insert(name, { id: store.newId(), ...data, created_date: now, updated_date: now });
}

// ---------- Rotas da API ----------
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api', ...]
  const method = req.method;
  const user = await getUser(req);

  // --- Auth ---
  if (parts[1] === 'auth') {
    if (parts[2] === 'login' && method === 'POST') {
      rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
      const { email, password } = await readJson(req);
      const users = await store.list('User');
      const u = users.find((x) => x.email === String(email || '').trim().toLowerCase());
      // verifica sempre uma senha (mesmo sem usuário) para não vazar existência por tempo
      const ok = verifyPassword(String(password || ''), u?.passwordHash || 'scrypt$00$00');
      if (!u || !ok) throw new HttpError(401, 'E-mail ou senha incorretos.');
      return send(res, 200, { token: signToken(u.id, SECRET), user: publicUser(u) });
    }
    if (parts[2] === 'me' && method === 'GET') {
      if (!user) throw new HttpError(401, 'Não autenticado.');
      return send(res, 200, publicUser(user));
    }
    throw new HttpError(404, 'Rota não encontrada.');
  }

  // --- Upload ---
  if (parts[1] === 'upload' && method === 'POST') {
    return handleUpload(req, res, user);
  }

  // --- Entidades ---
  if (parts[1] === 'entities') {
    const name = parts[2];
    const def = requireEntity(name);
    const id = parts[3];

    // Atenção: /upsert precisa vir antes de tratar parts[3] como id
    if (id === 'upsert' && method === 'POST') {
      if (!can(def, 'create', user) || !can(def, 'update', user)) throw forbid(user);
      const { records, key } = await readJson(req, 5 * 1024 * 1024);
      if (!Array.isArray(records) || !Array.isArray(key) || !key.length) {
        throw new HttpError(400, 'Informe records[] e key[].');
      }
      const existingRecords = await store.list(name);
      const out = [];
      for (const rec of records) {
        const data = clean(rec);
        const existing = existingRecords.find((d) => key.every((k) => String(d[k]) === String(data[k])));
        if (existing) {
          const merged = { ...existing, ...data };
          validate(def, merged, { partial: false });
          out.push(await store.update(name, existing.id, data));
        } else {
          out.push(await createDoc(name, def, data, user));
        }
      }
      return send(res, 200, await presentDocs(out, user));
    }

    if (!id && method === 'GET') {
      if (!can(def, 'read', user)) throw forbid(user);
      let query = {};
      if (url.searchParams.get('q')) {
        try {
          query = JSON.parse(url.searchParams.get('q'));
        } catch {
          throw new HttpError(400, 'Parâmetro q inválido.');
        }
      }
      if (!isAdmin(user) && def.publicReadFilter) query = { ...query, ...def.publicReadFilter };
      let docs = (await store.list(name)).filter((d) => matches(d, query));
      docs = sortDocs(
        [...docs],
        url.searchParams.get('sort') || '-created_date',
      );
      const limit = Number(url.searchParams.get('limit'));
      if (limit > 0) docs = docs.slice(0, limit);
      return send(res, 200, await presentDocs(docs, user));
    }

    if (!id && method === 'POST') {
      if (!can(def, 'create', user)) throw forbid(user);
      if (!isAdmin(user)) rateLimit(`create:${name}:${clientIp(req)}`, 20, 3600 * 1000);
      const doc = await createDoc(name, def, await readJson(req), user);
      return send(res, 201, await presentDoc(doc, user));
    }

    if (id && method === 'GET') {
      if (!can(def, 'read', user)) throw forbid(user);
      const doc = await store.get(name, id);
      if (!doc || (!isAdmin(user) && def.publicReadFilter && !matches(doc, def.publicReadFilter))) {
        throw new HttpError(404, 'Registro não encontrado.');
      }
      return send(res, 200, await presentDoc(doc, user));
    }

    if (id && method === 'PUT') {
      if (!can(def, 'update', user)) throw forbid(user);
      const doc = await store.get(name, id);
      if (!doc) throw new HttpError(404, 'Registro não encontrado.');
      const data = clean(await readJson(req));
      validate(def, data, { partial: true });
      const updated = await store.update(name, id, data);
      return send(res, 200, await presentDoc(updated, user));
    }

    if (id && method === 'DELETE') {
      if (!can(def, 'delete', user)) throw forbid(user);
      if (!await store.delete(name, id)) throw new HttpError(404, 'Registro não encontrado.');
      return send(res, 200, { success: true });
    }
  }

  throw new HttpError(404, 'Rota não encontrada.');
}

// ---------- Upload ----------
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mov': 'video/quicktime', '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain; charset=utf-8',
};

function handleUpload(req, res, user) {
  return new Promise((resolve, reject) => {
    try {
      if (!isAdmin(user)) rateLimit(`upload:${clientIp(req)}`, 30, 3600 * 1000);

      let rawName = 'arquivo';
      try {
        rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'arquivo'));
      } catch { /* mantém padrão */ }
      const ext = path.extname(rawName).toLowerCase();
      if (!Object.hasOwn(MIME, ext)) {
        throw new HttpError(415, 'Tipo de arquivo não permitido.');
      }
      if (Number(req.headers['content-length']) > MAX_UPLOAD) {
        throw new HttpError(413, `Arquivo maior que ${MAX_UPLOAD / 1024 / 1024} MB.`);
      }

      const visibility = String(req.headers['x-file-visibility'] || (isAdmin(user) ? 'public' : 'private'));
      if (!['public', 'private'].includes(visibility)) {
        throw new HttpError(400, 'Visibilidade de arquivo inválida.');
      }
      if (!isAdmin(user) && visibility !== 'private') {
        throw new HttpError(403, 'Visitantes só podem enviar documentos privados de matrícula.');
      }
      const bucket = visibility === 'private' ? PRIVATE_BUCKET : PUBLIC_BUCKET;
      const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      let size = 0;
      const chunks = [];

      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_UPLOAD) {
          reject(new HttpError(413, `Arquivo maior que ${MAX_UPLOAD / 1024 / 1024} MB.`));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('error', reject);
      req.on('end', async () => {
        try {
          if (size === 0) throw new HttpError(400, 'Arquivo vazio.');
          const { error } = await supabase.storage.from(bucket).upload(fileName, Buffer.concat(chunks), {
            contentType: MIME[ext],
            upsert: false,
          });
          if (error) throw new HttpError(502, `Falha ao salvar arquivo no Supabase: ${error.message}`);
          const fileUrl = visibility === 'private'
            ? `${PRIVATE_UPLOAD_PREFIX}${fileName}`
            : supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
          send(res, 201, { file_url: fileUrl, file_name: rawName, size });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function presentValue(value, user) {
  if (typeof value === 'string' && value.startsWith(PRIVATE_UPLOAD_PREFIX)) {
    if (!isAdmin(user)) return null;
    const filePath = value.slice(PRIVATE_UPLOAD_PREFIX.length);
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(filePath, 3600);
    if (error) throw new HttpError(502, `Falha ao gerar link privado: ${error.message}`);
    return data.signedUrl;
  }
  if (Array.isArray(value)) return Promise.all(value.map((item) => presentValue(item, user)));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await presentValue(item, user)])),
    );
  }
  return value;
}

async function presentDoc(doc, user) {
  return presentValue(doc, user);
}

async function presentDocs(docs, user) {
  return Promise.all(docs.map((doc) => presentDoc(doc, user)));
}

function serveFile(req, res, file, { immutable = false } = {}) {
  let stat;
  try {
    stat = fs.statSync(file);
    if (!stat.isFile()) return false;
  } catch {
    return false;
  }
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || STATIC_MIME[ext] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    end = Math.min(end, stat.size - 1);
    start = Math.max(0, start);
    if (start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      res.end();
      return true;
    }
    res.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1,
    });
    if (req.method === 'HEAD') return res.end(), true;
    fs.createReadStream(file, { start, end }).pipe(res);
    return true;
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function within(base, target) {
  const rel = path.relative(base, target);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

// ---------- Servidor ----------
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      throw new HttpError(405, 'Método não permitido.');
    }

    // Front-end compilado (produção)
    if (fs.existsSync(DIST_DIR)) {
      const rel = decodeURIComponent(url.pathname);
      const file = path.join(DIST_DIR, rel);
      if (within(DIST_DIR, file) && serveFile(req, res, file, { immutable: rel.startsWith('/assets/') })) return;
      if (path.extname(rel) && !rel.endsWith('.html')) {
        res.writeHead(404);
        return res.end('Não encontrado');
      }
      if (serveFile(req, res, path.join(DIST_DIR, 'index.html'))) return; // SPA fallback
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Front-end não compilado. Rode "npm run build" ou use "npm run dev".');
  } catch (err) {
    if (res.headersSent) return res.destroy();
    if (err instanceof HttpError) return send(res, err.status, { message: err.message });
    console.error('[erro]', err);
    send(res, 500, { message: 'Erro interno do servidor.' });
  }
});

async function start() {
  supabase = createSupabaseClient();
  store = new SupabaseStore(supabase);
  await seedAdmin();
  server.listen(PORT, () => {
    console.log(`[server] API rodando em http://localhost:${PORT}`);
    console.log('[server] Banco de dados e arquivos no Supabase.');
  });
}

start().catch((error) => {
  console.error('[server] Falha ao inicializar o Supabase:', error.message);
  process.exitCode = 1;
});
