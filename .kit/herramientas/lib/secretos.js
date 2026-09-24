'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { recorrer, aPosix } = require('./vault');

const PATRONES = [
  ['token de GitHub', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['token de GitHub', /\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ['clave de Anthropic', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['clave de OpenAI', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['clave de Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['clave de AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['token de Slack', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['clave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
const NOMBRES_DE_SECRETOS = /^(\.env(\..+)?|.+\.pem|.+\.key)$/;
const MAX_BYTES = 1024 * 1024;
// Fuera del escaneo: los tests del kit (fabrican secretos de mentira) y el código de los complementos de
// Obsidian, que es de terceros, viene minificado y no contiene nada que el alumno haya escrito.
const FUERA = [/^\.kit\/herramientas\/tests\//, /(^|\/)\.obsidian\/plugins\//];

function ficherosCandidatos(raiz) {
  const r = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: raiz, encoding: 'utf8' });
  if (r.status === 0) return r.stdout.split('\0').filter(Boolean);
  return recorrer(raiz, () => true, new Set(['.git', 'node_modules'])).map(f => aPosix(path.relative(raiz, f)));
}

// El tipo de secreto que parece una línea, o null. Lo usan el escaneo al guardar, la revisión de lo que se va a
// subir e issue.js: un solo detector, para que ninguno deje pasar lo que otro bloquea (issue #39, H07).
function tipoDeSecreto(linea) {
  const tipo = PATRONES.find(([, regex]) => regex.test(linea));
  return tipo ? tipo[0] : null;
}

// Lo que se va a subir no es solo cómo están hoy los ficheros: son todos los guardados que aún no están en el
// remoto. Un secreto que se escribió y se borró después sigue en uno de ellos y subiría con la historia. Se miran
// las líneas añadidas en cada uno (sin enseñar el valor). Sin rama remota todavía, se mira la historia entera.
function escanearSalientes(raiz) {
  const git = args => spawnSync('git', args, { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const arriba = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const rango = arriba.status === 0 ? `${arriba.stdout.trim()}..HEAD` : 'HEAD';
  const log = git(['log', '-p', '--no-color', '--no-ext-diff', '--format=@@commit %h', rango]);
  if (log.status !== 0) return [];
  const hallazgos = [];
  let commit = '';
  let fichero = '';
  for (const linea of log.stdout.split(/\r?\n/)) {
    if (linea.startsWith('@@commit ')) { commit = linea.slice(9); continue; }
    if (linea.startsWith('+++ ')) { fichero = linea.replace(/^\+\+\+ (b\/)?/, ''); continue; }
    if (!linea.startsWith('+') || FUERA.some(patron => patron.test(fichero))) continue;
    const tipo = tipoDeSecreto(linea);
    if (tipo && !hallazgos.some(h => h.commit === commit && h.fichero === fichero)) hallazgos.push({ commit, fichero, tipo });
  }
  return hallazgos;
}

function escanearSecretos(raiz) {
  const hallazgos = [];
  for (const rel of ficherosCandidatos(raiz)) {
    if (FUERA.some(patron => patron.test(rel))) continue;
    const abs = path.join(raiz, ...rel.split('/'));
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    if (NOMBRES_DE_SECRETOS.test(path.posix.basename(rel))) {
      hallazgos.push({ regla: 'secreto', fichero: rel, detalle: 'fichero de secretos sin ignorar: añádelo a .gitignore' });
      continue;
    }
    if (fs.statSync(abs).size > MAX_BYTES) continue;
    const contenido = fs.readFileSync(abs, 'utf8');
    if (contenido.includes('\0')) continue;
    contenido.split(/\r?\n/).forEach((linea, i) => {
      const tipo = tipoDeSecreto(linea);
      if (tipo) hallazgos.push({ regla: 'secreto', fichero: rel, detalle: `línea ${i + 1}: ${tipo}` });
    });
  }
  return hallazgos;
}

module.exports = { escanearSecretos, escanearSalientes, tipoDeSecreto };
