'use strict';
// lib/examenes.js: la configuración del examen tipo test (config/examenes.json), con valores por defecto, y el
// aprobado de un examen concreto (su propio aprobado: > el de su tipo > el de config/curso.md > 5).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cursoTemporal } = require('./ayuda');
const ex = require('../lib/examenes');

test('leer: valores por defecto sin fichero, y con uno roto (no revienta)', () => {
  const sinFichero = ex.leer(cursoTemporal());
  assert.equal(sinFichero.opciones, 4);
  assert.equal(sinFichero.resta_fallo, 0);
  assert.equal(sinFichero.tipos.modulo.aprobado, 5);
  assert.equal(sinFichero.tipos.final.escalones.length, 4);
  const roto = ex.leer(cursoTemporal({ 'config/examenes.json': '{ roto' }));
  assert.deepEqual(roto, sinFichero);
});

test('leer: fusiona por claves, sin perder lo que no se toca; los tipos libres se quedan tal cual', () => {
  const raiz = cursoTemporal({
    'config/examenes.json': JSON.stringify({ opciones: 5, tipos: { modulo: { aprobado: 6 }, oral: { preguntas: 3 } } }),
  });
  const cfg = ex.leer(raiz);
  assert.equal(cfg.opciones, 5);
  assert.equal(cfg.resta_fallo, 0);
  assert.deepEqual(cfg.tipos.modulo, { preguntas: 15, aprobado: 6 });
  assert.deepEqual(cfg.tipos.oral, { preguntas: 3 });
  assert.equal(cfg.tipos['lo-que-falta'].preguntas, 5);
});

test('aprobadoDeExamen: el aprobado: propio manda; si no, el de su tipo; si no, el de curso.md; si no, 5', () => {
  assert.equal(ex.aprobadoDeExamen(cursoTemporal(), {}), 5);
  assert.equal(ex.aprobadoDeExamen(cursoTemporal({ 'config/curso.md': '---\naprobado: 6\n---\n# C\n' }), {}), 6);
  const raiz = cursoTemporal({ 'config/examenes.json': JSON.stringify({ tipos: { trimestre: { aprobado: 7 } } }) });
  assert.equal(ex.aprobadoDeExamen(raiz, { tipo_examen: 'trimestre' }), 7);
  assert.equal(ex.aprobadoDeExamen(raiz, { tipo_examen: 'trimestre', aprobado: '9' }), 9, 'el propio del examen gana siempre');
  assert.equal(ex.aprobadoDeExamen(raiz, { tipo_examen: 'algo-que-no-existe' }), 5, 'un tipo sin aprobado cae al defecto');
});

test('aprobadoDeExamen: el escalón del final usa su propio aprobado dentro de escalones', () => {
  const raiz = cursoTemporal({ 'config/examenes.json': JSON.stringify({}) });
  assert.equal(ex.aprobadoDeExamen(raiz, { tipo_examen: 'final', escalon: 1 }), 7);
  assert.equal(ex.aprobadoDeExamen(raiz, { tipo_examen: 'final', escalon: 3 }), 9);
});

test('esDeModulo: sin tipo_examen, o modulo/lo-que-falta, sí; trimestre, final o con escalón, no', () => {
  assert.equal(ex.esDeModulo({}), true);
  assert.equal(ex.esDeModulo({ tipo_examen: 'modulo' }), true);
  assert.equal(ex.esDeModulo({ tipo_examen: 'lo-que-falta' }), true);
  assert.equal(ex.esDeModulo({ tipo_examen: 'trimestre' }), false);
  assert.equal(ex.esDeModulo({ tipo_examen: 'final' }), false);
  assert.equal(ex.esDeModulo({ tipo_examen: 'modulo', escalon: 1 }), false);
});

test('rutaClave: la ruta del examen (relativa a estudio/), quitando "examenes/" y cambiando a .json en config/claves', () => {
  const raiz = cursoTemporal();
  assert.equal(ex.rutaClave(raiz, 'examenes/modulo-01/01-examen.md'), path.join(raiz, 'config', 'claves', 'modulo-01', '01-examen.json'));
});

test('leerClave: falta o rota, error claro; existe, la lee', () => {
  const raiz = cursoTemporal();
  assert.throws(() => ex.leerClave(raiz, 'examenes/01-examen.md'), /falta la clave/);
  fs.mkdirSync(path.join(raiz, 'config', 'claves'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'config', 'claves', '01-examen.json'), '{ roto');
  assert.throws(() => ex.leerClave(raiz, 'examenes/01-examen.md'), /JSON válido/);
  fs.writeFileSync(path.join(raiz, 'config', 'claves', '01-examen.json'), JSON.stringify({ preguntas: [] }));
  assert.deepEqual(ex.leerClave(raiz, 'examenes/01-examen.md'), { preguntas: [] });
  assert.equal(ex.leerClaveSegura(raiz, 'examenes/no-existe.md'), null);
});

test('infoFinal: sin exámenes, el primer escalón pendiente con su aprobado; superado el último, la fecha', () => {
  const raiz = cursoTemporal();
  const vacio = ex.infoFinal(raiz, []);
  assert.deepEqual(vacio, { total: 4, pendiente: 1, aprobado: 7, fechaSuperado: null });

  const escalon1 = { rel: 'examenes/final-1.md', escalon: 1, nota: 8, aprobado: 7, fecha: '2026-11-01' };
  const uno = ex.infoFinal(raiz, [escalon1]);
  assert.deepEqual(uno, { total: 4, pendiente: 2, aprobado: 8, fechaSuperado: null });

  const suspenso = { rel: 'examenes/final-1.md', escalon: 1, nota: 5, aprobado: 7, fecha: '2026-11-01' };
  assert.equal(ex.infoFinal(raiz, [suspenso]).pendiente, 1);

  const todos = [1, 2, 3, 4].map(n => ({ rel: `examenes/final-${n}.md`, escalon: n, nota: 10, aprobado: 7, fecha: `2026-11-0${n}` }));
  assert.deepEqual(ex.infoFinal(raiz, todos), { total: 4, pendiente: null, aprobado: null, fechaSuperado: '2026-11-04' });
});
