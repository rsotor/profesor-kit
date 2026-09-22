'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../lib/vault');
const { cursoTemporal } = require('./ayuda');

test('listarNotas mira dentro de estudio/ y devuelve rutas relativas a esa carpeta, con /', () => {
  const raiz = cursoTemporal({ 'estudio/inbox/apuntes.md': 'hola', 'conceptos/fuera-de-sitio.md': 'no es del alumno' });
  const notas = v.listarNotas(raiz);
  assert.ok(notas.includes('conceptos/alfa.md'));
  assert.ok(notas.includes('progreso.md'));
  assert.ok(!notas.includes('conceptos/fuera-de-sitio.md'));
  assert.ok(!notas.some(n => n.startsWith('config/') || n.startsWith('estudio/') || n.startsWith('inbox/')));
  assert.ok(v.listarNotas(raiz, { conInbox: true }).includes('inbox/apuntes.md'));
});

test('listarConceptos excluye _index', () => {
  assert.deepEqual(v.listarConceptos(cursoTemporal()), ['alfa']);
});

test('sinCodigo quita bloques y código en línea', () => {
  const texto = 'a [[uno]]\n```\n[[dos]]\n```\nb `[[tres]]` c';
  const limpio = v.sinCodigo(texto);
  assert.ok(limpio.includes('[[uno]]'));
  assert.ok(!limpio.includes('[[dos]]'));
  assert.ok(!limpio.includes('[[tres]]'));
});

test('leerFrontmatter lee escalares, comillas y listas', () => {
  const fm = v.leerFrontmatter('---\ntipo: concepto\nmarcador: "@@"\nalias: [a, "b c"]\nvacia: []\n---\n# x');
  assert.deepEqual(fm, { tipo: 'concepto', marcador: '@@', alias: ['a', 'b c'], vacia: [] });
  assert.equal(v.leerFrontmatter('# sin frontmatter'), null);
});

test('leerMarcador usa @@ por defecto y respeta config/profesor.md', () => {
  assert.equal(v.leerMarcador(cursoTemporal()), '@@');
  assert.equal(v.leerMarcador(cursoTemporal({ 'config/profesor.md': '---\nmarcador_dudas: "??"\n---\n' })), '??');
});

test('leerAjustes aplica valores por defecto si falta el fichero', () => {
  const raiz = cursoTemporal();
  require('node:fs').rmSync(require('node:path').join(raiz, 'config', 'ajustes.json'));
  assert.deepEqual(v.leerAjustes(raiz), { subir_a_github: true, llm: 'claude-code', nombre_curso: '', atajo: '', version_datos: 1, configuracion: { curso: false, estilo: false, nivel: false }, patrones_prohibidos: [] });
});

test('las rutas protegidas son config y la carpeta del alumno entera', () => {
  assert.deepEqual(v.RUTAS_PROTEGIDAS, ['config', 'estudio', 'README.md']);
  assert.equal(v.CARPETA_ALUMNO, 'estudio');
});
