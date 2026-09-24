'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

const reglas = informe => informe.errores.map(e => e.regla);

test('un curso sano no tiene errores', () => {
  assert.deepEqual(comprobar(cursoTemporal()).errores, []);
});

test('enlace roto es error, pero no dentro de código', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[no-existe]] `[[tampoco]]`\n',
  });
  const errores = comprobar(raiz).errores.filter(e => e.regla === 'enlace-roto');
  assert.equal(errores.length, 1);
  assert.match(errores[0].detalle, /no-existe/);
});

test('enlace con alias y ancla se resuelve', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa|la letra]] [[alfa#El ejemplo]] [[conceptos/alfa]]\n',
  });
  assert.ok(!reglas(comprobar(raiz)).includes('enlace-roto'));
});

test('concepto sin línea en el índice, y línea sin nota', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\n---\n# Beta\n',
    'estudio/conceptos/_index.md': '## Conceptos\n\n```\nalfa | def | B1 | 1 | alias: a\ngamma | def | B1 | 1 | alias:\n```\n',
    'estudio/progreso.md': '[[alfa]] [[beta]]',
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[beta]]\n',
  });
  const detalles = comprobar(raiz).errores.filter(e => e.regla === 'indice').map(e => e.detalle).join(' | ');
  assert.match(detalles, /beta/);
  assert.match(detalles, /gamma/);
});

test('la línea de formato del índice no cuenta como concepto', () => {
  assert.ok(!reglas(comprobar(cursoTemporal())).includes('indice'));
});

test('concepto sin frontmatter o sin alias es error', () => {
  const raiz = cursoTemporal({ 'estudio/conceptos/alfa.md': '# Alfa sin frontmatter\n' });
  assert.ok(reglas(comprobar(raiz)).includes('frontmatter'));
});

test('concepto que no está en progreso.md es error', () => {
  const raiz = cursoTemporal({ 'estudio/progreso.md': '# Progreso\n' });
  assert.ok(reglas(comprobar(raiz)).includes('progreso'));
});

test('una sesión que no está en mapa-del-curso.md no es error: el índice es inicio.md, y se genera solo', () => {
  const raiz = cursoTemporal({ 'estudio/mapa-del-curso.md': '# Mapa\n' });
  assert.ok(!reglas(comprobar(raiz)).includes('mapa'));
});

test('enlace a .html inexistente y ejercicio declarado sin fichero', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nejercicio: alfa\n---\n[jugar](../ejercicios/alfa.html)\n',
  });
  const r = reglas(comprobar(raiz));
  assert.ok(r.includes('html-roto'));
  assert.ok(r.includes('ejercicio'));
});

test('un enlace con alias escapado dentro de una tabla ([[nota\\|texto]]) no es un enlace roto', () => {
  const raiz = cursoTemporal({ 'estudio/formulario.md': '# F\n\n| a | b |\n|---|---|\n| [[alfa\\|Alfa]] | x |\n' });
  assert.ok(!comprobar(raiz).errores.some(e => e.regla === 'enlace-roto'), JSON.stringify(comprobar(raiz).errores));
});

// Verificar el JS de un ejercicio sin comandos a mano (prueba real del 2026-09-24: `sed … > /tmp/ej.js && node --check`
// pedía permiso, y sin nadie delante se denegaba): lo compila comprobar.js, sin ejecutarlo.
test('un ejercicio o un repaso HTML con un error de sintaxis en su JS es error, con la línea del .html', () => {
  const raiz = cursoTemporal({
    'estudio/ejercicios/s01/bien.html': '<html><body>\n<script>\nconst x = 1;\nfunction f() { return x * 2; }\n</script>\n<script type="application/json">{"no": "es js"</script>\n</body></html>\n',
    'estudio/ejercicios/s01/roto.html': '<html><body>\n<p>hola</p>\n<script>\nconst x = 1;\nfunction f( { return x; }\n</script>\n</body></html>\n',
    'estudio/repasos/m1/repaso.html': '<script type="text/javascript">let a = ;</script>',
  });
  const errores = comprobar(raiz).errores.filter(e => e.regla === 'ejercicio-con-errores');
  assert.deepEqual(errores.map(e => e.fichero).sort(), ['ejercicios/s01/roto.html', 'repasos/m1/repaso.html']);
  assert.match(errores.find(e => e.fichero.endsWith('roto.html')).detalle, /línea 5/);
  assert.match(errores[0].detalle, /no funciona|la página/);
});

test('un ejercicio HTML que carga algo de internet es aviso: tiene que funcionar sin red, con doble clic', () => {
  const raiz = cursoTemporal({
    'estudio/ejercicios/s01/red.html': '<script src="https://cdn.example.com/lib.js"></script><link rel="stylesheet" href="//fonts.example.com/a.css"><script>1</script>',
    'estudio/ejercicios/s01/local.html': '<a href="https://es.wikipedia.org/wiki/Inflación">más</a><script>1</script>',
  });
  const avisos = comprobar(raiz).avisos.filter(a => a.regla === 'ejercicio-con-red');
  assert.deepEqual(avisos.map(a => a.fichero), ['ejercicios/s01/red.html'], 'un enlace para leer más no carga nada');
  assert.match(avisos[0].detalle, /cdn\.example\.com.*fonts\.example\.com/);
});
