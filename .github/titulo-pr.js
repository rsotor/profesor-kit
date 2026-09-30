'use strict';
// El título del PR es el mensaje del commit en main (se mezcla con squash), así que tiene que decir si
// publica versión o no, y cuadrar con .kit/VERSION. Ver CONTRIBUTING.md, "Títulos de los pull requests".
//
//   TITULO_PR="<título>" node .github/titulo-pr.js [rama-base]     # por defecto, GITHUB_BASE_REF
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const TIPOS = ['arreglo', 'mejora', 'docs', 'ci', 'test', 'build', 'chore'];
const CON_TIPO = new RegExp(`^(${TIPOS.join('|')})(\\([^)]+\\))?: \\S`);
const EMPIEZA_POR_VERSION = /^v?\d+\.\d+/;
const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pura: sin git ni entorno, se prueba con cualquier título y versiones.
// `versionBase`: .kit/VERSION de la rama base; `versionPR`: la del PR.
function evaluarTitulo(titulo, versionBase, versionPR) {
  const t = (titulo || '').trim();
  if (versionPR !== versionBase) {
    const ok = new RegExp(`^${escapar(versionPR)}: \\S`).test(t);
    return { ok, publica: true, motivo: ok ? '' : `este PR sube .kit/VERSION a ${versionPR}: el título tiene que empezar por "${versionPR}: " y decir qué cambia.` };
  }
  if (EMPIEZA_POR_VERSION.test(t)) {
    return { ok: false, publica: false, motivo: `el título empieza por una versión, pero este PR no sube .kit/VERSION (sigue en ${versionPR}): no publica nada. Usa "tipo: qué cambia".` };
  }
  const ok = CON_TIPO.test(t);
  return { ok, publica: false, motivo: ok ? '' : `el título tiene que empezar por un tipo (${TIPOS.join(', ')}), dos puntos y qué cambia. Ej.: "arreglo: guardar no avisa sin identidad de git".` };
}

function versionEn(ref, raiz = RAIZ) {
  const r = spawnSync('git', ['show', `${ref}:.kit/VERSION`], { cwd: raiz, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git show ${ref}:.kit/VERSION falló (¿checkout con fetch-depth 0?): ${(r.stdout || '') + (r.stderr || '')}`);
  return r.stdout.trim();
}

function cli(args, entorno = process.env) {
  const ramaBase = args[0] || entorno.GITHUB_BASE_REF;
  if (!ramaBase || entorno.TITULO_PR === undefined) { console.error('Uso: TITULO_PR="<título>" node .github/titulo-pr.js <rama-base> (o define GITHUB_BASE_REF)'); return 2; }
  let versionBase;
  try { versionBase = versionEn(`origin/${ramaBase}`); } catch (error) { console.error(error.message); return 1; }
  const versionPR = fs.readFileSync(path.join(RAIZ, '.kit', 'VERSION'), 'utf8').trim();
  const r = evaluarTitulo(entorno.TITULO_PR, versionBase, versionPR);
  if (!r.ok) { console.error(`Título del PR: ${r.motivo}\n\nSe cambia en GitHub (Edit, junto al título): el check se repite solo.`); return 1; }
  console.log(`OK: "${entorno.TITULO_PR.trim()}" ${r.publica ? `publica la ${versionPR}` : 'no publica versión'}.`);
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2)));

module.exports = { evaluarTitulo, versionEn, cli, TIPOS };
