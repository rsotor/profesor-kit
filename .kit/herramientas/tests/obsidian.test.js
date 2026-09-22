'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ob = require('../lib/obsidian');
const { cursoTemporal } = require('./ayuda');

const KIT_REAL = path.resolve(__dirname, '..', '..');
function curso(ficheros = {}) {
  const raiz = cursoTemporal(ficheros);
  fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true });
  return raiz;
}
const leerJson = (raiz, f) => JSON.parse(fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', f), 'utf8'));

test('aplicarAjustes: en una bóveda sin configurar escribe los tres ficheros recomendados', () => {
  const raiz = curso();
  assert.deepEqual(ob.aplicarAjustes(raiz).sort(), ['app.json', 'appearance.json', 'core-plugins.json']);
  assert.equal(leerJson(raiz, 'app.json').showUnsupportedFiles, true);
  assert.equal(leerJson(raiz, 'core-plugins.json').properties, true);
  assert.equal(leerJson(raiz, 'core-plugins.json').sync, false);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'community-plugins.json')));
});

test('aplicarAjustes: nunca cambia lo que eligió el alumno, solo añade lo que falta, y es idempotente', () => {
  const raiz = curso({ 'estudio/.obsidian/app.json': JSON.stringify({ promptDelete: true, vimMode: true }) });
  ob.aplicarAjustes(raiz);
  const app = leerJson(raiz, 'app.json');
  assert.equal(app.promptDelete, true);
  assert.equal(app.vimMode, true);
  assert.equal(app.alwaysUpdateLinks, true);
  assert.deepEqual(ob.aplicarAjustes(raiz), []);
});

test('aplicarAjustes: un JSON roto no se toca', () => {
  const raiz = curso({ 'estudio/.obsidian/app.json': '{roto' });
  assert.ok(!ob.aplicarAjustes(raiz).includes('app.json'));
  assert.equal(fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', 'app.json'), 'utf8'), '{roto');
});

test('instalarComplementos: descarga los que faltan, no activa ninguno y respeta los que ya están', async () => {
  const raiz = curso({ 'estudio/.obsidian/plugins/terminal/manifest.json': '{"id":"terminal"}' });
  const pedidos = [];
  const falso = async (repo, fichero) => { pedidos.push(`${repo}/${fichero}`); return fichero === 'styles.css' ? null : Buffer.from(`${repo} ${fichero}`); };
  const r = await ob.instalarComplementos(raiz, falso);
  assert.deepEqual(r.yaEstaban, ['terminal']);
  assert.deepEqual(r.instalados, ['code-files', 'realclaudian']);
  assert.deepEqual(r.fallidos, []);
  assert.ok(!pedidos.some(p => p.startsWith('polyipseity/')));
  const dir = path.join(raiz, 'estudio', '.obsidian', 'plugins');
  assert.equal(fs.readFileSync(path.join(dir, 'realclaudian', 'main.js'), 'utf8'), 'yishentu/claudian main.js');
  assert.ok(!fs.existsSync(path.join(dir, 'realclaudian', 'styles.css')));   // 404 → no se escribe
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'community-plugins.json')));
});

test('instalarComplementos: un fallo de red se cuenta, no revienta, y no deja carpetas a medias', async () => {
  const raiz = curso();
  const r = await ob.instalarComplementos(raiz, async () => { throw new Error('sin red'); });
  assert.deepEqual(r.instalados, []);
  assert.equal(r.fallidos.length, 3);
  assert.match(r.fallidos[0].motivo, /sin red/);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'plugins', 'terminal')));
});

test('los complementos son los del directorio oficial de Obsidian', () => {
  assert.deepEqual(ob.COMPLEMENTOS.map(c => [c.id, c.repo]), [
    ['terminal', 'polyipseity/obsidian-terminal'],
    ['code-files', 'lukasbach/obsidian-code-files'],
    ['realclaudian', 'yishentu/claudian'],
  ]);
});
