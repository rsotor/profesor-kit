'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

const avisos = (raiz, regla) => comprobar(raiz).avisos.filter(a => a.regla === regla);

test('los marcadores de duda son aviso, no error, y se cuentan también en inbox', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n@@ no lo pillo\n\n`@@` documentado no cuenta\n',
    'estudio/inbox/apuntes.md': 'texto @@ otra duda\n',
  });
  const informe = comprobar(raiz);
  assert.equal(informe.errores.length, 0);
  assert.equal(avisos(raiz, 'duda-pendiente').length, 2);
});

test('el marcador se lee de config/profesor.md', () => {
  const raiz = cursoTemporal({
    'config/profesor.md': '---\nmarcador_dudas: "??"\n---\n',
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n?? duda\n@@ esto ya no es marcador\n',
  });
  assert.equal(avisos(raiz, 'duda-pendiente').length, 1);
});

test('TODO y FALTA INFO son avisos distintos', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n**TODO:** preguntar\n\n⚠️ **FALTA INFO:** la tabla\n',
  });
  assert.equal(avisos(raiz, 'todo').length, 1);
  assert.equal(avisos(raiz, 'falta-info').length, 1);
});

test('patrón prohibido de ajustes.json es error', () => {
  const raiz = cursoTemporal({
    'config/ajustes.json': JSON.stringify({ patrones_prohibidos: [{ patron: 'siglo [IVXLC]+\\b(?! [ad]\\. ?C\\.)', mensaje: 'siglo sin a. C. / d. C.' }] }),
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\nOcurrió en el siglo IV y poco más.\n',
  });
  const e = comprobar(raiz).errores.filter(x => x.regla === 'patron-prohibido');
  assert.equal(e.length, 1);
  assert.match(e[0].detalle, /línea 5/);
});

test('un patrón mal escrito no rompe la herramienta: es aviso', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ patrones_prohibidos: [{ patron: '(', mensaje: 'x' }] }) });
  assert.equal(avisos(raiz, 'patron-invalido').length, 1);
});

test('concepto que nadie enlaza es huérfano', () => {
  const raiz = cursoTemporal({ 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\nsin enlaces\n' });
  assert.equal(avisos(raiz, 'huerfano').length, 1);
});

test('slugs que comparten palabra larga son posible duplicado', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/duracion-modificada.md': '---\ntipo: concepto\nalias: []\n---\n',
    'estudio/conceptos/duracion-efectiva.md': '---\ntipo: concepto\nalias: []\n---\n',
  });
  assert.equal(avisos(raiz, 'posible-duplicado').length, 1);
});

// Límites de Obsidian al dibujar: van en el núcleo porque no dependen del curso.
const EURO = '€';
const nota = cuerpo => ({ 'estudio/conceptos/alfa.md': `---\ntipo: concepto\nalias: []\n---\n${cuerpo}\n` });
const dibujo = raiz => avisos(raiz, 'no-se-vera-bien').map(a => a.detalle);

test('moneda dentro de una fórmula: aviso en línea y en bloque; fuera de la fórmula, no', () => {
  assert.equal(dibujo(cursoTemporal(nota(`El capital es $C_0 = 1000 ${EURO}$ al inicio.`))).length, 1);
  assert.equal(dibujo(cursoTemporal(nota(`$$\nC_n = 1000 ${EURO} \\cdot (1+r)^n\n$$`))).length, 1);
  assert.equal(dibujo(cursoTemporal(nota(`$$ C_n = C_0 \\cdot (1+r)^n $$\n\n1.000 ${EURO} × 1,10 = **1.100 ${EURO}**`))).length, 0);
  assert.match(dibujo(cursoTemporal(nota(`$x = 5 ${EURO}$`)))[0], /línea 5: símbolo de moneda/);
});

test('% sin proteger dentro de una fórmula: aviso; protegido o fuera de la fórmula, no', () => {
  assert.match(dibujo(cursoTemporal(nota('La tasa es $r = 5%$ anual.')))[0], /% sin proteger/);
  assert.equal(dibujo(cursoTemporal(nota('La tasa es $r = 5\\%$ anual, un 5% en texto.'))).length, 0);
});

test('no confunde precios en dólares ni código con fórmulas', () => {
  assert.equal(dibujo(cursoTemporal(nota(`Cuesta 5 $ aquí y 7 $ allí, o sea 10 ${EURO}.\n\n\`$x = 5 ${EURO}$\` en código no cuenta.\n\n\`\`\`\n$y = 3%$\n\`\`\``))).length, 0);
});

test('enlace con alias dentro de una tabla: aviso si la barra no está protegida', () => {
  const tabla = celda => nota(`| Concepto | Nota |\n|---|---|\n| uno | ${celda} |`);
  assert.match(dibujo(cursoTemporal(tabla('[[alfa|la letra]]')))[0], /alias dentro de una tabla/);
  assert.equal(dibujo(cursoTemporal(tabla('[[alfa\\|la letra]]'))).length, 0);
  assert.equal(dibujo(cursoTemporal(nota('Fuera de una tabla, [[alfa|la letra]] va bien.'))).length, 0);
});

test('son avisos: no bloquean el guardado', () => {
  assert.deepEqual(comprobar(cursoTemporal(nota(`$x = 5 ${EURO}$ y $r = 5%$`))).errores, []);
});

test('el mismo alias en dos conceptos es aviso', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: [Alpha, otro]\n---\n',
    'estudio/conceptos/_index.md': '## Conceptos\n\n```\nalfa | d | 1 | 1 | alias: a\nbeta | d | 1 | 1 | alias: otro\n```\n',
    'estudio/progreso.md': '[[alfa]] [[beta]]', 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[beta]]\n',
  });
  const a = avisos(raiz, 'alias-repetido');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /«Alpha» también está en alfa/);
});
