// Baixa para data/uploads os arquivos que ainda estão hospedados fora (ex.: Base44) e
// reescreve as URLs no banco para /uploads/....
// Uso:   npm run localize-files                (hosts que contenham "base44" ou "supabase.co")
//        npm run localize-files -- --host=meucdn\.com   (outro padrão, regex)
//        npm run localize-files -- --dry-run          (só lista, não altera nada)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const hostArg = args.find((a) => a.startsWith('--host='));
const hostRe = new RegExp(hostArg ? hostArg.slice(7) : 'base44|supabase\\.co', 'i');

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.mp4', '.webm', '.mov', '.doc', '.docx', '.xls', '.xlsx', '.txt']);
const BY_TYPE = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'application/pdf': '.pdf', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
};

const dataDir = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const uploadDir = path.join(dataDir, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const store = new Store(path.join(dataDir, 'db.json'));

const cache = new Map(); // url -> novo caminho (mesmo arquivo usado em vários registros)
let ok = 0, fail = 0;

async function localize(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  let ext = path.extname(new URL(url).pathname).toLowerCase();
  if (!ALLOWED.has(ext)) ext = BY_TYPE[type] || '';
  if (!ext) throw new Error(`tipo não suportado (${type || 'desconhecido'})`);
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(uploadDir, name), Buffer.from(await res.arrayBuffer()));
  const local = `/uploads/${name}`;
  cache.set(url, local);
  return local;
}

for (const [entity, docs] of Object.entries(store.data)) {
  if (entity === 'User') continue;
  for (const doc of docs) {
    for (const [field, value] of Object.entries(doc)) {
      if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) continue;
      let host = '';
      try { host = new URL(value).host; } catch { continue; }
      if (!hostRe.test(host)) continue;
      if (dry) { console.log(`[simulação] ${entity}.${field}: ${value}`); continue; }
      try {
        doc[field] = await localize(value);
        ok++;
        console.log(`ok     ${entity}.${field} -> ${doc[field]}`);
      } catch (e) {
        fail++;
        console.error(`ERRO   ${entity}.${field}: ${value} (${e.message})`);
      }
    }
  }
}
if (!dry) store.flush();
console.log(dry ? '\nSimulação concluída.' : `\nConcluído: ${ok} arquivo(s) migrado(s), ${fail} falha(s).`);
if (fail) console.log('As URLs com falha continuam como estavam; rode o comando de novo para tentar outra vez.');
