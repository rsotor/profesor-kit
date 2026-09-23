'use strict';
// Prueba pruebas/prueba-actualizar.js desde aquí (mismo patrón que release-notas.test.js con un
// script fuera de .kit/). Las funciones puras (resolverEtiqueta, comprobarNoSePierdeNada, huellaDatos)
// se prueban sin git real; la integración completa se prueba con un "resultado" fabricado y
// `buscarEtiquetas`/`extraer` inyectados, para no depender de que este repo tenga una etiqueta real
// dos versiones atrás (ver CONTRIBUTING.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { temporal } = require('./ayuda');
const {
  ejecutar, versionDeResumen, esMasNueva, resolverEtiqueta, comprobarNoSePierdeNada, huellaDatos,
} = require('../../../pruebas/prueba-actualizar');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

test('versionDeResumen: la lee del RESUMEN.md tal como la escribe prueba-real.js', () => {
  assert.equal(versionDeResumen('cosas\n- **Versión del kit:** 0.21.0\nmás cosas'), '0.21.0');
  assert.equal(versionDeResumen('nada que ver'), null);
});

test('esMasNueva: compara número a número, no como texto', () => {
  assert.ok(esMasNueva('0.10.0', '0.9.1'));
  assert.ok(!esMasNueva('0.9.1', '0.10.0'));
  assert.ok(!esMasNueva('0.21.0', '0.21.0'));
});

test('resolverEtiqueta: exacta si existe', () => {
  const r = resolverEtiqueta('0.21.0', ['v0.19.0', 'v0.20.0', 'v0.21.0']);
  assert.deepEqual(r, { etiqueta: 'v0.21.0', motivo: null });
});

test('resolverEtiqueta: sin exacta, la release anterior más reciente', () => {
  const r = resolverEtiqueta('0.21.3', ['v0.19.0', 'v0.20.0']);
  assert.equal(r.etiqueta, 'v0.20.0');
  assert.match(r.motivo, /no existe la etiqueta v0\.21\.3/);
});

test('resolverEtiqueta: ninguna igual o anterior, usa la más antigua que hay', () => {
  const r = resolverEtiqueta('0.1.0', ['v0.19.0', 'v0.20.0']);
  assert.equal(r.etiqueta, 'v0.19.0');
  assert.match(r.motivo, /no hay ninguna release igual o anterior/);
});

test('resolverEtiqueta: sin ninguna etiqueta, null', () => {
  assert.equal(resolverEtiqueta('0.21.0', []), null);
});

test('huellaDatos: recoge tamaños bajo estudio/ y config/, sin .obsidian', () => {
  const raiz = temporal('prueba-actualizar-');
  fs.mkdirSync(path.join(raiz, 'estudio', 'conceptos'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'estudio', '.obsidian'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'config'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'estudio', 'conceptos', 'a.md'), 'hola');
  fs.writeFileSync(path.join(raiz, 'estudio', '.obsidian', 'workspace.json'), '{}');
  fs.writeFileSync(path.join(raiz, 'config', 'alumno.md'), 'x');
  const huella = huellaDatos(raiz);
  assert.equal(huella.get('estudio/conceptos/a.md'), 4);
  assert.equal(huella.get('config/alumno.md'), 1);
  assert.ok(![...huella.keys()].some(k => k.includes('.obsidian')));
});

test('comprobarNoSePierdeNada: nada perdido cuando todo sigue igual o más grande', () => {
  const antes = new Map([['estudio/a.md', 10], ['config/alumno.md', 5]]);
  const despues = new Map([['estudio/a.md', 10], ['config/alumno.md', 8]]);
  assert.deepEqual(comprobarNoSePierdeNada(antes, despues), []);
});

test('comprobarNoSePierdeNada: un fichero que encoge es un problema', () => {
  const problemas = comprobarNoSePierdeNada(new Map([['estudio/a.md', 10]]), new Map([['estudio/a.md', 3]]));
  assert.equal(problemas.length, 1);
  assert.match(problemas[0], /ha encogido/);
});

test('comprobarNoSePierdeNada: desaparecer sin más es un problema', () => {
  const problemas = comprobarNoSePierdeNada(new Map([['estudio/a.md', 10]]), new Map());
  assert.match(problemas[0], /ha desaparecido/);
});

test('comprobarNoSePierdeNada: una migración que renombra a "-anterior" no cuenta como pérdida', () => {
  const antes = new Map([['estudio/sesiones/s01.md', 10]]);
  const despues = new Map([['estudio/sesiones/s01-anterior.md', 12]]);
  assert.deepEqual(comprobarNoSePierdeNada(antes, despues), []);
});

test('ejecutar: si no existe resultado/ todavía, lo dice y no falla', () => {
  const resultadoDir = temporal('prueba-actualizar-sin-resultado-');
  fs.rmSync(resultadoDir, { recursive: true, force: true });   // temporal() ya crea la carpeta: aquí se prueba que NO exista
  const r = ejecutar({ trabajoActual: RAIZ, resultadoDir });
  assert.equal(r.hecho, false);
  assert.match(r.motivo, /Todavía no existe/);
});

test('ejecutar: sin ninguna etiqueta disponible, falla con un mensaje claro (no revienta)', () => {
  const resultadoDir = temporal('prueba-actualizar-resultado-');
  fs.mkdirSync(path.join(resultadoDir, 'estudio'), { recursive: true });
  fs.writeFileSync(path.join(resultadoDir, 'RESUMEN.md'), '- **Versión del kit:** 0.21.0\n');
  const r = ejecutar({ trabajoActual: RAIZ, resultadoDir, buscarEtiquetas: () => [] });
  assert.equal(r.hecho, false);
  assert.equal(r.ok, false);
});

// Resultado mínimo fabricado + `extraer`/`buscarEtiquetas` inyectados: nunca toca una etiqueta git de
// verdad ni clona nada. `extraer` aquí "reconstruye" la versión antigua copiando la propia copia de
// trabajo (simula que la etiqueta encontrada es exactamente esta versión): así la actualización real
// que hace actualizar.js es un no-op limpio ("ya tienes la última versión"), que es justo lo que se
// quiere probar: que el ejecutor monta, ejecuta, compara huellas y skills, y no se dejan carpetas atrás.
test('ejecutar: con un resultado fabricado y una "etiqueta" inyectada, monta y compara sin reventar', () => {
  const EJEMPLO = path.join(RAIZ, 'pruebas', 'curso-ejemplo');
  const resultadoDir = temporal('prueba-actualizar-resultado-');
  fs.writeFileSync(path.join(resultadoDir, 'RESUMEN.md'), '- **Versión del kit:** 9.9.9\n');
  fs.mkdirSync(path.join(resultadoDir, 'config'), { recursive: true });
  fs.cpSync(path.join(EJEMPLO, 'estudio'), path.join(resultadoDir, 'estudio'), { recursive: true });
  fs.copyFileSync(path.join(EJEMPLO, 'config', 'alumno.md'), path.join(resultadoDir, 'config', 'alumno.md'));

  const r = ejecutar({
    trabajoActual: RAIZ, resultadoDir,
    buscarEtiquetas: () => ['v9.9.9'],
    // Copia solo lo que hace falta (motor.json apunta al resto): ni .git ni node_modules, para no
    // arrastrar toda la historia del repo a una carpeta temporal en cada test.
    extraer: (trabajo, etiqueta, destino) => fs.cpSync(trabajo, destino, {
      recursive: true, filter: src => !['.git', 'node_modules'].includes(path.basename(src)),
    }),
  });

  assert.equal(r.hecho, true);
  assert.equal(r.etiqueta, 'v9.9.9');
  assert.equal(r.ok, true, JSON.stringify(r.problemas));
  assert.match(r.salidaActualizar, /Ya tienes la última versión/);
  assert.deepEqual(r.antesSkills, r.despuesSkills);
});
