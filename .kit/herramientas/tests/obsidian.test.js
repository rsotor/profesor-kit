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

test('aplicarAjustes: un core-plugins.json en formato antiguo (array) no se toca ni se corrompe', () => {
  const raiz = curso({ 'estudio/.obsidian/core-plugins.json': JSON.stringify(['file-explorer', 'global-search']) });
  const original = fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', 'core-plugins.json'), 'utf8');
  assert.ok(!ob.aplicarAjustes(raiz).includes('core-plugins.json'));
  assert.equal(fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', 'core-plugins.json'), 'utf8'), original);
  assert.ok(Array.isArray(JSON.parse(original)));
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

test('descargarDeGitHub: pide la versión fijada, comprueba el hash y rechaza lo que no coincide', async () => {
  const datos = Buffer.from('main de mentira');
  const urls = [];
  const traer = respuesta => async (url, opciones) => { urls.push(url); assert.ok(opciones.signal, 'con tiempo límite'); return respuesta; };
  const ok = { status: 200, ok: true, arrayBuffer: async () => datos };
  const esperado = { version: '1.2.3', sha256: ob.sha256(datos) };
  assert.deepEqual(await ob.descargarDeGitHub('a/b', 'main.js', esperado, traer(ok)), datos);
  assert.equal(urls[0], 'https://github.com/a/b/releases/download/1.2.3/main.js');
  await assert.rejects(ob.descargarDeGitHub('a/b', 'main.js', { version: '1.2.3', sha256: 'otro' }, traer(ok)), /hash distinto/);
  assert.equal(await ob.descargarDeGitHub('a/b', 'styles.css', esperado, traer({ status: 404, ok: false })), null);
  await assert.rejects(ob.descargarDeGitHub('a/b', 'main.js', esperado, traer({ status: 500, ok: false })), /HTTP 500/);
});

test('cada complemento lleva versión y un sha256 por fichero, y main.js y manifest.json siempre están', () => {
  for (const c of ob.COMPLEMENTOS) {
    assert.match(c.version, /^\d+\.\d+\.\d+$/);
    for (const f of ['main.js', 'manifest.json']) assert.ok(f in c.ficheros, `${c.id} sin ${f}`);
    for (const hash of Object.values(c.ficheros)) assert.match(hash, /^[0-9a-f]{64}$/);
  }
});
