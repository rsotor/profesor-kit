'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { comprobar } = require('../comprobar');
const v = require('../lib/vault');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

test('el kit recién clonado pasa comprobar sin errores ni avisos', () => {
  const informe = comprobar(RAIZ);
  assert.deepEqual(informe.errores, []);
  assert.deepEqual(informe.avisos, []);
});

test('existen todas las rutas de datos y los ficheros vivos', () => {
  for (const ruta of v.RUTAS_PROTEGIDAS) assert.ok(fs.existsSync(path.join(RAIZ, ruta)), ruta);
  for (const f of ['curso.md', 'profesor.md', 'alumno.md']) assert.ok(fs.existsSync(path.join(RAIZ, 'config', f)), f);
});

test('config/ajustes.json NO viene en la plantilla: lo crea preparar-curso.js', () => {
  assert.ok(!fs.existsSync(path.join(RAIZ, 'config', 'ajustes.json')));
});

test('profesor.md trae las preferencias por defecto del spec', () => {
  const fm = v.leerFrontmatter(fs.readFileSync(path.join(RAIZ, 'config', 'profesor.md'), 'utf8'));
  assert.equal(fm.marcador_dudas, '@@');
  assert.deepEqual(fm.orden_explicacion, ['problema', 'ejemplo', 'nombre', 'formula', 'error-tipico']);
  assert.equal(fm.flashcards_por_sesion, '3-6');
  assert.equal(fm.lente, 'desactivada');
});

test('las plantillas existen, y el kit no trae código de ejercicios', () => {
  for (const f of ['concepto.md', 'sesion.md', 'flashcards.md', 'guia-de-uso.md', 'hoja-del-curso.md', 'readme-del-curso.md']) {
    assert.ok(fs.existsSync(path.join(RAIZ, '.kit', 'plantillas', f)), f);
  }
  assert.ok(!fs.existsSync(path.join(RAIZ, '.kit', 'recursos')));
  assert.ok(!fs.existsSync(path.join(RAIZ, '.kit', 'plantillas', 'ejercicio.html')));
});

test('git ignora la disposición de ventanas de Obsidian también dentro de estudio/', () => {
  const { execFileSync } = require('node:child_process');
  const ignorado = ruta => { try { execFileSync('git', ['check-ignore', '-q', ruta], { cwd: RAIZ }); return true; } catch { return false; } };
  assert.ok(ignorado('estudio/.obsidian/workspace.json'));
  assert.ok(ignorado('estudio/.obsidian/workspaces.json'));
  assert.ok(!ignorado('estudio/.obsidian/app.json'), 'los ajustes de la bóveda sí se guardan');
});
