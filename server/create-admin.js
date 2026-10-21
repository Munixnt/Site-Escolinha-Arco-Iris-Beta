// Uso: npm run create-admin -- email@exemplo.com SenhaForte123 ["Nome Completo"]
// Cria um administrador ou redefine a senha se o e-mail já existir.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { hashPassword } from './auth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const [email, password, ...nameParts] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: npm run create-admin -- email senha ["Nome Completo"]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('A senha precisa ter pelo menos 8 caracteres.');
  process.exit(1);
}

const dataDir = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const store = new Store(path.join(dataDir, 'db.json'));
const users = store.table('User');
const normalized = email.trim().toLowerCase();
const now = new Date().toISOString();
const existing = users.find((u) => u.email === normalized);

if (existing) {
  existing.passwordHash = hashPassword(password);
  existing.role = 'admin';
  existing.updated_date = now;
  console.log(`Senha redefinida para ${normalized}.`);
} else {
  users.push({
    id: store.newId(),
    email: normalized,
    full_name: nameParts.join(' ') || 'Administrador',
    role: 'admin',
    passwordHash: hashPassword(password),
    created_date: now,
    updated_date: now,
  });
  console.log(`Administrador ${normalized} criado.`);
}
store.flush();
