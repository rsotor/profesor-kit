'use strict';
const fs = require('node:fs');
const path = require('node:path');

const MANIFIESTO = '.instaladas-por-kit.json';

function instalarSkills({ raiz, destino = '.claude/skills' }) {
  const origen = path.join(raiz, '.kit', 'skills');
  const dirDestino = path.join(raiz, ...destino.split('/'));
  fs.mkdirSync(dirDestino, { recursive: true });

  const ficheroManifiesto = path.join(dirDestino, MANIFIESTO);
  const anteriores = fs.existsSync(ficheroManifiesto) ? JSON.parse(fs.readFileSync(ficheroManifiesto, 'utf8')) : [];
  const actuales = fs.existsSync(origen)
    ? fs.readdirSync(origen, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()
    : [];

  const retiradas = anteriores.filter(n => !actuales.includes(n));
  for (const nombre of [...retiradas, ...actuales]) fs.rmSync(path.join(dirDestino, nombre), { recursive: true, force: true, maxRetries: 3 });
  for (const nombre of actuales) fs.cpSync(path.join(origen, nombre), path.join(dirDestino, nombre), { recursive: true });

  fs.writeFileSync(ficheroManifiesto, JSON.stringify(actuales, null, 2) + '\n');
  return { instaladas: actuales, retiradas };
}

function cli(args, raiz) {
  const i = args.indexOf('--destino');
  const r = instalarSkills({ raiz, destino: i >= 0 ? args[i + 1] : undefined });
  console.log(`Skills instaladas: ${r.instaladas.join(', ') || 'ninguna'}${r.retiradas.length ? ` · retiradas: ${r.retiradas.join(', ')}` : ''}`);
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { instalarSkills, cli };
