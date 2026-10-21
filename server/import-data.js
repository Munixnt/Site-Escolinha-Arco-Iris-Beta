// Importa dados exportados do Base44 (JSON ou CSV) para o banco local.
// Uso: npm run import-data -- Athlete caminho/atletas.csv
//      npm run import-data -- Sponsor caminho/patrocinadores.json
// Se o registro já tiver "id", ele é mantido; se esse id já existir, o registro é ignorado.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { entities } from './entities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [entity, file] = process.argv.slice(2);
if (!entity || !file || !Object.hasOwn(entities, entity)) {
  console.error(`Uso: npm run import-data -- <Entidade> <arquivo.json|csv>\nEntidades: ${Object.keys(entities).join(', ')}`);
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((x) => x !== '')) rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ''])));
}

function coerce(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (t === '') return undefined;
  if (t === 'true') return true;
  if (t === 'false') return false;
  if ((t.startsWith('[') || t.startsWith('{'))) { try { return JSON.parse(t); } catch { /* texto */ } }
  if (/^-?\d+(\.\d+)?$/.test(t) && t.length < 16 && !/^0\d/.test(t)) return Number(t);
  return v;
}

const raw = fs.readFileSync(file, 'utf8');
const records = file.toLowerCase().endsWith('.json') ? JSON.parse(raw) : parseCsv(raw);
const dataDir = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const store = new Store(path.join(dataDir, 'db.json'));
const table = store.table(entity);
const ids = new Set(table.map((d) => d.id));
const now = new Date().toISOString();
let added = 0, skipped = 0;

for (const rec of Array.isArray(records) ? records : [records]) {
  const doc = {};
  for (const [k, v] of Object.entries(rec)) {
    const val = coerce(v);
    if (val !== undefined) doc[k] = val;
  }
  // Campos internos que o Base44 costuma exportar
  for (const k of ['created_by', 'created_by_id', 'is_sample', '__v']) delete doc[k];
  if (doc.id && ids.has(String(doc.id))) { skipped++; continue; }
  doc.id = doc.id ? String(doc.id) : store.newId();
  doc.created_date = doc.created_date || now;
  doc.updated_date = doc.updated_date || doc.created_date;
  ids.add(doc.id);
  table.push(doc);
  added++;
}
store.flush();
console.log(`${entity}: ${added} importado(s), ${skipped} ignorado(s) (id já existente).`);
