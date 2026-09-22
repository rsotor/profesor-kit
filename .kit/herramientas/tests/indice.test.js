'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ix = require('../lib/indice');
const { cursoTemporal } = require('./ayuda');

const sesion = ({ fm = '', h1 = 'Tema', conceptos = '' } = {}) =>
  `---\ntipo: sesion\n${fm}---\n# ${h1}\n\n## Conceptos\n\n${conceptos}\n\n## Lo que hay que llevarse\n\n1. x\n`;

test('leerSesiones: id, título sin prefijo, clases, casilla, conceptos nuevos y ampliados', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/m1/01-02-02-03-ratios.md': sesion({
      fm: 'clases: [1.2.2, 1.2.3]\nestudiada: false\ntrabajada: 2026-09-22\n',
      h1: '01-02-02-03 · Ratios de rentabilidad',
      conceptos: '- [[roi]] (**nuevo**)\n- Ampliados: [[volatilidad]], [[roe|el ROE]]',
    }),
  });
  const s = ix.leerSesiones(raiz).find(x => x.id === '01-02-02-03-ratios');
  assert.equal(s.rel, 'sesiones/m1/01-02-02-03-ratios.md');
  assert.equal(s.titulo, 'Ratios de rentabilidad');
  assert.deepEqual(s.clases, ['1.2.2', '1.2.3']);
  assert.deepEqual(s.numeros, [1, 2, 2, 3]);
  assert.equal(s.clave, '01-02-02-03');
  assert.equal(s.estudiada, false);
  assert.deepEqual(s.conceptos, ['roi', 'volatilidad', 'roe']);
});

test('orden del temario: por números, luego orden:, nunca por el alfabeto del slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
    'estudio/sesiones/01-02-04-van-y-tir.md': sesion(),
    'estudio/sesiones/01-10-01-extra.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).filter(s => s.numeros).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids, ['01-02-04-van-y-tir', '01-03-01-renta-variable', '01-03-01-estilos-y-ciclos', '01-10-01-extra']);
});

test('ids sin números van detrás, por fecha trabajada y luego por slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/semana-b.md': sesion({ fm: 'trabajada: 2026-01-02\n' }),
    'estudio/sesiones/semana-a.md': sesion({ fm: 'trabajada: 2026-01-03\n' }),
    'estudio/sesiones/01-01-uno.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids.filter(i => i !== 's01-intro'), ['01-01-uno', 'semana-b', 'semana-a']);
});

test('ordenAmbiguo: mismas cifras y sin orden: → aviso; con orden: en todas → nada', () => {
  const sin = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion(),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion(),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(sin)).map(s => s.id).sort(), ['01-03-01-estilos-y-ciclos', '01-03-01-renta-variable']);
  const con = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(con)), []);
});

test('leerProgreso lee teoría y aplicación de cada fila, aunque el estado lleve texto', () => {
  const raiz = cursoTemporal({
    'estudio/progreso.md': '# P\n\n| Concepto | Teoría | Aplicación | Última prueba |\n|---|---|---|---|\n' +
      '| [[roi]] | ✅ sólido | 🟡 flojo | examen |\n| [[roe\\|ROE]] | ✅ | ⬜ sin evaluar | — |\n',
  });
  const p = ix.leerProgreso(raiz);
  assert.deepEqual(p.get('roi'), { teoria: '✅', aplicacion: '🟡' });
  assert.deepEqual(p.get('roe'), { teoria: '✅', aplicacion: '⬜' });
});

test('estadoProfesor: repasar > superada > faltan N > vacío', () => {
  const p = new Map([
    ['a', { teoria: '✅', aplicacion: '⬜' }],
    ['b', { teoria: '✅', aplicacion: '✅' }],
    ['c', { teoria: '⬜', aplicacion: '⬜' }],
    ['d', { teoria: '✅', aplicacion: '🔴' }],
  ]);
  assert.deepEqual(ix.estadoProfesor(['a', 'd'], p), { marca: 'repasar' });
  assert.deepEqual(ix.estadoProfesor(['a', 'b'], p), { marca: 'superada' });
  assert.deepEqual(ix.estadoProfesor(['a', 'c', 'x'], p), { marca: 'faltan', faltan: 2 });
  assert.deepEqual(ix.estadoProfesor(['c'], p), { marca: 'vacio' });
  assert.deepEqual(ix.estadoProfesor([], p), { marca: 'vacio' });
});
