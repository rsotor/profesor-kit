'use strict';
// pruebas/lib/rama.js: antes de la prueba real, ¿la copia local es la de GitHub? Con un remoto bare local, sin red.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { temporal, escribir, git } = require('./ayuda');
const { comprobarRama } = require('../../../pruebas/lib/rama');

function montar() {
  const casa = temporal('kit-rama-');
  const remoto = path.join(casa, 'remoto.git');
  git(casa, 'init', '-q', '--bare', '-b', 'main', remoto);
  const clonar = nombre => {
    const dir = path.join(casa, nombre);
    git(casa, 'clone', '-q', remoto, dir);
    for (const [k, v] of [['user.name', 'T'], ['user.email', 't@e.com'], ['commit.gpgsign', 'false']]) git(dir, 'config', k, v);
    return dir;
  };
  const commit = (dir, ficheros, msg) => { escribir(dir, ficheros); git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', msg); };
  const mac = clonar('mac');
  commit(mac, { 'README.md': 'x' }, 'base');
  git(mac, 'push', '-q', '-u', 'origin', 'main');
  const nube = clonar('nube');
  return { mac, nube, commit };
}

test('comprobarRama: al día con su rama remota, ok', () => {
  const { mac } = montar();
  const r = comprobarRama(mac);
  assert.equal(r.ok, true, r.mensaje);
  assert.equal(r.upstream, 'origin/main');
});

test('comprobarRama: la rama remota avanzó y la copia no (lo de hoy), se para y dice git pull', () => {
  const { mac, nube, commit } = montar();
  commit(nube, { '.kit/skills/examen/SKILL.md': 'ángulos' }, '#55');
  git(nube, 'push', '-q');
  const r = comprobarRama(mac);
  assert.equal(r.ok, false);
  assert.equal(r.detras, 1);
  assert.match(r.mensaje, /va 1 commit\(s\) por detrás de origin\/main: probarías el código de antes.*git pull/);
});

test('comprobarRama: separada (commits solo aquí y solo allí), se para y dice cómo igualarla', () => {
  const { mac, nube, commit } = montar();
  commit(nube, { 'AGENTS.md': 'nuevo' }, 'allí');
  git(nube, 'push', '-q');
  commit(mac, { 'pruebas/x.md': 'viejo' }, 'aquí');
  const r = comprobarRama(mac);
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /se ha separado de origin\/main: 1 commit\(s\) solo aquí y 1 solo allí.*git checkout -B main origin\/main/);
});

test('comprobarRama: por delante (resultado sin subir) vale; sin rama remota, avisa y sigue; cambios sin guardar en una skill, avisa', () => {
  const { mac, commit } = montar();
  commit(mac, { 'pruebas/resultado.md': 'nuevo' }, 'aquí');
  assert.equal(comprobarRama(mac).ok, true);
  escribir(mac, { '.kit/skills/examen/SKILL.md': 'sin guardar' });
  assert.match(comprobarRama(mac).avisos.join(' '), /cambios sin guardar en skills/);
  git(mac, 'checkout', '-q', '-b', 'suelta');
  const suelta = comprobarRama(mac);
  assert.equal(suelta.ok, true);
  assert.match(suelta.avisos.join(' '), /no sigue a ninguna rama remota/);
});
