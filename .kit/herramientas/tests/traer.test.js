'use strict';
// guardar.js --traer (plan 0.27, B.2): el curso vive en más de un sitio (el Mac del alumno, un asistente en
// la nube), y nada lo traía de vuelta. Un bare local hace de "GitHub" y un segundo clon hace de "el otro
// sitio": así se prueba con git de verdad, sin tocar la red.
const test = require('node:test');
const { after } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { traer } = require('../guardar');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

// Las carpetas de volcado de un choque (kit-choque-*) son del sistema, no del curso temporal: hay que
// limpiarlas a mano en los tests (revisión de la 0.27, segunda ronda, media 4c).
const carpetasDeVolcado = [];
after(() => { for (const c of carpetasDeVolcado) fs.rmSync(c, { recursive: true, force: true }); });

function conRemoto(raiz) {
  const remoto = temporal('kit-remoto-');
  git(remoto, 'init', '-q', '--bare', '-b', 'main');
  git(raiz, 'remote', 'add', 'origin', remoto);
  git(raiz, 'push', '-q', '-u', 'origin', 'main');
  return remoto;
}

function clonarOtroSitio(remoto) {
  const otroClon = path.join(temporal('kit-otro-'), 'clon');
  git(path.dirname(otroClon), 'clone', '-q', remoto, otroClon);
  git(otroClon, 'config', 'user.name', 'Test');
  git(otroClon, 'config', 'user.email', 'test@example.com');
  git(otroClon, 'config', 'commit.gpgsign', 'false');
  return otroClon;
}
const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8');
const ajustes = subir => JSON.stringify({ subir_a_github: subir, version_datos: 1 });

test('sin remoto, no hay nada que traer', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.deepEqual(traer(raiz), { traido: false, motivo: 'sin-remoto' });
});

test('al día: nada que traer', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  conRemoto(raiz);
  assert.deepEqual(traer(raiz), { traido: true, motivo: 'al-dia' });
});

test('avance rápido: el otro sitio guardó algo y aquí no había nada propio', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde el otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'desde el otro sitio');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  const r = traer(raiz);
  assert.equal(r.traido, true);
  assert.equal(r.motivo, 'avance-rapido');
  assert.equal(leer(raiz, 'estudio/mapa-del-curso.md'), '# Mapa\n\ndesde el otro sitio\n');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), git(remoto, 'rev-parse', 'main'), 'un ff dejó HEAD igual al remoto');
});

// Revisión de la 0.27 (baja, "tests que no prueban lo que dicen"): el título anterior decía que traía
// mapa-del-curso.md del otro sitio, pero solo comprobaba progreso.md (lo local) — y el "previo" (guardar lo
// pendiente antes de traer) deja aquí un commit propio, así que esto diverge y se mezcla; no es un ff (ese
// caso, con lo local ya guardado de antes, tiene su propio test más abajo). Aquí se comprueban las dos cosas
// por separado: (a) lo que estaba sin guardar aquí se guarda solo, antes de traer; (b) lo del otro sitio
// (mapa-del-curso.md) llega tal cual, de verdad, con la mezcla.
test('guarda lo que hubiera sin guardar antes de traer, y lo del otro sitio llega de verdad con la mezcla', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde el otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'desde el otro sitio');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🟡 flojo | ⬜ |\n' });
  const r = traer(raiz);
  assert.equal(r.traido, true);
  assert.equal(r.motivo, 'mezclado', 'el "previo" deja aquí un commit propio: diverge del remoto, no es un ff');
  assert.match(git(raiz, 'log', '--format=%s'), /guardado antes de traer/, 'lo local sin guardar se guardó solo, aparte');
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'lo que estaba sin guardar quedó guardado, no perdido');
  assert.match(leer(raiz, 'estudio/progreso.md'), /flojo/, 'y lo local sigue ahí, tal cual se guardó');
  assert.equal(leer(raiz, 'estudio/mapa-del-curso.md'), '# Mapa\n\ndesde el otro sitio\n', 'y lo del otro sitio llegó de verdad, con su contenido exacto');
  assert.equal(r.subido, true);
  assert.equal(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'), 'la mezcla se subió');
});

test('si no se puede guardar antes de traer (sin identidad), no se toca nada', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde el otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'desde el otro sitio');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  git(raiz, 'config', '--unset', 'user.name');
  git(raiz, 'config', '--unset', 'user.email');
  git(raiz, 'config', 'user.useConfigOnly', 'true');
  escribir(raiz, { 'estudio/inbox/nota.md': 'sin guardar' });
  const antes = git(raiz, 'rev-parse', 'HEAD');
  const r = traer(raiz);
  assert.equal(r.traido, false);
  assert.equal(r.motivo, 'sin-guardar');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), antes);
  assert.equal(leer(raiz, 'estudio/inbox/nota.md'), 'sin guardar');
});

test('un choque real (el mismo cuerpo tocado en los dos lados) no se resuelve solo: el curso queda como estaba', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);

  escribir(otroSitio, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde el otro sitio.\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'alfa (otro sitio)');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  escribir(raiz, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde aquí.\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'alfa (aquí)');
  const antes = git(raiz, 'rev-parse', 'HEAD');
  const estadoAntes = git(raiz, 'status', '--porcelain');

  const r = traer(raiz);
  assert.equal(r.traido, false);
  assert.equal(r.motivo, 'choque');
  assert.deepEqual(r.ficheros, ['estudio/conceptos/alfa.md']);
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), antes, 'el curso principal no se tocó');
  assert.equal(git(raiz, 'status', '--porcelain'), estadoAntes);
  assert.equal(leer(raiz, 'estudio/conceptos/alfa.md'), '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde aquí.\n');
  if (r.volcado) carpetasDeVolcado.push(r.volcado.carpeta);
});

// El ensayo del plan 0.27: los dos lados avanzaron (divergencia), con un generado distinto (inicio.md, porque
// cada lado cambió algo de su temario) y un concepto tocado en los dos lados (progreso.md, por filas) sin choque.
test('divergencia sin choque real: se mezcla, con inicio.md y progreso.md resueltos solos', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);

  // El otro sitio: una clase nueva con un concepto nuevo (cambia conceptos/_index.md, progreso.md e inicio.md).
  escribir(otroSitio, {
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Beta\n\n## El ejemplo\n\nDos.\n',
    'estudio/conceptos/_index.md': '# Índice\n\nslug | definición | bloques | dif | alias\n\n## Conceptos\n\n```\n'
      + 'alfa | La primera letra | B1 | 1 | alias: a, alpha\nbeta | La segunda letra | B1 | 1 | alias:\n```\n',
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ⬜ | ⬜ |\n| [[beta]] | ⬜ | ⬜ |\n',
    'estudio/sesiones/s02-beta.md': '---\ntipo: sesion\n---\n# Beta\n\n- [[beta]] — nuevo\n\n'
      + '## Cobertura del material\n\nTodo quedó en [[beta]].\n\n## Auditoría del material\n\nSin discrepancias.\n\n'
      + '## Para pensarlo despacio\n\n¿Por qué beta es la segunda letra?\n',
  });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'sesion(s02): beta');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  // Aquí: s01 se ha estudiado y su fila de progreso cambia (una fila distinta de la que tocó beta).
  escribir(raiz, {
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nestudiada: true\n---\n# Intro\n\n- [[alfa]] — nuevo\n\n'
      + '## Cobertura del material\n\nToda la diapositiva quedó en [[alfa]].\n\n## Auditoría del material\n\nSin discrepancias.\n\n'
      + '## Para pensarlo despacio\n\n¿Por qué alfa es la primera letra y no la última?\n',
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ examen: bien | ⬜ |\n',
  });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'sesion(s01): estudiada');

  const r = traer(raiz);
  assert.equal(r.traido, true, JSON.stringify(r.informe && r.informe.errores));
  assert.equal(r.motivo, 'mezclado');
  assert.match(r.mensaje, /traer: fusión con origin\/main/);

  const progreso = leer(raiz, 'estudio/progreso.md');
  assert.match(progreso, /\[\[alfa\]\] \| ✅ examen: bien/, 'la fila tocada aquí se queda con el cambio de aquí');
  assert.match(progreso, /\[\[beta\]\]/, 'la fila nueva del otro sitio llega también');

  assert.match(leer(raiz, 'estudio/conceptos/_index.md'), /beta \| La segunda letra/);
  assert.ok(fs.existsSync(path.join(raiz, 'estudio', 'conceptos', 'beta.md')));
  assert.ok(fs.existsSync(path.join(raiz, 'estudio', 'sesiones', 's02-beta.md')));

  // inicio.md es generado entero: se resuelve solo (toma un lado y se regenera), pero el resultado final
  // refleja los dos cambios (s01 estudiada, y la clase nueva de beta), porque se regenera tras la mezcla.
  const inicio = leer(raiz, 'estudio/inicio.md');
  assert.match(inicio, /s02-beta|Beta/);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), git(remoto, 'rev-parse', 'main'), 'y ha subido, porque subir_a_github es true y el remoto es local');
  assert.equal(r.subido, true);
});

test('cli --traer', () => {
  const { cli } = require('../guardar');
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(false) });
  iniciarGit(raiz);
  assert.equal(cli(['--traer'], raiz), 1);   // sin remoto
  conRemoto(raiz);
  const lineas = [];
  const original = console.log;
  console.log = (...a) => lineas.push(a.join(' '));
  try {
    assert.equal(cli(['--traer'], raiz), 0);
  } finally {
    console.log = original;
  }
  assert.match(lineas.join('\n'), /Ya tenías todo lo que hay en GitHub/);
});

// Revisión de la 0.27, alta 3: una excepción entre el merge y el commit no puede dejar MERGE_HEAD colgado.
// config/diario.md sin permiso de escritura (ya existente, de un guardado normal previo) fuerza el fallo justo
// ahí (anotarEnDiario, dentro del bloque protegido, después del merge), sin tocar la red ni depender de una
// condición de carrera. El "guardado antes de traer" se hace ANTES de quitar el permiso, para que el "previo"
// de traer() no tenga nada pendiente y no sea él quien tropiece primero.
test('una excepción entre el merge y el commit aborta y no deja MERGE_HEAD colgado', t => {
  // Revisión, segunda ronda (baja 7): como root, chmod 444 no impide escribir — el truco no vale para forzar
  // la excepción. En vez de fallar en falso ahí, se salta (no hay una vía sin permisos de fichero disponible
  // que no dependa de tocar código de producción solo para el test).
  if (process.getuid && process.getuid() === 0) return t.skip('como root, chmod no bloquea la escritura: no se puede forzar así');
  const { guardar } = require('../guardar');
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ | ⬜ |\n' });
  const rg = guardar({ raiz, mensaje: 'aqui' });
  assert.equal(rg.guardado, true, JSON.stringify(rg.informe.errores));

  const diario = path.join(raiz, 'config', 'diario.md');
  assert.ok(fs.existsSync(diario));
  fs.chmodSync(diario, 0o444);
  try {
    const antes = git(raiz, 'rev-parse', 'HEAD');
    const r = traer(raiz);
    assert.equal(r.traido, false);
    assert.equal(r.motivo, 'error');
    // En Windows, escribir en un fichero de solo lectura da EPERM ("operation not permitted"), no EACCES.
    assert.match(r.detalle, /EACCES|EPERM|permission|permitted|permiso/i);
    assert.equal(git(raiz, 'rev-parse', 'HEAD'), antes, 'no se ha comiteado nada (el previo ya no tenía nada pendiente)');
    const rutaMerge = git(raiz, 'rev-parse', '--git-path', 'MERGE_HEAD');
    assert.equal(fs.existsSync(path.join(raiz, rutaMerge)), false, 'sin MERGE_HEAD colgado');
    assert.equal(git(raiz, 'status', '--porcelain').split('\n').some(l => /^(UU|AA|DD|AU|UA|UD|DU) /.test(l)), false);
  } finally {
    fs.chmodSync(diario, 0o644);
  }
});

// Revisión, alta 4: un merge/rebase/cherry-pick que se quedó a medias de antes (un corte, un fallo que no se
// cazó) no se pisa ni con guardar() ni con traer(): hay que mirarlo antes de seguir.
test('si ya hay un merge sin terminar de antes, guardar y traer se niegan sin tocar nada más', () => {
  const { guardar } = require('../guardar');
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  git(raiz, 'fetch', '-q', 'origin', 'main');
  try { git(raiz, 'merge', '--no-commit', '--no-ff', 'origin/main'); } catch { /* da igual si hay o no conflicto */ }

  const rG = guardar({ raiz, mensaje: 'x' });
  assert.equal(rG.guardado, false);
  assert.equal(rG.motivo, 'merge-en-curso');

  const rT = traer(raiz);
  assert.equal(rT.traido, false);
  assert.equal(rT.motivo, 'sin-guardar');
  assert.match(rT.detalle, /merge-en-curso/);

  git(raiz, 'merge', '--abort');
});

// Revisión, media 7: nunca se sincroniza con el repositorio del kit (por ejemplo, si `origin` se quedó
// apuntando ahí por error, al copiar el propio kit como si fuera el curso).
test('traer: si origin es el repositorio del kit, se niega', () => {
  const raiz = cursoTemporal({
    'config/ajustes.json': ajustes(true),
    '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros: ['AGENTS.md'] }),
  });
  iniciarGit(raiz);
  git(raiz, 'remote', 'add', 'origin', 'https://github.com/rsotor/profesor-kit.git');
  const r = traer(raiz);
  assert.equal(r.traido, false);
  assert.equal(r.motivo, 'remoto-del-kit');
});

// Revisión, media 8: coherente con el avance rápido (que ya deja pasar errores previos con permitirErrores),
// la mezcla solo aborta por errores NUEVOS (o un secreto), nunca por los que ya estaban.
test('errores que ya estaban antes de traer no abortan la mezcla (solo los nuevos, o un secreto)', () => {
  const raiz = cursoTemporal({
    'config/ajustes.json': ajustes(true),
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto-de-siempre]]\n',
  });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ | ⬜ |\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'aqui');

  const r = traer(raiz);
  assert.equal(r.traido, true, JSON.stringify(r.informe && r.informe.errores));
  assert.ok(r.informe.errores.some(e => e.regla === 'enlace-roto'), 'el error viejo sigue en el informe, pero no bloqueó');
});

test('un error NUEVO que trae la mezcla sí aborta, aunque ya hubiera otros de antes', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/sesiones/s02-rota.md': '---\ntipo: sesion\n---\n[[no-existe-de-verdad]]\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'rota');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ | ⬜ |\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'aqui');

  const r = traer(raiz);
  assert.equal(r.traido, false);
  assert.equal(r.motivo, 'errores');
  assert.ok(r.informe.errores.some(e => e.detalle.includes('no-existe-de-verdad')));
  // El "guardado antes de traer" (previo, de lo que hubiera pendiente aquí) es aparte y legítimo: lo que no
  // puede haber pasado es que la MEZCLA (con el error nuevo) se comiteara.
  assert.doesNotMatch(git(raiz, 'log', '-1', '--format=%s'), /^traer: fusión/);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

// NUEVO (revisión, "salida para el choque"): un choque real ya no se queda en "resuélvelo a mano". Da la
// versión del otro sitio volcada fuera del curso, y --conservar repite la mezcla con la elección del profesor.
test('--conservar resuelve el choque con el lado elegido, y sube tras la mezcla', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde el otro sitio.\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'alfa otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde aquí.\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'alfa aqui');

  const primero = traer(raiz);
  assert.equal(primero.motivo, 'choque');
  assert.ok(primero.volcado);
  assert.equal(primero.volcado.detalle[0].ruta, 'estudio/conceptos/alfa.md');
  assert.match(fs.readFileSync(primero.volcado.detalle[0].otroLado, 'utf8'), /Desde el otro sitio/);
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'el curso quedó exactamente como estaba tras el choque');

  const segundo = traer(raiz, { conservar: { 'estudio/conceptos/alfa.md': 'alla' } });
  assert.equal(segundo.traido, true, JSON.stringify(segundo));
  assert.match(leer(raiz, 'estudio/conceptos/alfa.md'), /Desde el otro sitio/);
  assert.equal(segundo.subido, true);
});

test('cli --traer --conservar <ruta>=aqui|alla', () => {
  const { cli } = require('../guardar');
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde el otro sitio.\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'alfa otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde aquí.\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'alfa aqui');

  const lineas = [];
  const original = console.log;
  console.log = (...a) => lineas.push(a.join(' '));
  try {
    assert.equal(cli(['--traer'], raiz), 1);
    assert.match(lineas.join('\n'), /--conservar/);
    lineas.length = 0;
    assert.equal(cli(['--traer', '--conservar', 'estudio/conceptos/alfa.md=aqui'], raiz), 0);
  } finally {
    console.log = original;
  }
  assert.match(leer(raiz, 'estudio/conceptos/alfa.md'), /Desde aquí/);
});

test('cli --traer --conservar con formato inválido: uso y código 2', () => {
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.equal(cli(['--traer', '--conservar', 'algo-sin-igual'], raiz), 2);
});

// Revisión, media 4b: el comando propuesto en el mensaje de choque no elige lado por defecto — lleva "?", y
// el parseo lo rechaza con un mensaje que dice explícitamente que hay que elegir con el alumno, no el genérico
// de "formato inválido".
test('cli --traer --conservar <ruta>=? (sin elegir): se rechaza con un mensaje que pide decidir con el alumno', t => {
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const lineas = [];
  const original = console.error;
  t.mock.method(console, 'error', (...a) => { lineas.push(a.join(' ')); original(...a); });
  assert.equal(cli(['--traer', '--conservar', 'estudio/conceptos/alfa.md=?'], raiz), 2);
  const salida = lineas.join('\n');
  assert.match(salida, /hay que elegir "aqui" o "alla"/);
  assert.ok(!salida.includes('Uso: --conservar'), 'no es el mensaje genérico de formato inválido');
});

// El comando que el propio choque propone tiene que llevar "?" (no elige por defecto) y la ruta entrecomillada
// (revisión, media 2 y 4b).
test('el comando propuesto en un choque lleva "?" sin elegir lado, con la ruta entrecomillada', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde el otro sitio.\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'alfa otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');
  escribir(raiz, { 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nDesde aquí.\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'alfa aqui');

  const { cli } = require('../guardar');
  const lineas = [];
  const original = console.log;
  console.log = (...a) => lineas.push(a.join(' '));
  try {
    assert.equal(cli(['--traer'], raiz), 1);
  } finally {
    console.log = original;
  }
  const salida = lineas.join('\n');
  assert.match(salida, /--conservar "estudio\/conceptos\/alfa\.md=\?"/);
  assert.doesNotMatch(salida, /=aqui"|=alla"/, 'no elige lado por defecto');
  const marcador = path.join(raiz, '.git', 'kit-ultimo-choque');
  if (fs.existsSync(marcador)) carpetasDeVolcado.push(fs.readFileSync(marcador, 'utf8').trim());
});

// Revisión de la 0.27, segunda ronda (media 5): si algo falla DESPUÉS de comitear la mezcla (aquí, la propia
// subida), no es un fallo de traer — la mezcla sí se guardó de verdad. Antes se devolvía siempre
// `traido:false` con "el curso ha quedado exactamente como estaba", que para este caso es falso: el curso YA
// cambió (hay un commit nuevo). `g.ramaActual` (usado por subirSiProcede, justo después de comitear) se
// sustituye para forzar el fallo justo ahí, sin tocar nada de producción: guardar.js llama a `g.algo(...)`
// como acceso a propiedad en cada llamada, no a una copia capturada al hacer require.
test('si algo falla DESPUÉS de comitear la mezcla, se cuenta como éxito con un aviso, no como "no se ha tocado nada"', () => {
  const g = require('../lib/git');
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroSitio = clonarOtroSitio(remoto);
  escribir(otroSitio, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroSitio, 'add', '-A');
  git(otroSitio, 'commit', '-q', '-m', 'otro');
  git(otroSitio, 'push', '-q', 'origin', 'main');

  const { guardar } = require('../guardar');
  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ | ⬜ |\n' });
  const rg = guardar({ raiz, mensaje: 'aqui' });
  assert.equal(rg.guardado, true, JSON.stringify(rg.informe.errores));   // nada pendiente: el "previo" de traer() no llamará a subirSiProcede

  const original = g.ramaActual;
  g.ramaActual = () => { throw new Error('fallo simulado tras comitear'); };
  try {
    const r = traer(raiz);
    assert.equal(r.traido, true, JSON.stringify(r));
    assert.equal(r.motivo, 'mezclado');
    assert.match(r.aviso, /algo falló justo después/);
    assert.match(git(raiz, 'log', '-1', '--format=%s'), /^traer: fusión con origin\/main$/, 'el commit de la mezcla sí se hizo');
  } finally {
    g.ramaActual = original;
  }
});
