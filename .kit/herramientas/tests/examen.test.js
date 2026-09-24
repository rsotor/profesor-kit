'use strict';
// examen.js --registrar: lo mecánico de corregir un examen (el histórico, las respuestas literales, el frontmatter,
// vaciar los huecos, marcar estudiada). El profesor solo aporta lo que es juicio: nota, veredicto y el resultado de
// cada pregunta, en un JSON.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cursoTemporal } = require('./ayuda');
const { registrar, cli } = require('../examen');

const EXAMEN = [
  '---', 'tipo: examen', 'unidad: 01', 'fecha: 2026-10-01', 'nota:', '---', '# Examen del módulo 1', '',
  '**1.** Ana cobra 1.500 € y ahorra 300 €.', '', '¿Cuál es su tasa de ahorro? *(una cifra)*', '',
  '✍️ **Tu respuesta:** 20 %', '',
  '**2.** ¿Qué es la liquidez? *(en una frase)*', '',
  '✍️ **Tu respuesta:**', 'Que lo puedes vender rápido', 'sin perder | valor.', '',
  '**3.** ¿Gasto fijo o variable? *(una palabra)*', '',
  '✍️ **Tu respuesta:**', '',
  '> [!success]- Soluciones', '> 1. 20 %', '> ✍️ **Tu respuesta:** esto no es un hueco', '',
].join('\n');

const CORRECCION = {
  nota: 6.5, fecha: '2026-10-02',
  veredicto: ['✅ Dominado → tasa-de-ahorro', '⚠️ Hay que repasar → liquidez', '🔴 Vuelve a la nota → gastos-fijos-y-variables'],
  preguntas: [
    { resultado: '✅ Correcta', por_que: '300 ÷ 1.500.' },
    { resultado: '⚠️ Le falta: el efectivo', por_que: 'Sin perder valor, sí; pero es convertirlo en dinero.' },
    { resultado: '❌ Incorrecta (en blanco)', por_que: 'Fijo.' },
  ],
};

function curso(extra = {}) {
  return cursoTemporal({
    'config/curso.md': '---\naprobado: 6\n---\n# Curso\n',
    'estudio/examenes/m1/01-examen.md': EXAMEN,
    'estudio/sesiones/m1/01-01-01-dinero.md': '---\ntipo: sesion\nestudiada: false\n---\n# Dinero\n',
    'estudio/sesiones/m1/01-02-01-presupuesto.md': '---\ntipo: sesion\n---\n# Presupuesto\n',
    'estudio/sesiones/m2/02-01-01-interes.md': '---\ntipo: sesion\nestudiada: false\n---\n# Interés\n',
    ...extra,
  });
}
const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, 'estudio', ...rel.split('/')), 'utf8');

test('registrar: histórico con la fila y las respuestas literales, frontmatter, huecos vacíos; las soluciones no se tocan', () => {
  const raiz = curso();
  const r = registrar(raiz, 'estudio/examenes/m1/01-examen.md', CORRECCION);
  assert.equal(r.intento, 1);
  const t = leer(raiz, 'examenes/m1/01-examen.md');
  assert.match(t, /^---\ntipo: examen\nunidad: 01\nfecha: 2026-10-02\nnota: 6\.5\nintentos: 1\n---/);
  assert.match(t, /## Histórico de intentos\n\n\| Intento \| Fecha \| Nota \| Enteras \| A medias \| Falladas \| En blanco \|\n\|---\|---\|---\|---\|---\|---\|---\|\n\| 1 \| 2026-10-02 \| 6,5 \| 1 \| 1 \| 0 \| 1 \|\n/);
  assert.match(t, /> \[!example\]- Intento 1 · 2026-10-02 · tus respuestas y la corrección\n>\n> ✅ Dominado → tasa-de-ahorro\n/);
  assert.match(t, /> \| 1 \| 20 % \| ✅ Correcta \| 300 ÷ 1\.500\. \|/);
  assert.match(t, /> \| 2 \| Que lo puedes vender rápido sin perder \\\| valor\. \| ⚠️ Le falta: el efectivo \|/, 'varias líneas en una, y el | escapado');
  assert.match(t, /> \| 3 \| \*\(en blanco\)\* \| ❌ Incorrecta \(en blanco\) \| Fijo\. \|/);
  const antes = t.slice(0, t.indexOf('## Histórico'));
  assert.equal((antes.match(/^✍️ \*\*Tu respuesta:\*\*$/gm) || []).length, 3, 'los tres huecos, vacíos');
  assert.doesNotMatch(antes, /20 %\n\n\*\*2|vender rápido/);
  assert.match(antes, /> ✍️ \*\*Tu respuesta:\*\* esto no es un hueco/, 'lo de dentro de un callout no es un hueco');
});

test('registrar: el segundo intento se añade debajo y sube intentos; si aprueba, marca estudiadas las sesiones de su unidad', () => {
  const raiz = curso();
  registrar(raiz, 'estudio/examenes/m1/01-examen.md', { ...CORRECCION, nota: 5 });
  assert.equal(leer(raiz, 'sesiones/m1/01-01-01-dinero.md').includes('estudiada: true'), false, 'con un 5 y aprobado 6, no');
  fs.writeFileSync(path.join(raiz, 'estudio/examenes/m1/01-examen.md'),
    leer(raiz, 'examenes/m1/01-examen.md').replace('✍️ **Tu respuesta:**\n\n**2.**', '✍️ **Tu respuesta:** 20 %\n\n**2.**'));
  const enBlanco = { resultado: '❌ Incorrecta (en blanco)', por_que: 'x' };
  const r = registrar(raiz, 'estudio/examenes/m1/01-examen.md', { ...CORRECCION, nota: 7, fecha: '2026-10-09', preguntas: [CORRECCION.preguntas[0], enBlanco, enBlanco] });
  assert.equal(r.intento, 2);
  const t = leer(raiz, 'examenes/m1/01-examen.md');
  assert.match(t, /\| 1 \| 2026-10-02 \| 5 \|[^\n]*\n\| 2 \| 2026-10-09 \| 7 \|/);
  assert.match(t, /intentos: 2\n/);
  assert.ok(t.indexOf('Intento 1 · ') < t.indexOf('Intento 2 · '));
  assert.deepEqual(r.estudiadas.sort(), ['01-01-01-dinero', '01-02-01-presupuesto']);
  assert.match(leer(raiz, 'sesiones/m1/01-01-01-dinero.md'), /^---\ntipo: sesion\nestudiada: true\n---/);
  assert.match(leer(raiz, 'sesiones/m1/01-02-01-presupuesto.md'), /^---\ntipo: sesion\nestudiada: true\n---/);
  assert.match(leer(raiz, 'sesiones/m2/02-01-01-interes.md'), /estudiada: false/, 'otra unidad, no');
});

test('registrar: un test ("lo que me falta") no marca estudiada aunque apruebe', () => {
  const raiz = curso({ 'estudio/examenes/m1/01-examen.md': EXAMEN.replace('nota:\n', 'nota:\nparcial: true\n') });
  const r = registrar(raiz, 'estudio/examenes/m1/01-examen.md', { ...CORRECCION, nota: 9 });
  assert.deepEqual(r.estudiadas, []);
});

test('registrar: si la corrección no cuadra con el examen, no toca nada y dice por qué', () => {
  const raiz = curso();
  const antes = leer(raiz, 'examenes/m1/01-examen.md');
  const mal = [
    [{ ...CORRECCION, preguntas: CORRECCION.preguntas.slice(0, 2) }, /3 preguntas.*2 resultados/],
    [{ ...CORRECCION, preguntas: [{ resultado: 'Bien', por_que: 'x' }, ...CORRECCION.preguntas.slice(1)] }, /pregunta 1.*✅ Correcta/],
    [{ ...CORRECCION, preguntas: [...CORRECCION.preguntas.slice(0, 2), { resultado: '⚠️ Le falta: algo', por_que: 'x' }] }, /pregunta 3 está en blanco/],
    [{ ...CORRECCION, nota: '7/10' }, /nota/],
    [{ ...CORRECCION, nota: 11 }, /nota/],
  ];
  for (const [correccion, error] of mal) assert.throws(() => registrar(raiz, 'estudio/examenes/m1/01-examen.md', correccion), error);
  assert.equal(leer(raiz, 'examenes/m1/01-examen.md'), antes);
});

test('cli: lee la corrección de un JSON, la registra y borra el JSON; con errores, sale con 1 y lo deja', t => {
  const salida = [];
  t.mock.method(console, 'log', (...a) => salida.push(a.join(' ')));
  t.mock.method(console, 'error', (...a) => salida.push(a.join(' ')));
  const raiz = curso();
  const json = path.join(raiz, 'correccion.json');
  fs.writeFileSync(json, JSON.stringify(CORRECCION));
  assert.equal(cli(['--registrar', 'estudio/examenes/m1/01-examen.md', '--correccion', 'correccion.json'], raiz), 0);
  assert.ok(!fs.existsSync(json));
  assert.match(salida.join('\n'), /Intento 1 registrado: 6,5 · aprobado · 1 enteras, 1 a medias, 0 falladas, 1 en blanco/);
  fs.writeFileSync(json, '{ roto');
  assert.equal(cli(['--registrar', 'estudio/examenes/m1/01-examen.md', '--correccion', 'correccion.json'], raiz), 1);
  assert.ok(fs.existsSync(json));
  assert.equal(cli([], raiz), 2);
});
