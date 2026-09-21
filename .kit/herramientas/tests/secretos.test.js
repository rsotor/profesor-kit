'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { escanearSecretos } = require('../lib/secretos');
const { comprobar } = require('../comprobar');
const { cursoTemporal, iniciarGit } = require('./ayuda');

// Se construyen en ejecución: el repo del kit no puede contener nada con forma de secreto.
const TOKEN_GH = 'ghp_' + 'a1B2'.repeat(9);
const CLAVE_ANT = 'sk-ant-' + 'x'.repeat(40);
const CLAVE_PRIV = '-----BEGIN ' + 'RSA PRIVATE KEY-----';

test('detecta tokens en cualquier fichero de texto y no imprime el valor', () => {
  const raiz = cursoTemporal({ 'inbox/notas.txt': `hola\nmi token es ${TOKEN_GH}\n`, 'conceptos/alfa.md': `---\ntipo: concepto\nalias: []\n---\n${CLAVE_ANT}\n` });
  const h = escanearSecretos(raiz);
  assert.equal(h.length, 2);
  assert.ok(h.every(x => x.regla === 'secreto'));
  assert.ok(h.every(x => !x.detalle.includes(TOKEN_GH) && !x.detalle.includes(CLAVE_ANT)));
  assert.match(h.find(x => x.fichero === 'inbox/notas.txt').detalle, /línea 2: token de GitHub/);
});

test('detecta claves privadas y ficheros .env sin ignorar', () => {
  const raiz = cursoTemporal({ 'clave.txt': CLAVE_PRIV, '.env': 'X=1' });
  const detalles = escanearSecretos(raiz).map(x => x.detalle).join(' | ');
  assert.match(detalles, /clave privada/);
  assert.match(detalles, /fichero de secretos/);
});

test('respeta .gitignore cuando hay repo git', () => {
  const raiz = cursoTemporal({ '.gitignore': '.env\nprivado/\n', '.env': `T=${TOKEN_GH}`, 'privado/x.txt': TOKEN_GH });
  iniciarGit(raiz);
  assert.deepEqual(escanearSecretos(raiz), []);
});

test('ignora binarios y texto normal', () => {
  const raiz = cursoTemporal({ 'inbox/x.bin': `\0\0${TOKEN_GH}`, 'inbox/y.md': 'sk-corto ghp_corto AKIA' });
  assert.deepEqual(escanearSecretos(raiz), []);
});

test('comprobar() incluye los secretos como error', () => {
  const raiz = cursoTemporal({ 'inbox/notas.txt': TOKEN_GH });
  assert.ok(comprobar(raiz).errores.some(e => e.regla === 'secreto'));
});
