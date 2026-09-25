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
