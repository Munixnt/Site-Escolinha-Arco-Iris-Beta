// Armazenamento em arquivo JSON (sem dependências nativas).
// Gravação atômica (arquivo temporário + rename) e leitura em memória.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class Store {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.data = {};
    if (fs.existsSync(file)) {
      try {
        this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        const backup = `${file}.corrompido-${Date.now()}`;
        fs.copyFileSync(file, backup);
        console.error(`[store] ${file} inválido. Cópia salva em ${backup}. Iniciando vazio.`);
      }
    }
    this._timer = null;
  }

  table(name) {
    if (!this.data[name]) this.data[name] = [];
    return this.data[name];
  }

  newId() {
    return crypto.randomBytes(12).toString('hex');
  }

  save() {
    // debounce curto: agrupa várias escritas seguidas (ex.: upsert em lote)
    if (this._timer) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      this.flush();
    }, 50);
  }

  flush() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data));
    fs.renameSync(tmp, this.file);
  }
}
