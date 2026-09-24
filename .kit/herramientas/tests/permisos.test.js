'use strict';
// permisos.js: con un sí del alumno, su profesor edita sus notas y ejecuta las herramientas del kit sin preguntar,
// solo dentro del curso. Qué se permite lo decide el kit; dónde se escribe, el adaptador de cada asistente.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cursoTemporal, escribir } = require('./ayuda');
const { aplicar, quitar, estado, cli } = require('../permisos');

const CLAUDE = JSON.stringify({ comando: 'claude', skills: '.claude/skills', aceptar_una_vez: { tipo: 'claude-code' } });
const CODEX = JSON.stringify({ comando: 'codex', skills: '.agents/skills', aceptar_una_vez: { pendiente: 'https://github.com/rsotor/profesor-kit/issues/42' } });

function curso({ llm = 'claude-code', extra = {} } = {}) {
  return cursoTemporal({
    'config/ajustes.json': JSON.stringify({ llm, subir_a_github: false, version_datos: 4 }),
    '.kit/adaptadores/claude-code.json': CLAUDE,
    '.kit/adaptadores/codex.json': CODEX,
    '.kit/herramientas/comprobar.js': '',
    '.kit/herramientas/guardar.js': '',
    '.kit/herramientas/lib/vault.js': '',
    ...extra,
  });
}
const leerJson = (raiz, rel) => JSON.parse(fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8'));

test('aplicar (Claude Code): acceptEdits y las herramientas del kit, en la raíz y en estudio/, que además llega a la raíz', () => {
  const raiz = curso();
  assert.equal(estado(raiz).aplicado, false);
  aplicar(raiz);
  const enRaiz = leerJson(raiz, '.claude/settings.local.json').permissions;
  const enEstudio = leerJson(raiz, 'estudio/.claude/settings.local.json').permissions;
  for (const p of [enRaiz, enEstudio]) {
    assert.equal(p.defaultMode, 'acceptEdits');
    assert.ok(p.allow.includes('Bash(node .kit/herramientas/comprobar.js *)'));
    assert.ok(p.allow.includes('Bash(git status *)'));
    assert.ok(p.allow.every(r => /^Bash\((node (\.\.\/)?\.kit\/herramientas\/[a-z-]+\.js|git (status|log|diff)) \*\)$/.test(r)), 'solo herramientas del kit y git de lectura');
    assert.ok(!p.allow.some(r => r.includes('vault')), 'ni piezas internas de lib/');
  }
  assert.ok(enEstudio.allow.includes('Bash(node ../.kit/herramientas/guardar.js *)'), 'desde estudio/, la ruta con ..');
  assert.deepEqual(enEstudio.additionalDirectories, ['..']);
  assert.equal(enRaiz.additionalDirectories, undefined, 'la raíz no necesita salir de sí misma');
  assert.equal(estado(raiz).aplicado, true);
  assert.ok(!JSON.stringify([enRaiz, enEstudio]).includes('bypassPermissions'));
});

test('aplicar y quitar respetan lo que ya hubiera en esos ficheros, y quitar deja justo lo de antes', () => {
  const suyo = { permissions: { allow: ['Bash(npm test)'] }, model: 'sonnet' };
  const raiz = curso({ extra: { '.claude/settings.local.json': JSON.stringify(suyo) } });
  aplicar(raiz);
  aplicar(raiz);
  const p = leerJson(raiz, '.claude/settings.local.json');
  assert.equal(p.model, 'sonnet');
  assert.ok(p.permissions.allow.includes('Bash(npm test)'));
  assert.equal(p.permissions.allow.filter(r => r === 'Bash(git status *)').length, 1, 'aplicar dos veces no duplica');
  fs.rmSync(path.join(raiz, 'estudio', '.claude', 'settings.local.json'));
  assert.deepEqual([estado(raiz).aplicado, estado(raiz).parcial], [false, true], 'uno borrado: a medias');
  aplicar(raiz);
  quitar(raiz);
  assert.deepEqual(leerJson(raiz, '.claude/settings.local.json'), suyo);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.claude', 'settings.local.json')), 'lo que creó él, lo borra');
  assert.equal(estado(raiz).aplicado, false);
});

test('un settings.local.json que no es JSON válido no se pisa: se dice y no se toca nada', () => {
  const raiz = curso({ extra: { 'estudio/.claude/settings.local.json': '{ roto' } });
  assert.throws(() => aplicar(raiz), /settings\.local\.json.*no es JSON válido/);
  assert.equal(fs.readFileSync(path.join(raiz, 'estudio', '.claude', 'settings.local.json'), 'utf8'), '{ roto');
  assert.ok(!fs.existsSync(path.join(raiz, '.claude', 'settings.local.json')), 'ni la raíz: todo o nada');
});

test('con un asistente que aún no sabe hacerlo (Codex), lo dice con su issue y no toca nada', () => {
  const raiz = curso({ llm: 'codex' });
  const e = estado(raiz);
  assert.equal(e.soportado, false);
  assert.match(e.motivo, /issues\/42/);
  assert.throws(() => aplicar(raiz), /todavía no sé.*issues\/42/);
  assert.ok(!fs.existsSync(path.join(raiz, '.claude')));
});

test('cli: --ver explica en llano qué cambia y cómo está; --aplicar y --quitar lo hacen', t => {
  const salida = [];
  t.mock.method(console, 'log', (...a) => salida.push(a.join(' ')));
  t.mock.method(console, 'error', (...a) => salida.push(a.join(' ')));
  const raiz = curso();
  assert.equal(cli(['--ver'], raiz), 0);
  assert.match(salida.join('\n'), /sin preguntarte[\s\S]*solo dentro de este curso[\s\S]*deshaz lo último[\s\S]*Ahora: sin aceptar/);
  assert.equal(cli(['--aplicar'], raiz), 0);
  assert.match(salida.pop(), /Hecho/);
  assert.equal(cli(['--ver'], raiz), 0);
  assert.match(salida.join('\n'), /Ahora: aceptado/);
  assert.equal(cli(['--quitar'], raiz), 0);
  assert.equal(estado(raiz).aplicado, false);
  assert.equal(cli([], raiz), 2);
  escribir(raiz, { 'config/ajustes.json': JSON.stringify({ llm: 'codex' }) });
  assert.equal(cli(['--aplicar'], raiz), 1);
});
