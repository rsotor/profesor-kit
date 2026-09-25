'use strict';
// E1 · Repaso espaciado (0.25.0): Leitner de cinco cajas. El alumno marca ✅/❌ debajo de cada tarjeta en Obsidian;
// guardar.js mueve la tarjeta de caja, desmarca y apunta cuándo vuelve. El estado, en config/repaso.json.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const r = require('../lib/repaso');
const { cursoTemporal, iniciarGit, git } = require('./ayuda');

const FC = 'estudio/flashcards/01-dinero.md';
const tarjetas = (...preguntas) => `---\ntipo: flashcards\nsesion: 01-dinero\n---\n# Flashcards · 01-dinero\n\n` +
  preguntas.map(p => `**${p}**\n> [!success]- Respuesta\n> La respuesta de ${p}.\n`).join('\n') +
  '\n---\nConceptos que cubren: [[alfa]]\n';
const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8');
const escribir = (raiz, rel, texto) => fs.writeFileSync(path.join(raiz, ...rel.split('/')), texto);
const estado = raiz => JSON.parse(leer(raiz, 'config/repaso.json')).tarjetas;
const ESTUDIADAS = new Set(['01-dinero']);

test('idTarjeta: la misma pregunta con otros espacios o mayúsculas es la misma tarjeta; otra sesión, otra', () => {
  assert.equal(r.idTarjeta('s1', '¿Qué es  el dinero?'), r.idTarjeta('s1', '¿qué es el dinero? '));
  assert.notEqual(r.idTarjeta('s1', '¿Qué es el dinero?'), r.idTarjeta('s2', '¿Qué es el dinero?'));
});

test('mover: la sabía → sube una caja (hasta la 5); no la sabía → vuelve a la 1', () => {
  assert.deepEqual(r.mover({ caja: 1 }, 'bien', '2026-09-24'), { caja: 2, proxima: '2026-09-27' });
  assert.deepEqual(r.mover({ caja: 4 }, 'bien', '2026-09-24'), { caja: 5, proxima: '2026-10-24' });
  assert.deepEqual(r.mover({ caja: 5 }, 'bien', '2026-09-24'), { caja: 5, proxima: '2026-10-24' });
  assert.deepEqual(r.mover({ caja: 3 }, 'mal', '2026-09-24'), { caja: 1, proxima: '2026-09-25' });
});

test('procesar: una sesión sin estudiar no entra en el repaso; su fichero no se toca', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: new Set() });
  assert.equal(leer(raiz, FC), tarjetas('¿Uno?'));
  assert.equal(fs.existsSync(path.join(raiz, 'config', 'repaso.json')), false);
});

test('procesar: una sesión estudiada entra en la caja 1, le tocan hoy, y cada tarjeta lleva sus casillas', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?', '¿Dos?') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: ESTUDIADAS });
  const texto = leer(raiz, FC);
  assert.match(texto, /\*\*¿Uno\?\*\*\n> \[!success\]- Respuesta\n> La respuesta de ¿Uno\?\.\n\n- \[ \] ✅ la sabía\n- \[ \] ❌ no la sabía\n\*Caja 1 de 5 · te toca el 24\/9\*\n\n\*\*¿Dos\?\*\*/);
  assert.match(texto, /\*Caja 1 de 5 · te toca el 24\/9\*\n\n---\nConceptos/);
  const e = estado(raiz);
  assert.equal(Object.keys(e).length, 2);
  assert.deepEqual(e[r.idTarjeta('01-dinero', '¿Uno?')], { caja: 1, proxima: '2026-09-24', fichero: 'flashcards/01-dinero.md' });
});

test('procesar: lo que marcó mueve la tarjeta, desmarca y apunta cuándo vuelve; es idempotente', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?', '¿Dos?', '¿Tres?') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: ESTUDIADAS });
  const lineas = leer(raiz, FC).split('\n');
  // ¿Uno?: la sabía · ¿Dos?: no la sabía · ¿Tres?: las dos marcadas (cuenta como no la sabía)
  const si = lineas.map((l, i) => (l.startsWith('- [ ] ✅') ? i : -1)).filter(i => i >= 0);
  const no = lineas.map((l, i) => (l.startsWith('- [ ] ❌') ? i : -1)).filter(i => i >= 0);
  lineas[si[0]] = lineas[si[0]].replace('[ ]', '[x]');
  lineas[no[1]] = lineas[no[1]].replace('[ ]', '[X]');
  lineas[si[2]] = lineas[si[2]].replace('[ ]', '[x]');
  lineas[no[2]] = lineas[no[2]].replace('[ ]', '[x]');
  escribir(raiz, FC, lineas.join('\n'));

  r.procesar(raiz, { hoy: '2026-09-25', estudiadas: ESTUDIADAS });
  const texto = leer(raiz, FC);
  assert.doesNotMatch(texto, /\[[xX]\]/);
  assert.match(texto, /¿Uno\?[\s\S]*?\*Caja 2 de 5 · te toca el 28\/9\*/);
  assert.match(texto, /¿Dos\?[\s\S]*?\*Caja 1 de 5 · te toca el 26\/9\*/);
  assert.match(texto, /¿Tres\?[\s\S]*?\*Caja 1 de 5 · te toca el 26\/9\*/);
  assert.equal(estado(raiz)[r.idTarjeta('01-dinero', '¿Uno?')].caja, 2);

  const antes = [leer(raiz, FC), leer(raiz, 'config/repaso.json')];
  r.procesar(raiz, { hoy: '2026-09-25', estudiadas: ESTUDIADAS });
  assert.deepEqual([leer(raiz, FC), leer(raiz, 'config/repaso.json')], antes);
});

test('procesar: una pregunta reescrita es una tarjeta nueva, y la vieja sale del estado', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: ESTUDIADAS });
  escribir(raiz, FC, leer(raiz, FC).replace('**¿Uno?**', '**¿Uno, reescrita?**'));
  r.procesar(raiz, { hoy: '2026-09-26', estudiadas: ESTUDIADAS });
  assert.deepEqual(Object.keys(estado(raiz)), [r.idTarjeta('01-dinero', '¿Uno, reescrita?')]);
  assert.equal((leer(raiz, FC).match(/- \[ \] ✅/g) || []).length, 1);   // no duplica las casillas
  assert.match(leer(raiz, FC), /te toca el 26\/9/);
});

test('procesar: conserva CRLF', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?').replace(/\n/g, '\r\n') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: ESTUDIADAS });
  assert.doesNotMatch(leer(raiz, FC).replace(/\r\n/g, ''), /\n/);
});

test('tramos: lo que toca en los próximos 3 días y lo de la semana siguiente, por fichero', () => {
  const raiz = cursoTemporal({ 'config/repaso.json': JSON.stringify({ version: 1, tarjetas: {
    a: { caja: 1, proxima: '2026-09-20', fichero: 'flashcards/01-dinero.md' },   // atrasada: cuenta en el primero
    b: { caja: 2, proxima: '2026-09-26', fichero: 'flashcards/01-dinero.md' },
    c: { caja: 2, proxima: '2026-09-26', fichero: 'flashcards/02-interes.md' },
    d: { caja: 3, proxima: '2026-10-01', fichero: 'flashcards/02-interes.md' },
    e: { caja: 5, proxima: '2026-11-01', fichero: 'flashcards/02-interes.md' },   // lejos: no sale
  } }) });
  assert.deepEqual(r.tramos(raiz, '2026-09-24'), [
    { hasta: '2026-09-26', ficheros: [{ fichero: 'flashcards/01-dinero.md', n: 2 }, { fichero: 'flashcards/02-interes.md', n: 1 }] },
    { desde: '2026-09-27', hasta: '2026-10-03', ficheros: [{ fichero: 'flashcards/02-interes.md', n: 1 }] },
  ]);
  assert.deepEqual(r.tramos(cursoTemporal(), '2026-09-24'), []);
});

test('guardar: en una copia de preparación en segundo plano no se mueve ninguna tarjeta (se hace al juntar)', () => {
  const { regenerarGenerados } = require('../guardar');
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?'), 'estudio/sesiones/01-dinero.md': '---\ntipo: sesion\nestudiada: true\n---\n# Dinero\n' });
  iniciarGit(raiz);
  git(raiz, 'checkout', '-q', '-b', 'preparacion/02');
  regenerarGenerados(raiz);
  assert.doesNotMatch(leer(raiz, FC), /la sabía/);
  git(raiz, 'checkout', '-q', 'main');
  regenerarGenerados(raiz);
  assert.match(leer(raiz, FC), /la sabía/);
});

test('sinCasillas: quita lo que escribe guardar.js y deja el fichero como lo escribió el profesor', () => {
  const raiz = cursoTemporal({ [FC]: tarjetas('¿Uno?', '¿Dos?') });
  r.procesar(raiz, { hoy: '2026-09-24', estudiadas: ESTUDIADAS });
  assert.notEqual(leer(raiz, FC), tarjetas('¿Uno?', '¿Dos?'));
  assert.equal(r.sinCasillas(leer(raiz, FC)), tarjetas('¿Uno?', '¿Dos?'));
  assert.equal(r.sinCasillas(tarjetas('¿Uno?')), tarjetas('¿Uno?'));
});
