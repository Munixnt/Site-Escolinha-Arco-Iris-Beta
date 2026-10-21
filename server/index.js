// Backend do site Arco Íris — sem dependências externas (somente Node.js >= 18).
// API REST + upload de arquivos + login de administrador + serve o front (dist/) em produção.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { entities } from './entities.js';
import { Store } from './store.js';
import { hashPassword, verifyPassword, signToken, verifyToken, loadSecret } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env simples (sem dependência): lê KEY=VALUE da raiz do projeto
function loadDotEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotEnv();

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DIST_DIR = path.join(ROOT, 'dist');
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const store = new Store(path.join(DATA_DIR, 'db.json'));
const SECRET = loadSecret(DATA_DIR);

// ---------- Administrador inicial ----------
function seedAdmin() {
  const users = store.table('User');
  if (users.some((u) => u.role === 'admin')) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@arcoiris.local').toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }
  const now = new Date().toISOString();
  users.push({
    id: store.newId(),
    email,
    full_name: 'Administrador',
    role: 'admin',
    passwordHash: hashPassword(password),
    created_date: now,
    updated_date: now,
  });
  store.flush();
  console.log('\n[auth] Administrador criado.');
  console.log(`[auth]   e-mail: ${email}`);
  if (generated) console.log(`[auth]   senha (gerada, anote agora): ${password}`);
  else console.log('[auth]   senha: a definida em ADMIN_PASSWORD');
  console.log('[auth] Para trocar/criar admin depois: npm run create-admin -- email senha\n');
}
seedAdmin();

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

function getUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const data = verifyToken(token, SECRET);
  if (!data) return null;
  return store.table('User').find((u) => u.id === data.sub) || null;
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

function createDoc(name, def, body, user) {
  let data = clean(body);
  if (!isAdmin(user) && def.forcePublicCreate) data = { ...data, ...def.forcePublicCreate };
  data = { ...(def.defaults || {}), ...data };
  validate(def, data, { partial: false });
  const now = new Date().toISOString();
  const doc = { id: store.newId(), ...data, created_date: now, updated_date: now };
  store.table(name).push(doc);
  return doc;
}

// ---------- Rotas da API ----------
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api', ...]
  const method = req.method;
  const user = getUser(req);

  // --- Auth ---
  if (parts[1] === 'auth') {
    if (parts[2] === 'login' && method === 'POST') {
      rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
      const { email, password } = await readJson(req);
      const u = store
        .table('User')
        .find((x) => x.email === String(email || '').trim().toLowerCase());
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
      const table = store.table(name);
      const out = records.map((rec) => {
        const data = clean(rec);
        const existing = table.find((d) => key.every((k) => String(d[k]) === String(data[k])));
        if (existing) {
          const merged = { ...existing, ...data };
          validate(def, merged, { partial: false });
          Object.assign(existing, data, { updated_date: new Date().toISOString() });
          return existing;
        }
        return createDoc(name, def, data, user);
      });
      store.save();
      return send(res, 200, out);
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
      let docs = store.table(name).filter((d) => matches(d, query));
      docs = sortDocs(
        [...docs],
        url.searchParams.get('sort') || '-created_date',
      );
      const limit = Number(url.searchParams.get('limit'));
      if (limit > 0) docs = docs.slice(0, limit);
      return send(res, 200, docs);
    }

    if (!id && method === 'POST') {
      if (!can(def, 'create', user)) throw forbid(user);
      if (!isAdmin(user)) rateLimit(`create:${name}:${clientIp(req)}`, 20, 3600 * 1000);
      const doc = createDoc(name, def, await readJson(req), user);
      store.save();
      return send(res, 201, doc);
    }

    if (id && method === 'GET') {
      if (!can(def, 'read', user)) throw forbid(user);
      const doc = store.table(name).find((d) => d.id === id);
      if (!doc || (!isAdmin(user) && def.publicReadFilter && !matches(doc, def.publicReadFilter))) {
        throw new HttpError(404, 'Registro não encontrado.');
      }
      return send(res, 200, doc);
    }

    if (id && method === 'PUT') {
      if (!can(def, 'update', user)) throw forbid(user);
      const doc = store.table(name).find((d) => d.id === id);
      if (!doc) throw new HttpError(404, 'Registro não encontrado.');
      const data = clean(await readJson(req));
      validate(def, data, { partial: true });
      Object.assign(doc, data, { updated_date: new Date().toISOString() });
      store.save();
      return send(res, 200, doc);
    }

    if (id && method === 'DELETE') {
      if (!can(def, 'delete', user)) throw forbid(user);
      const table = store.table(name);
      const i = table.findIndex((d) => d.id === id);
      if (i === -1) throw new HttpError(404, 'Registro não encontrado.');
      table.splice(i, 1);
      store.save();
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
      // visitantes só enviam arquivos para a matrícula: limite por IP
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

      const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const dest = path.join(UPLOAD_DIR, fileName);
      const out = fs.createWriteStream(dest, { flags: 'wx' });
      let size = 0;
      let aborted = false;

      const fail = (err) => {
        if (aborted) return;
        aborted = true;
        out.destroy();
        fs.rm(dest, { force: true }, () => {});
        reject(err);
      };

      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_UPLOAD) {
          fail(new HttpError(413, `Arquivo maior que ${MAX_UPLOAD / 1024 / 1024} MB.`));
          req.destroy();
        }
      });
      req.on('error', fail);
      out.on('error', fail);
      out.on('finish', () => {
        if (aborted) return;
        if (size === 0) return fail(new HttpError(400, 'Arquivo vazio.'));
        send(res, 201, { file_url: `/uploads/${fileName}`, file_name: rawName, size });
        resolve();
      });
      req.pipe(out);
    } catch (e) {
      reject(e);
    }
  });
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

    if (url.pathname.startsWith('/uploads/')) {
      const name = path.basename(decodeURIComponent(url.pathname));
      const file = path.join(UPLOAD_DIR, name);
      if (within(UPLOAD_DIR, file) && serveFile(req, res, file, { immutable: true })) return;
      res.writeHead(404);
      return res.end('Arquivo não encontrado');
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

function shutdown() {
  store.flush();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`[server] API rodando em http://localhost:${PORT}`);
  console.log(`[server] Dados em ${DATA_DIR}`);
});
