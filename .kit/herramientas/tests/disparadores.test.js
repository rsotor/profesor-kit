'use strict';
// Prueba pruebas/disparadores.js: las funciones puras que deciden qué skill eligió el asistente y el resumen.
// Nunca lanza claude de verdad: eso lo decide el mantenedor a mano (`npm run disparadores`).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { decidirEleccion, acierta, markdownResumen, datosDelCurso, LIMITE_HERRAMIENTAS } = require('../../../pruebas/disparadores');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const usa = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });

test('decidirEleccion: la primera skill que usa es la elegida, aunque antes haya leído algo', () => {
  const lineas = [usa('Read', { file_path: 'config/curso.md' }), usa('Skill', { skill: 'dudas' }), usa('Skill', { skill: 'examen' })];
  assert.deepEqual(decidirEleccion(lineas), { decidido: true, skill: 'dudas' });
});

test('decidirEleccion: sin skill, sigue esperando hasta el límite de herramientas; entonces, ninguna', () => {
  const lectura = usa('Read', { file_path: 'x' });
  assert.deepEqual(decidirEleccion([lectura, lectura]), { decidido: false });
  assert.deepEqual(decidirEleccion(Array(LIMITE_HERRAMIENTAS).fill(lectura)), { decidido: true, skill: null, nota: `${LIMITE_HERRAMIENTAS} herramientas sin skill` });
  assert.ok(LIMITE_HERRAMIENTAS >= 10, 'AGENTS.md hace leer config/ antes: con menos se corta una skill que iba a llegar');
});

test('decidirEleccion: si termina sin usar ninguna skill (contestó en el chat), ninguna', () => {
  const fin = JSON.stringify({ type: 'result', result: 'Claro, ¿empezamos?' });
  assert.deepEqual(decidirEleccion([usa('Read', { file_path: 'x' }), fin]), { decidido: true, skill: null });
});

test('decidirEleccion: ignora líneas que no son JSON y el prefijo de un plugin en el nombre de la skill', () => {
  assert.deepEqual(decidirEleccion(['basura', usa('Skill', { skill: 'kit:repaso' })]), { decidido: true, skill: 'repaso' });
});

test('acierta: la esperada puede ser una skill, ninguna (null) o varias válidas', () => {
  assert.equal(acierta('dudas', 'dudas'), true);
  assert.equal(acierta(null, null), true);
  assert.equal(acierta('repaso', null), false);
  assert.equal(acierta(null, ['sesion', null]), true);
  assert.equal(acierta('examen', ['sesion', null]), false);
});

test('markdownResumen: aciertos por skill esperada y la lista de fallos con lo que eligió', () => {
  const md = markdownResumen({
    fecha: '2026-01-01', version: '0.25.0', modelo: 'sonnet',
    resultados: [
      { frase: 'tengo dudas', esperada: 'dudas', elegida: 'dudas' },
      { frase: '¿repasamos?', esperada: null, elegida: 'repaso' },
      { frase: 'hazme una página', esperada: 'repaso', elegida: 'repaso' },
    ],
  });
  assert.match(md, /\*\*2 de 3\*\* frases/);
  assert.match(md, /\| ninguna \| 0 \/ 1 \|/);
  assert.match(md, /"¿repasamos\?" → esperada ninguna, eligió `repaso`/);
});

test('las frases del repositorio son válidas: cada esperada es una skill que existe o ninguna', () => {
  const frases = JSON.parse(fs.readFileSync(path.join(RAIZ, 'pruebas', 'disparadores.json'), 'utf8')).frases;
  const skills = fs.readdirSync(path.join(RAIZ, '.kit', 'skills'));
  assert.ok(frases.length >= 40);
  for (const { frase, esperada } of frases) {
    assert.ok(typeof frase === 'string' && frase.trim(), 'frase vacía');
    for (const e of [].concat(esperada)) assert.ok(e === null || skills.includes(e), `${frase}: "${e}" no es una skill`);
  }
  assert.equal(new Set(frases.map(f => f.frase)).size, frases.length, 'frases repetidas');
});

test('datosDelCurso: el curso de ejemplo configurado, con el resultado de la prueba real encima', () => {
  const datos = datosDelCurso();
  for (const f of ['config/curso.md', 'config/profesor.md', 'config/estructura.json', 'estudio/progreso.md']) {
    assert.ok(fs.existsSync(path.join(datos, f)), `falta ${f}`);
  }
  const alumno = fs.readFileSync(path.join(datos, 'config', 'alumno.md'), 'utf8');
  assert.equal(alumno, fs.readFileSync(path.join(RAIZ, 'pruebas', 'curso-ejemplo', 'resultado', 'config', 'alumno.md'), 'utf8'));
  assert.doesNotMatch(fs.readFileSync(path.join(datos, 'config', 'curso.md'), 'utf8'), /estado: sin-configurar/);
  fs.rmSync(datos, { recursive: true, force: true });
});
