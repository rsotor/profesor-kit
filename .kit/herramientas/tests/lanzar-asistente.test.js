'use strict';
// issue #39, H01: el prompt de la preparación en segundo plano no pasa nunca por una shell. Va por la entrada
// estándar; en Windows, un comando .cmd solo se lanza con cmd.exe si lo demás son valores fijos y limpios.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { comoLanzar, lanzarAsistente } = require('../preparar');
const { temporal } = require('./ayuda');

const RECEPTOR = path.join(__dirname, 'receptor-de-argumentos.js');
const PROMPT_PELIGROSO = 'Clase "a & echo MARCA_AUDITORIA & rem .md" con 100% de acentos: ñ, (paréntesis)\ny salto de línea ^ | < > !';

test('comoLanzar: con prompt_por_stdin, el prompt no va en los argumentos; el modelo sí', () => {
  const plan = comoLanzar({ comando: 'claude', segundoPlano: ['-p', '--model', '{modelo}'], promptPorStdin: true, prompt: PROMPT_PELIGROSO, modelo: 'sonnet', plataforma: 'darwin' });
  assert.deepEqual(plan.args, ['-p', '--model', 'sonnet']);
  assert.equal(plan.entrada, PROMPT_PELIGROSO);
});

test('comoLanzar: un modelo con caracteres raros se rechaza; {prompt} junto a prompt_por_stdin también', () => {
  assert.match(comoLanzar({ comando: 'x', segundoPlano: ['{modelo}'], promptPorStdin: true, prompt: 'p', modelo: 'a&b', plataforma: 'darwin' }).error, /modelo/);
  assert.match(comoLanzar({ comando: 'x', segundoPlano: ['{prompt}'], promptPorStdin: true, prompt: 'p', modelo: 'm', plataforma: 'darwin' }).error, /\{prompt\}/);
});

test('comoLanzar en Windows: un .cmd va por cmd.exe solo con argumentos limpios; con el prompt como argumento, se niega', () => {
  const dir = temporal('kit-bin-');
  fs.writeFileSync(path.join(dir, 'claude.cmd'), '@echo off\n');
  const entorno = { PATH: dir, PATHEXT: '.EXE;.CMD', ComSpec: 'C:\\Windows\\system32\\cmd.exe' };
  const bien = comoLanzar({ comando: 'claude', segundoPlano: ['-p', '--model', '{modelo}'], promptPorStdin: true, prompt: PROMPT_PELIGROSO, modelo: 'sonnet', plataforma: 'win32', entorno });
  assert.equal(bien.ejecutable, 'C:\\Windows\\system32\\cmd.exe');
  assert.equal(bien.literal, true);
  assert.ok(!bien.args.join(' ').includes('MARCA_AUDITORIA'));
  assert.equal(bien.entrada, PROMPT_PELIGROSO);
  const mal = comoLanzar({ comando: 'claude', segundoPlano: ['-p', '{prompt}'], promptPorStdin: false, prompt: PROMPT_PELIGROSO, modelo: 'sonnet', plataforma: 'win32', entorno });
  assert.match(mal.error, /prompt_por_stdin/);
});

test('lanzarAsistente: el receptor recibe exactamente los argumentos previstos y el prompt entero por stdin', () => {
  const salida = path.join(temporal('kit-receptor-'), 'recibido.json');
  const plan = comoLanzar({ comando: process.execPath, segundoPlano: [RECEPTOR, salida, '--model', '{modelo}'], promptPorStdin: true, prompt: PROMPT_PELIGROSO, modelo: 'sonnet' });
  const r = lanzarAsistente(plan, temporal('kit-cwd-'));
  assert.equal(r.status, 0, r.stderr);
  const recibido = JSON.parse(fs.readFileSync(salida, 'utf8'));
  assert.deepEqual(recibido.args, ['--model', 'sonnet']);
  assert.equal(recibido.entrada, PROMPT_PELIGROSO);
});

test('lanzarAsistente en Windows real: un .cmd con espacios en la ruta recibe sus argumentos y nada se ejecuta de más', { skip: process.platform !== 'win32' }, () => {
  const dir = path.join(temporal('kit-bin-'), 'con espacios');
  fs.mkdirSync(dir, { recursive: true });
  const salida = path.join(temporal('kit-receptor-'), 'recibido.json');
  fs.writeFileSync(path.join(dir, 'asistente.cmd'), `@echo off\r\n"${process.execPath}" "${RECEPTOR}" "${salida}" %*\r\n`);
  const plan = comoLanzar({ comando: 'asistente', segundoPlano: ['-p', '--model', '{modelo}'], promptPorStdin: true, prompt: PROMPT_PELIGROSO, modelo: 'sonnet',
    entorno: { ...process.env, PATH: dir + path.delimiter + (process.env.PATH || process.env.Path || '') } });
  assert.equal(plan.error, undefined);
  const r = lanzarAsistente(plan, temporal('kit-cwd-'));
  assert.equal(r.status, 0, r.stderr);
  const recibido = JSON.parse(fs.readFileSync(salida, 'utf8'));
  assert.deepEqual(recibido.args, ['-p', '--model', 'sonnet']);
  assert.equal(recibido.entrada.replace(/\r\n/g, '\n'), PROMPT_PELIGROSO);
  assert.doesNotMatch(r.stdout || '', /MARCA_AUDITORIA/);
});
