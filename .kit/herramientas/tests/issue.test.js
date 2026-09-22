'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepararIssue, revisar, cli } = require('../issue');
const { cursoTemporal } = require('./ayuda');

const MOTOR = { '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros: ['.kit'] }), '.kit/VERSION': '0.9.0\n' };
const gh = (respuestas = {}) => (cmd, args) => {
  const clave = [cmd, ...args].join(' ');
  const r = Object.entries(respuestas).find(([k]) => clave.startsWith(k));
  return r ? r[1] : { ok: true, salida: '[]' };
};
const CUERPO = '**Esperado:** que lea el PDF entero.\n\n**Qué pasó:** se cortó a mitad.\n\n**Propuesta:** leer por tramos.\n';

test('monta el cuerpo con el entorno delante y busca parecidas', () => {
  const raiz = cursoTemporal({ ...MOTOR, 'config/ajustes.json': JSON.stringify({ llm: 'codex-cli' }) });
  const parecidas = { 'gh issue list': { ok: true, salida: JSON.stringify([{ number: 11, title: '[/sesion] Falta cobertura', state: 'CLOSED' }]) } };
  const p = prepararIssue({ raiz, titulo: '[/sesion] No lee el PDF entero', cuerpo: CUERPO, ejecutar: gh(parecidas), plataforma: 'win32', version: '10.0' });
  assert.equal(p.ok, true);
  assert.match(p.texto, /^\*\*Entorno:\*\* Windows 10\.0 · codex-cli · kit 0\.9\.0 · Node \d+/);
  assert.match(p.texto, /Qué pasó/);
  assert.deepEqual(p.parecidas.map(i => i.number), [11]);
});

test('se niega si lleva rutas personales, correos o secretos; y exige el título con corchetes', () => {
  const raiz = cursoTemporal(MOTOR);
  assert.deepEqual(revisar('falla en /Users/ana/cursos/x'), ['una ruta con tu nombre de usuario']);
  assert.deepEqual(revisar('falla en C:\\Users\\ana\\cursos'), ['una ruta con tu nombre de usuario']);
  assert.deepEqual(revisar('escríbeme a ana@example.com'), ['una dirección de correo']);
  assert.deepEqual(revisar('token ' + 'ghp_' + 'a'.repeat(36)), ['algo que parece un secreto']);
  assert.deepEqual(revisar('falla en estudio/conceptos/alfa.md con kit 0.9.0'), []);
  assert.equal(prepararIssue({ raiz, titulo: '[x] ok', cuerpo: 'ruta /home/ana/x', ejecutar: gh() }).motivo, 'datos-personales');
  assert.equal(prepararIssue({ raiz, titulo: 'sin corchetes', cuerpo: CUERPO, ejecutar: gh() }).motivo, 'titulo');
});

test('cli: vista previa sin enviar; con --enviar crea y devuelve la url; sin gh explica el plan B', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = cursoTemporal(MOTOR);
  const cuerpo = path.join(raiz, 'cuerpo.md');
  fs.writeFileSync(cuerpo, CUERPO);
  assert.equal(cli(['--titulo', '[/sesion] No lee el PDF entero', '--cuerpo', cuerpo], raiz, { ejecutar: gh() }), 0);
  assert.match(lineas.join('\n'), /Vista previa[\s\S]*Enséñasela al alumno/);
  const creado = gh({ 'gh issue create': { ok: true, salida: 'Creating issue…\nhttps://github.com/rsotor/profesor-kit/issues/42' } });
  assert.equal(cli(['--titulo', '[/sesion] No lee el PDF entero', '--cuerpo', cuerpo, '--enviar'], raiz, { ejecutar: creado }), 0);
  assert.match(lineas.join('\n'), /Issue creada: https:\/\/github\.com\/rsotor\/profesor-kit\/issues\/42/);
  const sinGh = gh({ 'gh issue create': { ok: false, salida: 'not logged in' } });
  assert.equal(cli(['--titulo', '[/sesion] No lee el PDF entero', '--cuerpo', cuerpo, '--enviar'], raiz, { ejecutar: sinGh }), 1);
  assert.match(lineas.join('\n'), /feedback-pendiente\.md/);
  assert.equal(cli([], raiz), 2);
});
