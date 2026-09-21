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
const FUERA = '.kit/herramientas/tests/';

function ficherosCandidatos(raiz) {
  const r = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: raiz, encoding: 'utf8' });
  if (r.status === 0) return r.stdout.split('\0').filter(Boolean);
  return recorrer(raiz, () => true, new Set(['.git', 'node_modules'])).map(f => aPosix(path.relative(raiz, f)));
}

function escanearSecretos(raiz) {
  const hallazgos = [];
  for (const rel of ficherosCandidatos(raiz)) {
    if (rel.startsWith(FUERA)) continue;
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
      const tipo = PATRONES.find(([, regex]) => regex.test(linea));
      if (tipo) hallazgos.push({ regla: 'secreto', fichero: rel, detalle: `línea ${i + 1}: ${tipo[0]}` });
    });
  }
  return hallazgos;
}

module.exports = { escanearSecretos };
