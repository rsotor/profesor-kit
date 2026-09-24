'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { revisarPropiedades } = require('../lib/vault');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

const fm = cuerpo => `---\n${cuerpo}\n---\n# Nota\n`;
const motivos = texto => revisarPropiedades(texto).map(p => [p.linea, p.texto]);

test('lo que el kit escribe y lo que escribe Obsidian al marcar una casilla pasa sin avisos', () => {
  assert.deepEqual(revisarPropiedades(fm([
    'tipo: sesion', 'bloque: 1', 'clases:', '  - "1.3"', '# un comentario', '', 'trabajada: 2026-09-22',
    'estudiada: true', 'orden: 2', 'alias: [a, b]', 'nota:', 'fecha: 2026-10-02', 'parcial: false',
    'dificultad: 3', 'intentos: 2', 'nota2: lo que sea', 'notas_libres: texto: con dos puntos',
  ].join('\n'))), []);
  assert.deepEqual(revisarPropiedades('# sin cabecera\n'), []);
  assert.deepEqual(revisarPropiedades(fm('nota: 7,5\nestudiada: TRUE')), [], 'la coma decimal y las mayúsculas se aceptan');
});

test('aprobado y escalon (examen tipo test): mismas reglas que nota y intentos', () => {
  assert.deepEqual(revisarPropiedades(fm('aprobado: 7\nescalon: 2')), []);
  assert.deepEqual(motivos(fm('aprobado: 7/10')), [[2, 'aprobado: 7/10']]);
  assert.deepEqual(motivos(fm('escalon: 1.5')), [[2, 'escalon: 1.5']]);
});

test('señala lo que el alumno escribe a su manera, con la línea del fichero', () => {
  assert.deepEqual(motivos(fm('tipo: sesion\nestudiada: sí')), [[3, 'estudiada: sí']]);
  assert.deepEqual(motivos(fm('estudiada: ok')), [[2, 'estudiada: ok']], 'cualquier forma, no una lista cerrada');
  assert.deepEqual(motivos(fm('nota: 7/10')), [[2, 'nota: 7/10']]);
  assert.deepEqual(motivos(fm('nota: 12')), [[2, 'nota: 12']]);
  assert.deepEqual(motivos(fm('fecha: 2/10/2026')), [[2, 'fecha: 2/10/2026']]);
  assert.deepEqual(motivos(fm('fecha: 2026-02-31')), [[2, 'fecha: 2026-02-31']], 'una fecha que no existe');
  assert.deepEqual(motivos(fm('dificultad: alta')), [[2, 'dificultad: alta']]);
  assert.deepEqual(motivos(fm('estudiada: [true]')), [[2, 'estudiada: [true]']], 'una lista donde va un valor');
  assert.match(revisarPropiedades(fm('estudiada: sí'))[0].motivo, /true o false/);
});

test('señala las líneas que no sabe leer, en vez de saltarlas en silencio', () => {
  const r = revisarPropiedades(fm('tipo: concepto\nesto no es una propiedad\nautor:\n  nombre: Ana'));
  assert.deepEqual(r.map(p => [p.linea, p.texto]), [[3, 'esto no es una propiedad'], [5, 'nombre: Ana']]);
  assert.match(r[0].motivo, /no sabe leer/);
});

test('comprobar lo da como aviso (no bloquea el guardado) y dice qué hacer', () => {
  const raiz = cursoTemporal({ 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nestudiada: sí\n---\n# Intro\n\n## Conceptos\n\n- [[alfa]] — nuevo\n' });
  const informe = comprobar(raiz);
  const aviso = informe.avisos.find(a => a.regla === 'propiedad-no-estandar');
  assert.ok(aviso);
  assert.equal(aviso.fichero, 'sesiones/s01-intro.md');
  assert.match(aviso.detalle, /línea 3: «estudiada: sí».*Cómo escribe en sus notas/);
  assert.ok(!informe.errores.some(e => e.regla === 'propiedad-no-estandar'));
});
