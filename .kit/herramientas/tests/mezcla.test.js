'use strict';
// lib/mezcla.js: lo que resuelve solo un conflicto de git (--juntar en preparar.js, --traer en guardar.js).
// Revisión de la 0.27 (alta 3, "salida para el choque"): un checkout que no encuentra su lado (un conflicto
// DU/UD) nunca puede lanzar y dejar el merge a medias; se reporta como cualquier otro choque, sin excepción.
const test = require('node:test');
const { after } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { resolverConflictos, ficherosEnConflicto, volcarVersionAjena, resolverPorTrozos } = require('../lib/mezcla');
const { cursoTemporal, escribir, iniciarGit, git } = require('./ayuda');

// Revisión, media 4c: las carpetas de volcado (kit-choque-*) son del sistema, no del curso — los tests las
// limpian ellos mismos para no dejar basura acumulada en el temporal (se encontraron 28 sueltas).
const carpetasDeVolcado = [];
after(() => { for (const c of carpetasDeVolcado) fs.rmSync(c, { recursive: true, force: true }); });

// `git merge` sale con un código distinto de 0 cuando deja un conflicto: es lo esperado en estos montajes, no
// un fallo del test. `git()` (ayuda.js) lanza con cualquier código que no sea 0: aquí se ignora a propósito.
function merge(raiz, ...args) { try { git(raiz, 'merge', ...args); } catch { /* conflicto esperado */ } }

// Un conflicto DU de verdad en un fichero generado entero: main ("aqui"/ours) lo borra, la otra rama
// ("alla"/theirs, "el otro sitio" en --traer) lo modifica.
function conflictoDU(raiz, rel) {
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { [rel]: 'modificado en la otra rama\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'modifica en otra');
  git(raiz, 'checkout', '-q', 'main');
  git(raiz, 'rm', '-q', rel);
  git(raiz, 'commit', '-q', '-m', 'borra en main');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
}

// Al revés: "el otro sitio" (otra/theirs) es quien borra; aquí (main/ours) lo modifica.
function conflictoUD(raiz, rel) {
  git(raiz, 'checkout', '-q', '-b', 'otra');
  git(raiz, 'rm', '-q', rel);
  git(raiz, 'commit', '-q', '-m', 'borra en otra');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { [rel]: 'modificado aquí\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'modifica aquí');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
}

test('resolverConflictos: un conflicto DU (checkout --ours sin versión "ours") no lanza, se reporta como choque', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  conflictoDU(raiz, 'estudio/inicio.md');
  const conflictos = ficherosEnConflicto(raiz);
  assert.deepEqual(conflictos, ['estudio/inicio.md']);

  assert.doesNotThrow(() => resolverConflictos(raiz, conflictos));
  const r = resolverConflictos(raiz, conflictos);
  assert.equal(r.ok, false);
  assert.deepEqual(r.ficheros, ['estudio/inicio.md']);

  // El repo sigue en un merge a medias, pero sano: un --abort limpio, sin nada raro.
  assert.equal(git(raiz, 'merge', '--abort'), '');
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

// Revisión de la 0.27 (media 3): en un DU (aquí lo borra, en el otro sitio lo modifica), "conservar aqui" ya
// no es un fallo — es quedarse con el borrado, de verdad (git rm), no un "no se ha podido" más.
test('resolverConflictos con --conservar en un DU: "alla" trae el contenido, "aqui" conserva el borrado', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  conflictoDU(raiz, 'estudio/inicio.md');
  const conflictos = ficherosEnConflicto(raiz);
  const conAlla = resolverConflictos(raiz, conflictos, { conservar: { 'estudio/inicio.md': 'alla' } });
  assert.equal(conAlla.ok, true);
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'inicio.md'), 'utf8'), /modificado en la otra rama/);
  git(raiz, 'merge', '--abort');

  const raiz2 = cursoTemporal();
  iniciarGit(raiz2);
  conflictoDU(raiz2, 'estudio/formulario.md');
  const conflictos2 = ficherosEnConflicto(raiz2);
  const conAqui = resolverConflictos(raiz2, conflictos2, { conservar: { 'estudio/formulario.md': 'aqui' } });
  assert.equal(conAqui.ok, true, '"aqui" (aquí se borró): quedarse con ese lado es borrarlo, no un choque');
  assert.ok(!fs.existsSync(path.join(raiz2, 'estudio', 'formulario.md')));
  assert.equal(git(raiz2, 'status', '--porcelain', '--', 'estudio/formulario.md'), '', 'el índice también lo refleja: nada a medias');
});

test('volcarVersionAjena: deja la versión "del otro sitio" en un fichero fuera del curso, legible', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const base = 'estudio/mapa-del-curso.md';
  git(raiz, 'checkout', '-q', '-b', 'rama-b');
  escribir(raiz, { [base]: '# Mapa\n\ndesde el otro sitio\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'b');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { [base]: '# Mapa\n\ndesde aquí\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'a');
  merge(raiz, '--no-commit', '--no-ff', 'rama-b');
  const conflictos = ficherosEnConflicto(raiz);
  assert.deepEqual(conflictos, [base]);

  const volcado = volcarVersionAjena(raiz, conflictos);
  carpetasDeVolcado.push(volcado.carpeta);
  assert.ok(fs.existsSync(volcado.carpeta));
  assert.equal(volcado.detalle.length, 1);
  assert.equal(volcado.detalle[0].ruta, base);
  assert.match(fs.readFileSync(volcado.detalle[0].otroLado, 'utf8'), /desde el otro sitio/);
  assert.ok(!volcado.carpeta.startsWith(raiz), 'fuera del curso de verdad, no dentro de raiz');
  git(raiz, 'merge', '--abort');
});

// Revisión, media 3: distingue "en el otro sitio se borró" de "no se ha podido leer" — no es lo mismo, y el
// alumno necesita saber cuál de los dos pasó.
test('volcarVersionAjena: si en el otro sitio se borró el fichero, lo dice (no como si no se pudiera leer)', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  conflictoUD(raiz, 'estudio/inicio.md');   // "el otro sitio" (otra/theirs) borra; aquí lo modifica
  const conflictos = ficherosEnConflicto(raiz);
  const volcado = volcarVersionAjena(raiz, conflictos);
  carpetasDeVolcado.push(volcado.carpeta);
  assert.equal(volcado.detalle.length, 1);
  assert.equal(volcado.detalle[0].ruta, 'estudio/inicio.md');
  assert.equal(volcado.detalle[0].borradoEnElOtroSitio, true);
  assert.equal(volcado.detalle[0].otroLado, null, 'sin fichero de volcado: nada que enseñar de ese lado');
  git(raiz, 'merge', '--abort');

  // Al revés: el otro sitio SÍ tiene contenido (lo modifica), aquí lo borramos — su versión sí se puede leer.
  const raiz2 = cursoTemporal();
  iniciarGit(raiz2);
  conflictoDU(raiz2, 'estudio/inicio.md');
  const conflictos2 = ficherosEnConflicto(raiz2);
  const volcado2 = volcarVersionAjena(raiz2, conflictos2);
  carpetasDeVolcado.push(volcado2.carpeta);
  assert.equal(volcado2.detalle[0].borradoEnElOtroSitio, undefined);
  assert.ok(fs.existsSync(volcado2.detalle[0].otroLado));
  git(raiz2, 'merge', '--abort');
});

// Revisión, media 2: una ruta con espacios y tildes no puede salir entrecomillada ni con los acentos escapados
// (lo que da `git status --porcelain` sin -z) — si no, no se reconoce como el mismo fichero al repetir con
// --conservar.
test('ficherosEnConflicto: una ruta con espacios y tildes sale tal cual, sin comillas ni escapar', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const rel = 'estudio/conceptos/Clase 3 Álgebra.md';
  // El fichero tiene que existir ya en la base común: si no, "borrarlo en main" no tiene nada que borrar.
  escribir(raiz, { [rel]: 'contenido base\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'añade la clase');
  conflictoDU(raiz, rel);
  const conflictos = ficherosEnConflicto(raiz);
  assert.deepEqual(conflictos, [rel]);
  git(raiz, 'merge', '--abort');
});

// Revisión, media 4a: --conservar resuelve por TROZOS, no el fichero entero — lo que cada lado cambió sin
// chocar se queda de los dos; solo el trozo que de verdad se pisa se decide con el lado elegido.
test('resolverConflictos con --conservar: por trozos — un choque en una línea no descarta un cambio sin chocar en otra', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const rel = 'estudio/conceptos/multi.md';
  const comun = '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Multi\n\n## El ejemplo\n\nL1 común\nL2\nL3\nL4\nL5\nL6 común\n';
  escribir(raiz, { [rel]: comun });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'base');
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { [rel]: comun.replace('L1 común', 'L1 desde el otro sitio') });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'otra toca L1');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { [rel]: comun.replace('L1 común', 'L1 desde aquí').replace('L6 común', 'L6 cambiado solo aquí') });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'aqui toca L1 y L6');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
  const conflictos = ficherosEnConflicto(raiz);
  assert.deepEqual(conflictos, [rel]);

  const r = resolverConflictos(raiz, conflictos, { conservar: { [rel]: 'aqui' } });
  assert.equal(r.ok, true);
  const final = fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8');
  assert.match(final, /L1 desde aquí/, 'el choque en L1 se resolvió con "aqui"');
  assert.doesNotMatch(final, /L1 desde el otro sitio/);
  assert.match(final, /L6 cambiado solo aquí/, 'L6 no chocaba: el cambio de aquí se conserva igual, por trozos');
  assert.deepEqual(ficherosEnConflicto(raiz), [], 'ya no queda en conflicto');
});

test('resolverPorTrozos: sin versión en una de las dos etapas (DU/UD), null — no hay dos lados que fusionar', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  conflictoDU(raiz, 'estudio/inicio.md');
  const conflictos = ficherosEnConflicto(raiz);
  assert.equal(resolverPorTrozos(raiz, conflictos[0], 'aqui'), null);
  git(raiz, 'merge', '--abort');
});

// --- #56, prueba real del 2026-10-01: una nota de concepto tocada en los dos lados ------------------------------

const NOTA_BASE = ['---', 'tipo: concepto', 'bloques: [1.2]', 'visto_en: [01-02-01-presupuesto]', 'dificultad: 2',
  'requiere: [presupuesto]', '---', '# Tasa de ahorro', '', 'Qué parte de lo que ganas te queda.', '', '## Historial', '',
  '- **01-02-01** · primera vez', ''].join('\n');

// Bifurca desde la nota base: `aqui` es lo que hace main (la tutoría) y `alla` lo que hace la otra rama (la preparación).
function choqueEnNota(aqui, alla) {
  const raiz = cursoTemporal();
  const rel = 'estudio/conceptos/tasa-de-ahorro.md';
  escribir(raiz, { [rel]: NOTA_BASE });
  iniciarGit(raiz);
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { [rel]: alla(NOTA_BASE) });
  git(raiz, 'commit', '-q', '-am', 'amplía en la otra');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { [rel]: aqui(NOTA_BASE) });
  git(raiz, 'commit', '-q', '-am', 'cambia en main');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
  return { raiz, rel, abs: path.join(raiz, ...rel.split('/')) };
}
const subeDificultad = t => t.replace('dificultad: 2', 'dificultad: 3');
const amplia = t => t.replace('bloques: [1.2]', 'bloques: [1.2, 2.2]')
  .replace('visto_en: [01-02-01-presupuesto]', 'visto_en: [01-02-01-presupuesto, 02-02-01-ahorro]')
  .replace('## Historial', '## A largo plazo\n\nLa tasa se convierte en una cantidad regular.\n\n## Historial')
  .replace('- **01-02-01** · primera vez\n', '- **01-02-01** · primera vez\n- **02-02-01** · ampliada\n');

test('resolverConflictos: una nota de concepto, un campo de la cabecera aquí y la ampliación allí → se juntan los dos', () => {
  const { raiz, rel, abs } = choqueEnNota(subeDificultad, amplia);
  assert.deepEqual(ficherosEnConflicto(raiz), [rel], 'git solo no sabe: son líneas contiguas');
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: true });
  const nota = fs.readFileSync(abs, 'utf8');
  assert.match(nota, /^dificultad: 3$/m, 'lo de la tutoría');
  assert.match(nota, /^bloques: \[1\.2, 2\.2\]$/m);
  assert.match(nota, /^visto_en: \[01-02-01-presupuesto, 02-02-01-ahorro\]$/m, 'lo de la preparación');
  assert.match(nota, /## A largo plazo[\s\S]*- \*\*02-02-01\*\* · ampliada/);
  assert.doesNotMatch(nota, /<<<<<<<|>>>>>>>/);
  assert.equal(nota, amplia(subeDificultad(NOTA_BASE)));
});

test('resolverConflictos: el mismo campo de la cabecera cambiado distinto en los dos lados sigue siendo un choque', () => {
  const { raiz, rel } = choqueEnNota(subeDificultad, t => amplia(t).replace('dificultad: 2', 'dificultad: 1'));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: false, ficheros: [rel] });
});

test('resolverConflictos: la misma línea del cuerpo cambiada en los dos lados sigue siendo un choque', () => {
  const { raiz, rel } = choqueEnNota(t => subeDificultad(t).replace('Qué parte', 'Cuánto'), t => amplia(t).replace('Qué parte', 'Qué fracción'));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: false, ficheros: [rel] });
});


// --- la duda del alumno (callout al final) y la ampliación de la preparación (línea de historial) añaden en el mismo punto ---

const NOTA_COLCHON = ['---', 'tipo: concepto', 'alias: [colchon]', 'visto_en: [02-01-01-presupuesto]', 'dificultad: 2', '---',
  '# Colchón financiero', '', 'Dinero apartado para imprevistos.', '', '## Historial', '',
  '- **02-01-01-presupuesto** · primera vez', ''].join('\n');
const DUDA = ['', '> [!question]- Duda (2026-10-02)', '> ¿Cuántos meses?', '>', '> Entre tres y seis meses de gastos fijos.', ''].join('\n');
const LINEA_CLASE = '- **02-02-01-ahorro** · la clase lo llama «fondo de emergencia»: es el mismo concepto\n';
const preparacionAmplia = t => t.replace('alias: [colchon]', 'alias: [colchon, fondo de emergencia]')
  .replace('visto_en: [02-01-01-presupuesto]', 'visto_en: [02-01-01-presupuesto, 02-02-01-ahorro]') + LINEA_CLASE;

function choqueConBase(base, aqui, alla) {
  const raiz = cursoTemporal();
  const rel = 'estudio/conceptos/colchon-financiero.md';
  escribir(raiz, { [rel]: base });
  iniciarGit(raiz);
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { [rel]: alla(base) });
  git(raiz, 'commit', '-q', '-am', 'amplía en la otra');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { [rel]: aqui(base) });
  git(raiz, 'commit', '-q', '-am', 'cambia en main');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
  return { raiz, rel, abs: path.join(raiz, ...rel.split('/')) };
}

test('resolverConflictos: la duda (callout al final) y la línea de historial de la preparación se quedan las dos, la línea pegada a su lista', () => {
  const { raiz, rel, abs } = choqueConBase(NOTA_COLCHON, t => t + DUDA, preparacionAmplia);
  assert.deepEqual(ficherosEnConflicto(raiz), [rel]);
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: true });
  const nota = fs.readFileSync(abs, 'utf8');
  assert.doesNotMatch(nota, /<<<<<<<|>>>>>>>|\|\|\|\|\|\|\||^=======$/m);
  assert.match(nota, /^alias: \[colchon, fondo de emergencia\]$/m);
  assert.match(nota, /^visto_en: \[02-01-01-presupuesto, 02-02-01-ahorro\]$/m);
  assert.ok(nota.endsWith(`- **02-01-01-presupuesto** · primera vez\n${LINEA_CLASE}${DUDA}`), 'línea, línea en blanco y el callout entero');
  assert.equal(git(raiz, 'status', '--porcelain').split('\n').filter(l => /^(UU|AA)/.test(l)).length, 0, 'sin conflicto pendiente');
});

test('resolverConflictos: dos lados que añaden en medio del fichero, en el mismo punto, se quedan los dos (la preparación primero)', () => {
  const { raiz, rel, abs } = choqueConBase(NOTA_COLCHON,
    t => t.replace('## Historial', 'Aquí: una nota del alumno.\n\n## Historial'),
    t => t.replace('## Historial', 'Allá: un párrafo de la clase.\n\n## Historial'));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: true });
  const nota = fs.readFileSync(abs, 'utf8');
  assert.match(nota, /Allá: un párrafo de la clase\.\n\nAquí: una nota del alumno\.\n\n## Historial/);
  assert.doesNotMatch(nota, /<<<<<<<|>>>>>>>/);
});

test('resolverConflictos: los dos lados cambian la misma línea que ya existía → sigue siendo un choque', () => {
  const { raiz, rel } = choqueConBase(NOTA_COLCHON,
    t => t.replace('imprevistos', 'urgencias'),
    t => preparacionAmplia(t).replace('imprevistos', 'emergencias'));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: false, ficheros: [rel] });
});

test('resolverConflictos: añadir en el mismo punto a la vez que se cambia una línea que ya existía en ese trozo sigue siendo un choque', () => {
  const { raiz, rel } = choqueConBase(NOTA_COLCHON,
    t => t.replace('· primera vez', '· primera vez (corregida)'),
    t => t.replace('· primera vez\n', '· primera vez\n- **02-02-01-ahorro** · ampliada\n'));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: false, ficheros: [rel] });
});

test('resolverConflictos: las dos adiciones con fin de línea CRLF se juntan sin marcadores', () => {
  const crlf = t => t.replace(/\n/g, '\r\n');
  const { raiz, rel, abs } = choqueConBase(NOTA_COLCHON, t => t + crlf(DUDA), t => t + crlf(LINEA_CLASE));
  assert.deepEqual(resolverConflictos(raiz, [rel]), { ok: true });
  const nota = fs.readFileSync(abs, 'utf8');
  assert.doesNotMatch(nota, /<<<<<<<|>>>>>>>|\|\|\|\|\|\|\|/);
  assert.match(nota, /primera vez\n- \*\*02-02-01-ahorro\*\*[^\n]*\r\n\r?\n> \[!question\]- Duda/);
});

// --- revisión independiente de juntarCuerpo ---

const CABECERA = ['---', 'tipo: concepto', 'alias: [x]', 'dificultad: 2', '---', '# Git', '', 'Apuntes.', ''].join('\n');
const BASE_LISTA = CABECERA + '\n- a\n';
const juntada = (base, aqui, alla) => {
  const { raiz, rel, abs } = choqueConBase(base, aqui, alla);
  const r = resolverConflictos(raiz, [rel]);
  return { r, rel, nota: fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '' };
};

test('juntarCuerpo: un bloque de código con marcadores de 7 dentro se junta, el bloque intacto y la línea del otro lado fuera', () => {
  const bloque = '```\n<<<<<<< HEAD\nx\n=======\ny\n>>>>>>> otra\n```\n';
  const { r, nota } = juntada(BASE_LISTA, t => t + '- b\n', t => t + bloque);
  assert.deepEqual(r, { ok: true });
  assert.ok(nota.endsWith(`- a\n${bloque}\n- b\n`) || nota.endsWith(`- a\n- b\n\n${bloque}`), nota);
  assert.ok(nota.includes(bloque), 'el bloque entero e intacto');
  assert.doesNotMatch(nota, /kit-concepto|\/var\/|\/tmp\//);
  assert.equal(nota.split('>>>>>>>').length - 1, 1, 'ningún marcador de más');
});

test('juntarCuerpo: una línea suelta ">>>>>>> cita" en un lado no se confunde con un marcador', () => {
  const { r, nota } = juntada(BASE_LISTA, t => t + '- b\n', t => t + '>>>>>>> cita\n');
  assert.deepEqual(r, { ok: true });
  assert.equal(nota.split('>>>>>>> cita').length - 1, 1);
  assert.match(nota, /- b/);
  assert.doesNotMatch(nota, /kit-concepto|\/var\/|\/tmp\//);
});

test('juntarCuerpo: un título setext con ======= no es un choque', () => {
  const { r, nota } = juntada(BASE_LISTA, t => t + '- b\n', t => t + '\nOtro título\n=======\n');
  assert.deepEqual(r, { ok: true });
  assert.match(nota, /Otro título\n=======\n/);
  assert.match(nota, /- b\n/);
});

test('juntarCuerpo: si un cuerpo ya trae una línea de 31 "<", no se puede distinguir y es un choque', () => {
  const { r, rel } = juntada(BASE_LISTA, t => t + '- b\n', t => t + '<'.repeat(31) + ' raro\n');
  assert.deepEqual(r, { ok: false, ficheros: [rel] });
});

test('juntarCuerpo: las líneas iniciales comunes de los dos añadidos se escriben una sola vez', () => {
  const { r, nota } = juntada(BASE_LISTA, t => t + '- b\n- c\n', t => t + '- b\n- d\n');
  assert.deepEqual(r, { ok: true });
  assert.ok(nota.endsWith('- a\n- b\n- d\n- c\n'), nota);
  const j = juntada(BASE_LISTA, t => t + '- b\n- c\n', t => t + '- b\n');
  assert.ok(j.nota.endsWith('- a\n- b\n- c\n'), j.nota);
});

test('juntarCuerpo: la preparación añade un callout y el curso una línea de lista tras una lista → la línea no queda huérfana', () => {
  const callout = '\n> [!info] Ampliación fuera de los apuntes\n> Algo más.\n';
  const { r, nota } = juntada(BASE_LISTA, t => t + '- b\n', t => t + callout);
  assert.deepEqual(r, { ok: true });
  assert.ok(nota.endsWith('- a\n- b\n' + callout), nota);
});

// Visto en la prueba real del 2026-10-04: /ejercicio añade «## Practícalo» a media nota y /dudas un callout al final, y la
// preparación añade otra sección en el mismo punto y una línea al historial. Son DOS trozos en conflicto, los dos de solo añadir.
const BASE_SECCIONES = CABECERA + '\n## El error típico\n\nTexto.\n\n## Relacionados\n\n- [[x]]\n\n## Historial\n\n- **s01** · primera vez\n';
const conSeccion = seccion => t => t.replace('## Relacionados', `${seccion}\n\n## Relacionados`);

test('juntarCuerpo: dos trozos en conflicto, los dos de solo añadir, se juntan (merge-file sale con el número de trozos)', () => {
  const aqui = t => conSeccion('## Practícalo\n\n[[ejercicios/e1.html|Un ejercicio]]')(t) + '\n> [!question]- Duda\n> ¿y esto?\n>\n> **Respuesta:** así.\n';
  const alla = t => conSeccion('## Antes de ahorrar (clase 2.2)\n\nOtro nombre del mismo concepto.')(t) + '- **s02** · ampliada\n';
  const { r, nota } = juntada(BASE_SECCIONES, aqui, alla);
  assert.deepEqual(r, { ok: true });
  assert.ok(!/^[<|=>]{7,}/m.test(nota), nota);
  for (const trozo of ['## Practícalo', '[[ejercicios/e1.html|Un ejercicio]]', '## Antes de ahorrar (clase 2.2)', 'Otro nombre del mismo concepto.', '- **s02** · ampliada', '> **Respuesta:** así.']) {
    assert.equal(nota.split(trozo).length, 2, `«${trozo}» tiene que salir una vez:\n${nota}`);
  }
  assert.ok(nota.indexOf('## Antes de ahorrar') < nota.indexOf('## Relacionados') && nota.indexOf('## Practícalo') < nota.indexOf('## Relacionados'), 'las dos secciones nuevas quedan antes de Relacionados');
  assert.ok(nota.indexOf('- **s01** · primera vez\n- **s02** · ampliada\n\n> [!question]- Duda') > 0, `la línea de historial pegada a su lista y el callout detrás:\n${nota}`);
});

test('juntarCuerpo: dos trozos en conflicto y uno cambia una línea que ya existía → sigue siendo un choque', () => {
  const aqui = t => conSeccion('## Practícalo\n\n[[ejercicios/e1.html|Un ejercicio]]')(t).replace('primera vez', 'primera vez, aquí');
  const alla = t => conSeccion('## Antes de ahorrar (clase 2.2)\n\nOtro nombre.')(t).replace('primera vez', 'primera vez, allá');
  const { r } = juntada(BASE_SECCIONES, aqui, alla);
  assert.equal(r.ok, false);
});
