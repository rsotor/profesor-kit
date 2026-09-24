'use strict';
// examen.js --registrar: lo mecánico de corregir un examen (el histórico, las respuestas literales, el frontmatter,
// vaciar los huecos, marcar estudiada). El profesor solo aporta lo que es juicio: nota, veredicto y el resultado de
// cada pregunta, en un JSON.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cursoTemporal } = require('./ayuda');
const { registrar, corregir, cli, notaTest } = require('../examen');

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

test('registrar: numeración sin negrita ("1.", no solo "**1.**") no se come la pregunta siguiente', () => {
  const examenSinNegrita = [
    '---', 'tipo: examen', 'unidad: 01', 'fecha: 2026-10-01', 'nota:', '---', '# Examen', '',
    '1. Primera pregunta.', '', '✍️ **Tu respuesta:**', '',
    '2. Segunda pregunta, que antes del arreglo desaparecía.', '', '✍️ **Tu respuesta:**', '',
  ].join('\n');
  const raiz = curso({ 'estudio/examenes/m1/01-examen.md': examenSinNegrita });
  registrar(raiz, 'estudio/examenes/m1/01-examen.md', {
    nota: 5, preguntas: [{ resultado: '❌ Incorrecta (en blanco)', por_que: 'x' }, { resultado: '❌ Incorrecta (en blanco)', por_que: 'y' }],
  });
  const t = leer(raiz, 'examenes/m1/01-examen.md');
  assert.match(t, /^2\. Segunda pregunta, que antes del arreglo desaparecía\.$/m, 'sigue siendo su propia línea, no el "Tu respuesta" de la 1');
  assert.match(t, /^✍️ \*\*Tu respuesta:\*\*$/m, 'y el hueco de la 1 queda vacío, no se come la 2');
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
  assert.match(salida.join('\n'), /correccion\.json ya está borrado/);
  assert.match(salida.join('\n'), /Intento 1 registrado: 6,5 · aprobado · 1 enteras, 1 a medias, 0 falladas, 1 en blanco/);
  fs.writeFileSync(json, '{ roto');
  assert.equal(cli(['--registrar', 'estudio/examenes/m1/01-examen.md', '--correccion', 'correccion.json'], raiz), 1);
  assert.ok(fs.existsSync(json));
  assert.equal(cli([], raiz), 2);
});

// --- examen.js --corregir: el examen tipo test (docs/planes/2026-09-25-examen-v1.md) ------------------------

const EXAMEN_TEST = [
  '---', 'tipo: examen', 'tipo_examen: modulo', 'unidad: 01', 'fecha: 2026-10-01', 'nota:', 'aprobado: 6', '---',
  '# Examen del módulo 1', '',
  '**1.** ¿Cuál es la capital de Francia?', '',
  '- [ ] a) Madrid', '- [x] b) París', '- [ ] c) Roma', '',
  '**2.** ¿Qué números son pares? *(varias)*', '',
  '- [x] a) 2', '- [ ] b) 3', '- [ ] c) 4', '',
  '**3.** Pregunta sin contestar.', '',
  '- [ ] a) Uno', '- [ ] b) Dos', '',
].join('\n');

const CLAVE_TEST = {
  opciones: 4, resta_fallo: 0.25, aprobado: 6,
  preguntas: [
    { correctas: ['b'], explicacion: 'París es la capital.', concepto: 'geografia' },
    { correctas: ['a', 'c'], explicacion: '2 y 4 son pares.', concepto: 'numeros' },
    { correctas: ['a'], explicacion: 'Uno es la respuesta.', concepto: 'otro' },
  ],
};

function cursoTest(extra = {}) {
  return cursoTemporal({
    'estudio/examenes/m1/01-examen.md': EXAMEN_TEST,
    'config/claves/m1/01-examen.json': JSON.stringify(CLAVE_TEST),
    'estudio/sesiones/m1/01-01-01-dinero.md': '---\ntipo: sesion\nestudiada: false\n---\n# Dinero\n',
    ...extra,
  });
}

test('corregir: acierto exacto, fallo (marca de menos) y en blanco; nota con resta_fallo; desmarca las casillas', () => {
  const raiz = cursoTest();
  const r = corregir(raiz, 'estudio/examenes/m1/01-examen.md');
  assert.equal(r.aciertos, 1);
  assert.equal(r.fallos, 1);
  assert.equal(r.blancos, 1);
  assert.equal(r.nota, 2.5, '(1 − 0,25×1) / 3 × 10 = 2,5');
  assert.equal(r.aprobado, 6, 'el aprobado: del propio examen');
  assert.equal(r.aprobo, false);
  const t = leer(raiz, 'examenes/m1/01-examen.md');
  assert.doesNotMatch(t, /\[x\]/i, 'todas las casillas, desmarcadas');
  assert.match(t, /- \[ \] b\) París/);
  assert.match(t, /\| 1 \| b \| ✅ Correcta \| París es la capital\. \|/);
  assert.match(t, /\| 2 \| a \| ❌ Incorrecta \| Correcta: a, c\. 2 y 4 son pares\. \|/);
  assert.match(t, /\| 3 \| \*\(en blanco\)\* \| ❌ Incorrecta \(en blanco\) \| Uno es la respuesta\. \|/);
  assert.match(t, /^nota: 2\.5$/m);
  assert.match(t, /^intentos: 1$/m);
});

test('corregir: varias correctas, bien solo si marca exactamente esas (ni de más ni de menos)', () => {
  const raiz = cursoTest({
    'estudio/examenes/m1/01-examen.md': EXAMEN_TEST.replace('- [x] a) 2\n- [ ] b) 3\n- [ ] c) 4', '- [x] a) 2\n- [ ] b) 3\n- [x] c) 4'),
  });
  const r = corregir(raiz, 'estudio/examenes/m1/01-examen.md');
  assert.equal(r.aciertos, 2, 'la 1 y la 2 (a y c exactas), la 3 en blanco');
  assert.equal(r.fallos, 0);
});

test('corregir: si aprueba un examen de módulo, marca estudiada; un final, aunque apruebe, no', () => {
  const raiz = cursoTest({
    'estudio/examenes/m1/01-examen.md': EXAMEN_TEST
      .replace('- [x] a) 2\n- [ ] b) 3\n- [ ] c) 4', '- [x] a) 2\n- [ ] b) 3\n- [x] c) 4')
      .replace('- [ ] a) Uno\n- [ ] b) Dos', '- [x] a) Uno\n- [ ] b) Dos'),
  });
  const r = corregir(raiz, 'estudio/examenes/m1/01-examen.md');
  assert.equal(r.aciertos, 3);
  assert.equal(r.nota, 10);
  assert.equal(r.aprobo, true);
  assert.deepEqual(r.estudiadas, ['01-01-01-dinero']);

  const raizFinal = cursoTest({
    'estudio/examenes/m1/01-examen.md': EXAMEN_TEST.replace('tipo_examen: modulo', 'tipo_examen: final\nescalon: 1')
      .replace('- [x] a) 2\n- [ ] b) 3\n- [ ] c) 4', '- [x] a) 2\n- [ ] b) 3\n- [x] c) 4')
      .replace('- [ ] a) Uno\n- [ ] b) Dos', '- [x] a) Uno\n- [ ] b) Dos'),
  });
  const rFinal = corregir(raizFinal, 'estudio/examenes/m1/01-examen.md');
  assert.equal(rFinal.aprobo, true);
  assert.deepEqual(rFinal.estudiadas, [], 'un final no marca estudiada aunque apruebe');
});

test('corregir: sin clave, o con un número de preguntas que no cuadra, error claro y no toca el examen', () => {
  const sinClave = cursoTemporal({ 'estudio/examenes/m1/01-examen.md': EXAMEN_TEST });
  assert.throws(() => corregir(sinClave, 'estudio/examenes/m1/01-examen.md'), /falta la clave/);

  const raiz = cursoTest({ 'config/claves/m1/01-examen.json': JSON.stringify({ ...CLAVE_TEST, preguntas: CLAVE_TEST.preguntas.slice(0, 2) }) });
  const antes = leer(raiz, 'examenes/m1/01-examen.md');
  assert.throws(() => corregir(raiz, 'estudio/examenes/m1/01-examen.md'), /3 preguntas.*2/);
  assert.equal(leer(raiz, 'examenes/m1/01-examen.md'), antes);
});

test('corregir: repetirlo (casillas ya desmarcadas) añade un segundo intento debajo del primero', () => {
  const raiz = cursoTest();
  corregir(raiz, 'estudio/examenes/m1/01-examen.md');
  fs.writeFileSync(path.join(raiz, 'estudio/examenes/m1/01-examen.md'),
    leer(raiz, 'examenes/m1/01-examen.md').replace('- [ ] a) Uno', '- [x] a) Uno'));
  const r = corregir(raiz, 'estudio/examenes/m1/01-examen.md');
  assert.equal(r.intento, 2);
  assert.match(leer(raiz, 'examenes/m1/01-examen.md'), /\| 1 \|.*\n\| 2 \|/);
});

test('cli --corregir: nota, aprobado, fallos por concepto en stdout (JSON) para el profesor', t => {
  const salida = [];
  t.mock.method(console, 'log', (...a) => salida.push(a.join(' ')));
  const raiz = cursoTest();
  assert.equal(cli(['--corregir', 'estudio/examenes/m1/01-examen.md'], raiz), 0);
  assert.match(salida[0], /Intento 1 corregido: 2,5 · suspenso \(aprobado: 6\)/);
  const json = JSON.parse(salida[1]);
  assert.deepEqual(json, { nota: 2.5, aprobado: 6, aprobo: false, fallosPorConcepto: { numeros: 1, otro: 1 } }, 'fallos y en blanco, por concepto: los dos son señal de repasar');
});

test('notaTest: se trunca a un decimal, nunca se redondea hacia arriba (un 69,5 % no aprueba un escalón del 70 %)', () => {
  assert.equal(notaTest({ aciertos: 139, fallos: 61, total: 200, restaFallo: 0 }), 6.9);
  assert.equal(notaTest({ aciertos: 199, fallos: 1, total: 200, restaFallo: 0 }), 9.9, 'un 99,5 % no es un 10');
  assert.equal(notaTest({ aciertos: 29, fallos: 71, total: 100, restaFallo: 0 }), 2.9, 'sin el error de coma flotante de 29/100');
  assert.equal(notaTest({ aciertos: 2, fallos: 1, total: 3, restaFallo: 0.25 }), 5.8);
  assert.equal(notaTest({ aciertos: 0, fallos: 5, total: 5, restaFallo: 1 }), 0, 'nunca por debajo de 0');
  assert.equal(notaTest({ aciertos: 3, fallos: 0, total: 3, restaFallo: 0 }), 10);
});
