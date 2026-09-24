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
  ejecutar, esMasNueva, etiquetaAnterior, comprobarNoSePierdeNada, huellaDatos,
} = require('../../../pruebas/prueba-actualizar');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

test('esMasNueva: compara número a número, no como texto', () => {
  assert.ok(esMasNueva('0.10.0', '0.9.1'));
  assert.ok(!esMasNueva('0.9.1', '0.10.0'));
  assert.ok(!esMasNueva('0.21.0', '0.21.0'));
});

test('etiquetaAnterior: la release más alta por debajo de la versión, nunca ella misma', () => {
  const etiquetas = ['v0.9.0', 'v0.10.0', 'v0.22.3', 'v0.23.0'];
  assert.equal(etiquetaAnterior('0.24.0', etiquetas), 'v0.23.0', 'la versión nueva, aún sin publicar');
  assert.equal(etiquetaAnterior('0.23.0', etiquetas), 'v0.22.3', 'ya publicada: la de antes');
  assert.equal(etiquetaAnterior('0.10.0', etiquetas), 'v0.9.0');
  assert.equal(etiquetaAnterior('0.9.0', etiquetas), null);
  assert.equal(etiquetaAnterior('1.0.0', []), null);
});

const PIE = '%% navegación: la genera guardar.js; no se edita a mano %%\n\n---\n[[inicio]]\n%% fin de la navegación %%';

test('huellaDatos: tamaño y huella del contenido bajo estudio/ y config/, sin .obsidian ni el pie de navegación', () => {
  const raiz = temporal('prueba-actualizar-');
  fs.mkdirSync(path.join(raiz, 'estudio', 'sesiones'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'estudio', '.obsidian'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'config'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'estudio', 'sesiones', 's1.md'), `hola\n\n${PIE}\n`);
  fs.writeFileSync(path.join(raiz, 'estudio', '.obsidian', 'workspace.json'), '{}');
  fs.writeFileSync(path.join(raiz, 'config', 'diario.md'), '- uno\n');
  const antes = huellaDatos(raiz);
  assert.ok(![...antes.keys()].some(k => k.includes('.obsidian')));
  assert.equal(antes.get('config/diario.md').texto, '- uno\n', 'el diario se guarda entero');
  fs.writeFileSync(path.join(raiz, 'estudio', 'sesiones', 's1.md'), `hola\n\n${PIE.replace('[[inicio]]', '← [[s0]] · [[inicio]]')}\n`);
  assert.equal(huellaDatos(raiz).get('estudio/sesiones/s1.md').hash, antes.get('estudio/sesiones/s1.md').hash, 'otro pie, misma nota');
  fs.writeFileSync(path.join(raiz, 'estudio', 'sesiones', 's1.md'), `holA\n\n${PIE}\n`);
  assert.notEqual(huellaDatos(raiz).get('estudio/sesiones/s1.md').hash, antes.get('estudio/sesiones/s1.md').hash, 'mismo tamaño, otro contenido');
});

const f = (hash, tamano = 10, texto) => ({ hash, tamano, ...(texto === undefined ? {} : { texto }) });

test('comprobarNoSePierdeNada: sin migraciones, nada del alumno cambia; igual, sin problemas', () => {
  const antes = new Map([['estudio/a.md', f('x')], ['config/alumno.md', f('y')]]);
  assert.deepEqual(comprobarNoSePierdeNada(antes, new Map(antes)), []);
  const problemas = comprobarNoSePierdeNada(antes, new Map([['estudio/a.md', f('otro', 10)], ['config/alumno.md', f('y')]]));
  assert.match(problemas[0], /estudio\/a\.md ha cambiado, y ninguna migración lo explica/);
});

test('comprobarNoSePierdeNada: con migraciones puede reescribir, pero no encoger', () => {
  const antes = new Map([['estudio/a.md', f('x', 10)], ['estudio/b.md', f('x', 10)]]);
  const despues = new Map([['estudio/a.md', f('y', 12)], ['estudio/b.md', f('y', 3)]]);
  const problemas = comprobarNoSePierdeNada(antes, despues, { migro: true });
  assert.equal(problemas.length, 1);
  assert.match(problemas[0], /estudio\/b\.md ha encogido \(10 → 3 bytes\)/);
});

test('comprobarNoSePierdeNada: los generados solo tienen que seguir; el diario solo crece; los ajustes no pierden claves', () => {
  const antes = new Map([
    ['estudio/inicio.md', f('x')],
    ['config/diario.md', f('d1', 10, '- uno\n')],
    ['config/ajustes.json', f('a1', 10, '{"llm":"claude-code","version_datos":1}')],
  ]);
  const bien = new Map([
    ['estudio/inicio.md', f('otro', 2)],
    ['config/diario.md', f('d2', 20, '- uno\r\n- dos\r\n')],
    ['config/ajustes.json', f('a2', 10, '{"llm":"claude-code","version_datos":2,"nuevo":1}')],
  ]);
  assert.deepEqual(comprobarNoSePierdeNada(antes, bien), []);
  const mal = new Map([
    ['estudio/inicio.md', f('otro')],
    ['config/diario.md', f('d3', 5, '- dos\n')],
    ['config/ajustes.json', f('a3', 5, '{"version_datos":2}')],
  ]);
  const problemas = comprobarNoSePierdeNada(antes, mal).join('\n');
  assert.match(problemas, /diario\.md ha perdido líneas/);
  assert.match(problemas, /ajustes\.json ha perdido ajustes: llm/);
  assert.doesNotMatch(problemas, /inicio\.md/);
});

test('comprobarNoSePierdeNada: desaparecer sin más es un problema; renombrado a "-anterior" sin encoger, no', () => {
  assert.match(comprobarNoSePierdeNada(new Map([['estudio/a.md', f('x')]]), new Map())[0], /ha desaparecido/);
  const antes = new Map([['estudio/sesiones/s01.md', f('x', 10)]]);
  assert.deepEqual(comprobarNoSePierdeNada(antes, new Map([['estudio/sesiones/s01-anterior.md', f('y', 12)]])), []);
});

// `extraer` inyectado: "reconstruye" la versión anterior copiando la propia copia de trabajo (ni .git ni
// node_modules, para no arrastrar toda la historia a una carpeta temporal). Así nunca toca una etiqueta git de
// verdad, y la actualización es un no-op limpio ("ya tienes la última versión"): lo que se prueba es que el
// ejecutor monta desde la etiqueta, ejecuta, compara huellas y skills, y no deja carpetas atrás.
const copiarCopiaDeTrabajo = (quitar = []) => (trabajo, etiqueta, destino) => fs.cpSync(trabajo, destino, {
  recursive: true,
  filter: src => !['.git', 'node_modules'].includes(path.basename(src)) && !quitar.some(q => src.startsWith(path.join(trabajo, q))),
});

test('ejecutar: sin ninguna release anterior, falla con un mensaje claro (no revienta)', () => {
  const r = ejecutar({ trabajoActual: RAIZ, buscarEtiquetas: () => [] });
  assert.equal(r.hecho, false);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /No hay ninguna release anterior/);
});

test('ejecutar: si la release anterior no trae el curso de su prueba real, lo dice y falla', () => {
  const r = ejecutar({ trabajoActual: RAIZ, buscarEtiquetas: () => ['v0.0.1'], extraer: copiarCopiaDeTrabajo(['pruebas/curso-ejemplo/resultado']) });
  assert.equal(r.hecho, false);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /La v0\.0\.1 no trae pruebas\/curso-ejemplo\/resultado\//);
});

test('ejecutar: parte del curso que trae la etiqueta anterior, monta y compara sin reventar', () => {
  const r = ejecutar({ trabajoActual: RAIZ, buscarEtiquetas: () => ['v0.0.1', 'v99.0.0'], extraer: copiarCopiaDeTrabajo() });
  assert.equal(r.hecho, true);
  assert.equal(r.etiqueta, 'v0.0.1', 'la anterior a la versión de la copia, nunca una posterior');
  assert.equal(r.ok, true, JSON.stringify(r.problemas));
  assert.match(r.salidaActualizar, /Ya tienes la última versión/);
  assert.deepEqual(r.antesSkills, r.despuesSkills);
});
