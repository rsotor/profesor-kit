'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

const KIT_REAL = path.resolve(__dirname, '..', '..');
const MOTOR = ficheros => JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros });

// Captura lo que la herramienta imprime, para comprobarlo y para no ensuciar la salida de los tests.
function capturar(t) {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  t.mock.method(console, 'error', (...a) => lineas.push(a.join(' ')));
  return () => lineas.join('\n');
}

test('comprobar: curso sano sale con 0 y lo dice; con --json imprime solo el informe', t => {
  const salida = capturar(t);
  const { cli } = require('../comprobar');
  const raiz = cursoTemporal();
  assert.equal(cli([], raiz), 0);
  assert.match(salida(), /Curso sano/);
  assert.equal(cli(['--json', '--raiz', raiz], '/no/existe'), 0);
  assert.deepEqual(JSON.parse(salida().split('\n').pop()), { errores: [], avisos: [] });
});

test('comprobar: con errores sale con 1 y los lista; con solo avisos sale con 0', t => {
  const salida = capturar(t);
  const { cli } = require('../comprobar');
  const roto = cursoTemporal({ 'estudio/progreso.md': '# vacío\n' });
  assert.equal(cli([], roto), 1);
  assert.match(salida(), /\[progreso\].*alfa/);
  assert.match(salida(), /hay que arreglarlo antes de guardar/);
  const conAviso = cursoTemporal({ 'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n@@ duda\n' });
  assert.equal(cli([], conAviso), 0);
  assert.match(salida(), /no bloquean/);
});

test('guardar: sin mensaje explica el uso; guarda; y avisa si no hay nada nuevo', t => {
  const salida = capturar(t);
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.equal(cli([], raiz), 2);
  assert.match(salida(), /Uso:/);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  assert.equal(cli(['sesion(s02): prueba'], raiz), 0);
  assert.match(salida(), /Guardado en local/);
  assert.equal(cli(['otra vez'], raiz), 0);
  assert.match(salida(), /No había nada nuevo/);
});

test('guardar: con errores sale con 1 y lo explica en llano', t => {
  const salida = capturar(t);
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/progreso.md': '# vacío\n' });
  assert.equal(cli(['x'], raiz), 1);
  assert.match(salida(), /hay errores que arreglar primero/);
});

test('guardar: sin identidad de git lo explica en vez de fallar', t => {
  const salida = capturar(t);
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  git(raiz, 'config', '--unset', 'user.name');
  git(raiz, 'config', '--unset', 'user.email');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  // Aísla de la identidad global de la máquina que ejecuta los tests.
  const antes = { ...process.env };
  Object.assign(process.env, { GIT_CONFIG_GLOBAL: path.join(raiz, 'no-existe'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_SYSTEM: path.join(raiz, 'no-existe') });
  try { assert.equal(cli(['x'], raiz), 1); } finally { process.env = antes; }
  assert.match(salida(), /Git no sabe quién eres/);
});

test('instalar-skills: informa de lo instalado, de lo retirado y acepta --destino', t => {
  const salida = capturar(t);
  const { cli } = require('../instalar-skills');
  const raiz = cursoTemporal({ '.kit/skills/sesion/SKILL.md': 'x', '.kit/skills/vieja/SKILL.md': 'x' });
  assert.equal(cli([], raiz), 0);
  assert.match(salida(), /sesion, vieja/);
  fs.rmSync(path.join(raiz, '.kit', 'skills', 'vieja'), { recursive: true });
  assert.equal(cli(['--destino', '.agents/skills'], raiz), 0);
  assert.ok(fs.existsSync(path.join(raiz, '.agents', 'skills', 'sesion', 'SKILL.md')));
  assert.equal(cli([], raiz), 0);
  assert.match(salida(), /retiradas: vieja/);
  assert.equal(cli([], cursoTemporal()), 0);
  assert.match(salida(), /ninguna/);
});

test('preparar-curso: exige --subir si|no y prepara el curso', t => {
  const salida = capturar(t);
  const { cli } = require('../preparar-curso');
  const raiz = cursoTemporal({ '.kit/motor.json': MOTOR(['.kit']), 'docs/x.md': 'x' });
  fs.cpSync(path.join(KIT_REAL, 'plantillas', 'obsidian'), path.join(raiz, '.kit', 'plantillas', 'obsidian'), { recursive: true });
  fs.rmSync(path.join(raiz, 'config', 'ajustes.json'));
  assert.equal(cli([], raiz), 2);
  assert.equal(cli(['--subir', 'quizas'], raiz), 2);
  assert.match(salida(), /Uso:/);
  assert.equal(cli(['--subir', 'no', '--llm', 'otro-llm', '--nombre', 'Historia del Arte'], raiz), 0);
  assert.match(salida(), /Borrado: docs.*ajustes creados: sí/);
  const ajustes = JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8'));
  assert.deepEqual([ajustes.subir_a_github, ajustes.llm, ajustes.nombre_curso], [false, 'otro-llm', 'Historia del Arte']);
  assert.equal(cli(['--subir', 'si'], raiz), 0);
  assert.match(salida(), /Borrado: nada.*ya existían/);
});

function cursoYOrigen({ versionOrigen = '2.0.0', migracion } = {}) {
  const raiz = cursoTemporal({ 'AGENTS.md': 'v1' });
  fs.cpSync(KIT_REAL, path.join(raiz, '.kit'), { recursive: true });
  escribir(raiz, { '.kit/VERSION': '1.0.0', '.kit/motor.json': MOTOR(['AGENTS.md', '.kit']), '.gitignore': '.claude/skills/\n' });
  iniciarGit(raiz);
  const origen = temporal('kit-origen-');
  fs.cpSync(KIT_REAL, path.join(origen, '.kit'), { recursive: true });
  for (const r of [raiz, origen]) fs.rmSync(path.join(r, '.kit', 'herramientas', 'migraciones'), { recursive: true, force: true });
  escribir(origen, {
    'AGENTS.md': 'v2',
    '.kit/VERSION': versionOrigen,
    '.kit/CHANGELOG.md': '# Cambios\n\n## 2.0.0\n- Notas más cortas.\n\n## 1.0.0\n- Primera.\n',
    '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: migracion ? 2 : 1, ficheros: ['AGENTS.md', '.kit'] }),
    ...(migracion ? { '.kit/herramientas/migraciones/002-prueba.js': migracion } : {}),
  });
  return { raiz, origen };
}

test('actualizar: --ver enseña solo las novedades y no toca nada; --aplicar actualiza y migra', t => {
  const salida = capturar(t);
  const { cli } = require('../actualizar');
  const migracion = `module.exports = { descripcion: 'm', migrar(raiz) { require('node:fs').appendFileSync(require('node:path').join(raiz, 'estudio/mapa-del-curso.md'), 'migrado\\n'); } };`;
  const { raiz, origen } = cursoYOrigen({ migracion });
  assert.equal(cli(['--ver', '--origen', origen], raiz), 0);
  assert.match(salida(), /Tienes la 1\.0\.0; hay una 2\.0\.0/);
  assert.match(salida(), /Notas más cortas/);
  assert.doesNotMatch(salida(), /Primera/);
  assert.equal(fs.readFileSync(path.join(raiz, 'AGENTS.md'), 'utf8'), 'v1');
  assert.equal(cli(['--aplicar', '--origen', origen], raiz), 0);
  assert.match(salida(), /Actualizado de 1\.0\.0 a 2\.0\.0\. Datos migrados: 2\./);
});

test('actualizar: al día lo dice; y sin --origen usa la descarga (inyectada, sin red)', t => {
  const salida = capturar(t);
  const { cli } = require('../actualizar');
  const { raiz, origen } = cursoYOrigen({ versionOrigen: '1.0.0' });
  let pedido;
  assert.equal(cli(['--ver'], raiz, repo => { pedido = repo; return origen; }), 0);
  assert.equal(pedido, 'rsotor/profesor-kit');
  assert.match(salida(), /Ya tienes la última versión \(1\.0\.0\)/);
});

test('actualizar: si la versión nueva rompe algo, sale con 1 y tranquiliza', t => {
  const salida = capturar(t);
  const { cli } = require('../actualizar');
  const { raiz, origen } = cursoYOrigen({ migracion: `module.exports = { descripcion: 'x', migrar() { throw new Error('pum'); } };` });
  assert.equal(cli(['--aplicar', '--origen', origen], raiz), 1);
  assert.match(salida(), /todo sigue como estaba, en la 1\.0\.0.*pum/);
});

test('actualizar: una carpeta que no es repo git no se toca', () => {
  const { actualizar } = require('../actualizar');
  const { raiz, origen } = cursoYOrigen();
  fs.rmSync(path.join(raiz, '.git'), { recursive: true, force: true });
  assert.equal(actualizar({ raiz, origen }).motivo, 'sin-repo');
  assert.equal(fs.readFileSync(path.join(raiz, 'AGENTS.md'), 'utf8'), 'v1');
});

test('actualizar --comprobar: avisa en una línea solo si hay versión nueva, una vez al día, y calla sin red', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const { comprobarNovedades, cli } = require('../actualizar');
  const { raiz } = cursoYOrigen();                                   // versión instalada: 1.0.0
  assert.match(comprobarNovedades(raiz, '2026-01-01', () => '2.0.0'), /tienes la 1\.0\.0 y está publicada la 2\.0\.0/);
  assert.equal(comprobarNovedades(raiz, '2026-01-01', () => '9.9.9'), null, 'mismo día: no vuelve a consultar');
  assert.equal(comprobarNovedades(raiz, '2026-01-02', () => '1.0.0'), null, 'al día: nada');
  assert.equal(comprobarNovedades(raiz, '2026-01-03', () => null), null, 'sin red: nada, y no molesta');
  assert.equal(comprobarNovedades(raiz, '2026-01-04', () => '0.9.0'), null, 'una publicada más vieja que la instalada no es novedad');
  assert.match(comprobarNovedades(raiz, '2026-01-05', () => '1.10.0'), /1\.10\.0/, 'compara números, no texto');
  assert.equal(cli(['--comprobar'], raiz, undefined, () => '3.0.0'), 0);
  assert.match(lineas.join('\n'), /publicada la 3\.0\.0/);
});
