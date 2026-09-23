'use strict';
// Recordatorio obligatorio en el CI: un PR que cambia cómo trabaja el profesor (skills, AGENTS.md,
// plantillas) tiene que traer una prueba real hecha en el Mac del mantenedor. Ver CONTRIBUTING.md,
// "Prueba real del profesor".
//
//   node .github/cambio-grande.js [rama-base]     # por defecto, GITHUB_BASE_REF (lo pone Actions en un pull_request)
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');

// Rutas (relativas a la raíz del repo, con /) que cambian cómo trabaja el profesor: si el PR toca
// alguna, tiene que traer también el resumen de una prueba real hecha después de ese cambio.
const TOCA_COMPORTAMIENTO = f => f.startsWith('.kit/skills/') || f === 'AGENTS.md' || f.startsWith('.kit/plantillas/');
const RESUMEN = 'pruebas/curso-ejemplo/resultado/RESUMEN.md';

// `ficheros`: rutas cambiadas en el PR, relativas a la raíz, con /. Pura función de la lista: sin git
// real, se puede probar con cualquier lista inyectada.
// `resumen`: el texto del RESUMEN.md que trae el PR. Uno hecho con `--sin-llm` no cuenta: solo prueba el
// montaje, no al profesor, y con él cualquiera pasaría el check sin haber probado nada.
const DE_PRUEBA = /Modo `--sin-llm`/;
// `alDia`: el RESUMEN.md es de un commit posterior (o el mismo) al último que cambió cómo trabaja el profesor.
// Sin esto, un resumen hecho al principio del PR taparía un cambio de skill hecho después.
function evaluar(ficheros, resumen = '', alDia = true) {
  const tocaComportamiento = ficheros.some(TOCA_COMPORTAMIENTO);
  const tocaResumen = ficheros.includes(RESUMEN);
  const resumenReal = tocaResumen && !DE_PRUEBA.test(resumen);
  return { ok: !tocaComportamiento || (resumenReal && alDia), tocaComportamiento, tocaResumen, resumenReal, alDia };
}

function ficherosCambiados(ramaBase, raiz = RAIZ) {
  const r = spawnSync('git', ['diff', '--name-only', `origin/${ramaBase}...HEAD`], { cwd: raiz, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git diff --name-only origin/${ramaBase}...HEAD falló (¿checkout con fetch-depth 0?): ${(r.stdout || '') + (r.stderr || '')}`);
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

const RUTAS_COMPORTAMIENTO = ['.kit/skills', 'AGENTS.md', '.kit/plantillas'];
const ultimoCommit = (rango, rutas, raiz) => {
  const r = spawnSync('git', ['log', '-1', '--format=%H', rango, '--', ...rutas], { cwd: raiz, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
};
// ¿La prueba real se hizo después del último cambio de comportamiento del PR?
function resumenAlDia(ramaBase, raiz = RAIZ) {
  const rango = `origin/${ramaBase}..HEAD`;
  const comportamiento = ultimoCommit(rango, RUTAS_COMPORTAMIENTO, raiz);
  if (!comportamiento) return { alDia: true };
  const resumen = ultimoCommit(rango, [RESUMEN], raiz);
  if (!resumen) return { alDia: false, comportamiento };
  const r = spawnSync('git', ['merge-base', '--is-ancestor', comportamiento, resumen], { cwd: raiz });
  return { alDia: r.status === 0, comportamiento, resumen };
}

function cli(args) {
  const ramaBase = args[0] || process.env.GITHUB_BASE_REF;
  if (!ramaBase) { console.error('Uso: node .github/cambio-grande.js <rama-base> (o define GITHUB_BASE_REF)'); return 2; }

  let ficheros;
  try { ficheros = ficherosCambiados(ramaBase); } catch (error) { console.error(error.message); return 1; }

  const f = path.join(RAIZ, ...RESUMEN.split('/'));
  const orden = resumenAlDia(ramaBase);
  const r = evaluar(ficheros, require('node:fs').existsSync(f) ? require('node:fs').readFileSync(f, 'utf8') : '', orden.alDia);
  if (!r.ok) {
    console.error(
      'Este PR cambia cómo trabaja el profesor (toca .kit/skills/, AGENTS.md o .kit/plantillas/) pero no '
      + `trae ${RESUMEN} de una prueba real${r.tocaResumen && !r.resumenReal ? ' (el que trae es de --sin-llm)' : ''}`
      + `${r.resumenReal && !r.alDia ? ` hecha después del último cambio (${orden.comportamiento.slice(0, 7)}): el que trae es anterior` : ''}.\n\n`
      + 'Ejecuta `npm run prueba-real` en tu Mac, revisa el resumen y súbelo con este PR.',
    );
    return 1;
  }
  console.log(r.tocaComportamiento ? `OK: el PR toca cómo trabaja el profesor, y trae ${RESUMEN} actualizado.` : 'OK: este PR no cambia cómo trabaja el profesor; no hace falta una prueba real nueva.');
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2)));

module.exports = { evaluar, ficherosCambiados, resumenAlDia, cli, TOCA_COMPORTAMIENTO, RESUMEN };
