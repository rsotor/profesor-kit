'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearAtajo, cli } = require('../crear-atajo');
const { cursoTemporal } = require('./ayuda');

const bin = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-bin-'));
const entornoCon = dir => ({ PATH: [dir, '/usr/bin'].join(path.delimiter) });

test('en Mac y Linux crea un lanzador ejecutable que entra en el curso y abre el LLM', () => {
  const raiz = cursoTemporal();
  const carpetaBin = bin();
  const r = crearAtajo({ raiz, nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
  assert.deepEqual([r.creado, r.enPath], [true, true]);
  const texto = fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8');
  assert.match(texto, /^#!\/bin\/sh\n/);
  assert.ok(texto.includes(`cd "${raiz}"`));
  assert.match(texto, /exec claude "\$@"/);
  if (process.platform !== 'win32') assert.ok(fs.statSync(path.join(carpetaBin, 'historia')).mode & 0o100, 'tiene que ser ejecutable');
  assert.equal(JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8')).atajo, 'historia');
});

test('en Windows crea un .cmd con finales de línea de Windows', () => {
  const raiz = cursoTemporal();
  const carpetaBin = bin();
  const r = crearAtajo({ raiz, nombre: 'historia', carpetaBin, plataforma: 'win32', entorno: { Path: carpetaBin, PATHEXT: '.COM;.EXE;.BAT;.CMD' } });
  assert.equal(r.creado, true);
  const texto = fs.readFileSync(path.join(carpetaBin, 'historia.cmd'), 'utf8');
  assert.match(texto, /^@echo off\r\n/);
  assert.ok(texto.includes(`cd /d "${raiz}"`));
  assert.match(texto, /\r\nclaude %\*\r\n$/);
});

test('usa el comando del LLM que diga ajustes.json', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ llm: 'codex-cli' }) });
  const carpetaBin = bin();
  crearAtajo({ raiz, nombre: 'derecho', carpetaBin, plataforma: 'linux', entorno: entornoCon(carpetaBin) });
  assert.match(fs.readFileSync(path.join(carpetaBin, 'derecho'), 'utf8'), /exec codex "\$@"/);
});

test('es idempotente para el mismo curso, y otro curso no puede quedarse con el mismo atajo', () => {
  const carpetaBin = bin();
  const opciones = { nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) };
  const curso1 = cursoTemporal();
  assert.equal(crearAtajo({ raiz: curso1, ...opciones }).creado, true);
  assert.equal(crearAtajo({ raiz: curso1, ...opciones }).creado, true);
  assert.equal(crearAtajo({ raiz: cursoTemporal(), ...opciones }).motivo, 'atajo-de-otro-curso');
  assert.ok(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8').includes(curso1));
});

test('nunca pisa un fichero que no es del kit', () => {
  const carpetaBin = bin();
  fs.writeFileSync(path.join(carpetaBin, 'historia'), '#!/bin/sh\necho soy de otro\n');
  const r = crearAtajo({ raiz: cursoTemporal(), nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
  assert.equal(r.motivo, 'fichero-ajeno');
  assert.match(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /soy de otro/);
});

test('se niega si la palabra ya es un programa del ordenador, y si no es una palabra válida', () => {
  const carpetaBin = bin();
  const otra = bin();
  fs.writeFileSync(path.join(otra, 'git'), '');
  const entorno = { PATH: [carpetaBin, otra].join(path.delimiter) };
  assert.equal(crearAtajo({ raiz: cursoTemporal(), nombre: 'git', carpetaBin, plataforma: 'darwin', entorno }).motivo, 'comando-existente');
  for (const malo of ['', 'Historia', 'mi curso', 'ñu', 'a', '1curso', undefined]) {
    assert.equal(crearAtajo({ raiz: cursoTemporal(), nombre: malo, carpetaBin, plataforma: 'darwin', entorno }).motivo, 'nombre-no-valido', String(malo));
  }
});

test('cli: lo cuenta en llano, avisa si la carpeta no está en el PATH y sale con 1 si no puede', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const carpetaBin = bin();
  const raiz = cursoTemporal();
  assert.equal(cli(['--nombre', 'historia'], raiz, { carpetaBin, plataforma: 'darwin', entorno: { PATH: '/usr/bin' } }), 0);
  assert.match(lineas.join('\n'), /escribir "historia" en la terminal abre este curso/);
  assert.match(lineas.join('\n'), /no está en el PATH/);
  assert.equal(cli(['--nombre', 'Mal Nombre'], raiz, { carpetaBin }), 1);
  assert.match(lineas.join('\n'), /una sola palabra corta/);
  assert.equal(cli([], raiz, { carpetaBin }), 1);
});
