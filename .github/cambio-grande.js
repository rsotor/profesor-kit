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
// `completo`: la línea que escribe prueba-real.js#markdownResumen dice que todos los pasos salieron bien y que la
// corrección dio todos los veredictos esperados (issue #39, H08). Un resumen vacío, a medias o con un paso mal
// no demuestra nada.
const LINEA_RESULTADO = /^Resultado: (\d+)\/(\d+) pasos bien · corrección (\d+)\/(\d+) · commit \S+$/m;
function resultadoCompleto(resumen) {
  const m = LINEA_RESULTADO.exec(resumen);
  if (!m) return false;
  const [pasosBien, pasos, veredictosBien, veredictos] = m.slice(1).map(Number);
  return pasos > 0 && pasosBien === pasos && veredictos > 0 && veredictosBien === veredictos;
}
function evaluar(ficheros, resumen = '', alDia = true) {
  const tocaComportamiento = ficheros.some(TOCA_COMPORTAMIENTO);
  const tocaResumen = ficheros.includes(RESUMEN);
  const resumenReal = tocaResumen && !DE_PRUEBA.test(resumen);
  const completo = resultadoCompleto(resumen);
  return { ok: !tocaComportamiento || (resumenReal && completo && alDia), tocaComportamiento, tocaResumen, resumenReal, completo, alDia };
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
// El commit que de verdad se probó: el que apunta prueba-real.js en su línea "Resultado:".
const commitProbado = resumen => (/^Resultado: .* · commit (\S+)$/m.exec(resumen || '') || [])[1] || null;
const esAncestro = (a, b, raiz) => spawnSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: raiz }).status === 0;

// ¿La prueba real se hizo después del último cambio de comportamiento del PR? Dos cosas: que el resumen se subiera
// después de ese cambio y, con su texto, que el código que se probó (su `commit`) ya lo incluya. Sin lo segundo, un
// resumen recién subido pero hecho sobre una copia atrasada pasaba (2026-10-01: dos veces en el mismo día).
function resumenAlDia(ramaBase, raiz = RAIZ, textoResumen = null) {
  const rango = `origin/${ramaBase}..HEAD`;
  const comportamiento = ultimoCommit(rango, RUTAS_COMPORTAMIENTO, raiz);
  if (!comportamiento) return { alDia: true };
  const resumen = ultimoCommit(rango, [RESUMEN], raiz);
  if (!resumen || !esAncestro(comportamiento, resumen, raiz)) return { alDia: false, comportamiento, resumen };
  if (textoResumen === null) return { alDia: true, comportamiento, resumen };
  const corto = commitProbado(textoResumen);
  const r = corto ? spawnSync('git', ['rev-parse', '--verify', '--quiet', `${corto}^{commit}`], { cwd: raiz, encoding: 'utf8' }) : null;
  const probado = r && r.status === 0 ? r.stdout.trim() : null;
  if (!probado) return { alDia: false, comportamiento, resumen, probado: corto || 'desconocido', motivo: 'commit-desconocido' };
  return { alDia: esAncestro(comportamiento, probado, raiz), comportamiento, resumen, probado: corto, motivo: 'commit-viejo' };
}

function cli(args) {
  const ramaBase = args[0] || process.env.GITHUB_BASE_REF;
  if (!ramaBase) { console.error('Uso: node .github/cambio-grande.js <rama-base> (o define GITHUB_BASE_REF)'); return 2; }

  let ficheros;
  try { ficheros = ficherosCambiados(ramaBase); } catch (error) { console.error(error.message); return 1; }

  const f = path.join(RAIZ, ...RESUMEN.split('/'));
  const texto = require('node:fs').existsSync(f) ? require('node:fs').readFileSync(f, 'utf8') : '';
  const orden = resumenAlDia(ramaBase, RAIZ, texto);
  const r = evaluar(ficheros, texto, orden.alDia);
  if (!r.ok) {
    console.error(
      'Este PR cambia cómo trabaja el profesor (toca .kit/skills/, AGENTS.md o .kit/plantillas/) pero no '
      + `trae ${RESUMEN} de una prueba real${r.tocaResumen && !r.resumenReal ? ' (el que trae es de --sin-llm)' : ''}`
      + `${r.resumenReal && !r.alDia && orden.motivo === 'commit-viejo' ? ` hecha sobre el código del PR: el resumen dice que se probó el commit ${orden.probado}, que no incluye el último cambio (${orden.comportamiento.slice(0, 7)}) — ¿la copia de tu Mac iba atrasada?` : ''}`
      + `${r.resumenReal && !r.alDia && orden.motivo === 'commit-desconocido' ? ` de un commit de este repo: el resumen dice que se probó ${orden.probado}, y ese commit no existe aquí` : ''}`
      + `${r.resumenReal && !r.alDia && !orden.motivo ? ` hecha después del último cambio (${orden.comportamiento.slice(0, 7)}): el que trae es anterior` : ''}`
      + `${r.resumenReal && !r.completo ? ' que saliera entera bien: su línea "Resultado:" dice que algún paso o algún veredicto falló, o no la tiene' : ''}.\n\n`
      + 'Ejecuta `npm run prueba-real` en tu Mac, revisa el resumen y súbelo con este PR.',
    );
    return 1;
  }
  console.log(r.tocaComportamiento ? `OK: el PR toca cómo trabaja el profesor, y trae ${RESUMEN} actualizado.` : 'OK: este PR no cambia cómo trabaja el profesor; no hace falta una prueba real nueva.');
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2)));

module.exports = { evaluar, ficherosCambiados, resumenAlDia, commitProbado, cli, TOCA_COMPORTAMIENTO, RESUMEN };
