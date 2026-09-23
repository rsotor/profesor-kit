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

test('leerFrontmatter entiende listas en bloque, como las escribe Obsidian al marcar una casilla', () => {
  const fm = v.leerFrontmatter('---\ntipo: sesion\nclases:\n  - 1.2.2\n  - "1.2.3"\nestudiada: true\nvacio:\n---\n# X\n');
  assert.deepEqual(fm.clases, ['1.2.2', '1.2.3']);
  assert.equal(fm.estudiada, 'true');
  assert.equal(fm.vacio, '');
  assert.deepEqual(v.leerFrontmatter('---\nclases: [1.1.2]\n---\n').clases, ['1.1.2']);
});

test('esCierto solo acepta true: "false" como texto no cuenta como marcado', () => {
  assert.equal(v.esCierto('true'), true);
  assert.equal(v.esCierto(true), true);
  assert.equal(v.esCierto(' TRUE '), true);
  for (const x of ['false', '', undefined, null, 'sí', '1']) assert.equal(v.esCierto(x), false, String(x));
});

test('numero lee enteros y decimales con coma o punto, y null si no es un número', () => {
  assert.equal(v.numero('7,5'), 7.5);
  assert.equal(v.numero('7.5'), 7.5);
  assert.equal(v.numero(2), 2);
  for (const x of ['', undefined, null, 'siete', '[]']) assert.equal(v.numero(x), null, String(x));
});

test('listarNotas incluye inicio.md si existe, para comprobar sus enlaces', () => {
  const raiz = cursoTemporal({ 'estudio/inicio.md': '# Inicio\n' });
  assert.ok(v.listarNotas(raiz).includes('inicio.md'));
});

test('leerAdaptador: sin ninguno de los dos, null; el del kit si solo está ese', () => {
  assert.equal(v.leerAdaptador(cursoTemporal(), 'claude-code'), null);
  const raiz = cursoTemporal({ '.kit/adaptadores/claude-code.json': JSON.stringify({ comando: 'claude', skills: '.claude/skills' }) });
  assert.deepEqual(v.leerAdaptador(raiz, 'claude-code'), { comando: 'claude', skills: '.claude/skills' });
  assert.equal(v.leerAdaptador(raiz, 'codex-cli'), null, 'un LLM sin adaptador del kit sigue sin nada');
});

test('leerAdaptador: el que escribe el curso en config/adaptador-llm.json manda sobre el del kit', () => {
  const raiz = cursoTemporal({
    '.kit/adaptadores/codex-cli.json': JSON.stringify({ comando: 'codex', skills: '.codex/skills' }),
    'config/adaptador-llm.json': JSON.stringify({ comando: 'codex', skills: '.agents/skills' }),
  });
  assert.deepEqual(v.leerAdaptador(raiz, 'codex-cli'), { comando: 'codex', skills: '.agents/skills' });
});

test('leerAdaptador: un JSON roto no revienta, se trata como si no hubiera adaptador', () => {
  const raiz = cursoTemporal({ 'config/adaptador-llm.json': '{ no es json' });
  assert.equal(v.leerAdaptador(raiz, 'claude-code'), null);
});
