// Sobe API (server/index.js) e front (Vite) juntos, sem dependências extras.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (name, args) => {
  const p = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
  p.on('exit', (code) => {
    if (!stopping) {
      console.error(`[${name}] encerrou (código ${code}).`);
      stop(code || 1);
    }
  });
  return p;
};

let stopping = false;
const procs = [
  run('api', ['--watch', '--watch-path=server', 'server/index.js']),
  run('web', [path.join('node_modules', 'vite', 'bin', 'vite.js')]),
];

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => p.kill());
  setTimeout(() => process.exit(code), 200);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
