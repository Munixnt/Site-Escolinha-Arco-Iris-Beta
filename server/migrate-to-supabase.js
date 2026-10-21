import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient, loadEnv, PRIVATE_BUCKET, PRIVATE_UPLOAD_PREFIX, PUBLIC_BUCKET } from './supabase.js';
import { SupabaseStore } from './supabase-store.js';

loadEnv();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
let supabase;
let store;
const FILE_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain; charset=utf-8',
};

function bucketForEntity(entity) {
  return entity === 'Athlete' ? PRIVATE_BUCKET : PUBLIC_BUCKET;
}

function uploadRefs(value, refs = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\/uploads\/([^/?#"' ]+)/g)) refs.add(decodeURIComponent(match[1]));
  } else if (Array.isArray(value)) {
    value.forEach((item) => uploadRefs(item, refs));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => uploadRefs(item, refs));
  }
  return refs;
}

async function ensureBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existing = new Set(data.map((bucket) => bucket.name));
  for (const [name, isPublic] of [[PUBLIC_BUCKET, true], [PRIVATE_BUCKET, false]]) {
    if (!existing.has(name)) {
      const { error: createError } = await supabase.storage.createBucket(name, {
        public: isPublic,
        fileSizeLimit: 25 * 1024 * 1024,
      });
      if (createError) throw createError;
    }
  }
}

async function uploadLocalFile(name, bucket) {
  const fullPath = path.resolve(UPLOAD_DIR, name);
  const relative = path.relative(UPLOAD_DIR, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Caminho de arquivo inválido: ${name}`);

  let body;
  try {
    body = await fs.readFile(fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Arquivo local referenciado não encontrado: ${fullPath}`);
    throw error;
  }

  const { error } = await supabase.storage.from(bucket).upload(name, body, {
    contentType: FILE_MIME[path.extname(name).toLowerCase()] || 'application/octet-stream',
    upsert: true,
  });
  if (error) throw error;

  if (bucket === PRIVATE_BUCKET) return `${PRIVATE_UPLOAD_PREFIX}${name}`;
  return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
}

async function migrate() {
  supabase = createSupabaseClient();
  store = new SupabaseStore(supabase);

  let localData;
  try {
    localData = JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Banco local não encontrado: ${DB_FILE}`);
    throw new Error(`Não foi possível ler ${DB_FILE}: ${error.message}`);
  }
  if (!localData || typeof localData !== 'object' || Array.isArray(localData)) {
    throw new Error(`Formato inválido em ${DB_FILE}.`);
  }

  await ensureBuckets();

  const references = new Map();
  for (const [entity, docs] of Object.entries(localData)) {
    if (!Array.isArray(docs)) throw new Error(`A tabela local ${entity} não é uma lista.`);
    for (const doc of docs) {
      for (const name of uploadRefs(doc)) {
        if (!references.has(name)) references.set(name, new Set());
        references.get(name).add(bucketForEntity(entity));
      }
    }
  }

  const localFiles = await fs.readdir(UPLOAD_DIR).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const name of localFiles) {
    const stat = await fs.stat(path.join(UPLOAD_DIR, name));
    if (stat.isFile() && !references.has(name)) references.set(name, new Set([PRIVATE_BUCKET]));
  }

  const migratedUrls = new Map();
  for (const [name, buckets] of references) {
    for (const bucket of buckets) {
      migratedUrls.set(`${bucket}:${name}`, await uploadLocalFile(name, bucket));
    }
  }

  const totals = [];
  for (const [entity, docs] of Object.entries(localData)) {
    const records = [];
    for (const doc of docs) {
      const bucket = bucketForEntity(entity);
      const rewrite = async (value) => {
        if (typeof value === 'string') {
          const matches = [...value.matchAll(/\/uploads\/([^/?#"' ]+)/g)];
          let output = value;
          for (const match of matches) {
            const name = decodeURIComponent(match[1]);
            const url = migratedUrls.get(`${bucket}:${name}`);
            if (!url) throw new Error(`Não foi possível migrar o arquivo ${name} da entidade ${entity}.`);
            output = output.replace(match[0], url);
          }
          return output;
        }
        if (Array.isArray(value)) return Promise.all(value.map(rewrite));
        if (value && typeof value === 'object') {
          return Object.fromEntries(
            await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await rewrite(item)])),
          );
        }
        return value;
      };
      records.push(await rewrite(doc));
    }
    const result = await store.insertMissing(entity, records);
    totals.push(`${entity}: ${result.inserted} importado(s), ${result.skipped} já existente(s)`);
  }

  console.log('Migração concluída. Os arquivos locais foram mantidos como backup.');
  console.log(totals.join('\n'));
  console.log(`Arquivos transferidos: ${migratedUrls.size}`);
}

migrate().catch((error) => {
  console.error('[migração Supabase]', error.message);
  process.exitCode = 1;
});
