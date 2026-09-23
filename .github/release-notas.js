'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Las notas de una release: la sección `## <versión>` del CHANGELOG, tal cual (está escrito para el alumno).
//   node .github/release-notas.js 0.20.0
function notasDe(changelog, version) {
  const lineas = changelog.split(/\r?\n/);
  const inicio = lineas.findIndex(l => l.trim() === `## ${version}`);
  if (inicio < 0) return null;
  const fin = lineas.findIndex((l, i) => i > inicio && l.startsWith('## '));
  return lineas.slice(inicio + 1, fin < 0 ? lineas.length : fin).join('\n').trim();
}

function cli(args, raiz) {
  const version = args[0];
  if (!version) { console.error('Uso: node .github/release-notas.js <versión>'); return 2; }
  const notas = notasDe(fs.readFileSync(path.join(raiz, '.kit', 'CHANGELOG.md'), 'utf8'), version);
  if (notas === null) { console.error(`El CHANGELOG no tiene la sección ## ${version}`); return 1; }
  console.log(notas);
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..')));

module.exports = { notasDe, cli };
