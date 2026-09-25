'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const gen = require('../lib/generados');
const { guardar } = require('../guardar');
const { cursoTemporal, iniciarGit } = require('./ayuda');

// beta: bloque 2, con fórmula y con ejercicio propio.
const BETA = '---\ntipo: concepto\nalias: []\nbloques: [2]\nejercicio: ej-beta\n---\n# Beta\n\n## La fórmula\n\n'
  + '$$ x = y $$\n\nExplicación de x e y.\n\n## Practícalo\n\n→ **[Jugar](../ejercicios/ej-beta.html)**\n\n'
  + 'Mueve x y mira qué pasa con el resultado.\n';
const EJ_BETA = { 'estudio/conceptos/beta.md': BETA, 'estudio/ejercicios/ej-beta.html': '<p>x</p>' };

test('formulas: solo los conceptos con "## La fórmula" no vacía, con su bloque y su título', () => {
  const raiz = cursoTemporal(EJ_BETA);   // alfa (BASE) no tiene fórmula
  const lista = gen.formulas(raiz);
  assert.deepEqual(lista.map(f => f.slug), ['beta']);
  assert.equal(lista[0].bloque, '2');
  assert.equal(lista[0].titulo, 'Beta');
  assert.match(lista[0].cuerpo, /\$\$ x = y \$\$\n\nExplicación de x e y\./);
});

test('markdownFormulario: agrupa por bloque, enlaza el concepto, y avisa si no hay ninguna', () => {
  const raiz = cursoTemporal(EJ_BETA);
  const md = gen.markdownFormulario(raiz);
  assert.match(md, /^# Formulario/);
  assert.match(md, /no lo edites/);
  assert.match(md, /## Bloque 2\n\n### \[\[beta\|Beta\]\]\n\n\$\$ x = y \$\$/);
  assert.equal(gen.markdownFormulario(cursoTemporal()), gen.markdownFormulario(cursoTemporal()));
  assert.match(gen.markdownFormulario(cursoTemporal()), /La primera letra/, 'sin fórmulas, las definiciones');
});

test('markdownFormulario: sin bloques: va a "Sin bloque"', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\n---\n# Beta\n\n## La fórmula\n\n$$ x $$\n',
  });
  assert.match(gen.markdownFormulario(raiz), /## Sin bloque\n\n### \[\[beta\|Beta\]\]/);
});

test('ejercicios: un concepto sin `ejercicio:` no sale; el que lo declara trae su ruta real y lo que se descubre', () => {
  const raiz = cursoTemporal(EJ_BETA);
  const lista = gen.ejercicios(raiz);
  assert.deepEqual(lista.map(e => e.concepto), ['beta']);
  assert.equal(lista[0].ejercicio, 'ej-beta');
  assert.equal(lista[0].ruta, 'ej-beta.html');
  assert.equal(lista[0].descubre, 'Mueve x y mira qué pasa con el resultado.');
});

test('ejercicios: si el fichero declarado no existe, la ruta es null (y el índice lo dice, no revienta)', () => {
  const raiz = cursoTemporal({ 'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nejercicio: no-existe\n---\n# Beta\n' });
  assert.equal(gen.ejercicios(raiz)[0].ruta, null);
  assert.match(gen.markdownEjercicios(raiz), /no se encuentra el fichero/);
});

test('markdownEjercicios: las dos tablas, con enlace al concepto (barra escapada) y al ejercicio', () => {
  const raiz = cursoTemporal(EJ_BETA);
  const md = gen.markdownEjercicios(raiz);
  assert.match(md, /^# Índice de ejercicios/);
  assert.match(md, /## Por ejercicio\n\n\| Ejercicio \| Concepto \| Lo que se descubre fallándolo \|/);
  assert.match(md, /\| \[ej beta\]\(ej-beta\.html\) \| \[\[beta\\\|Beta\]\] \| Mueve x y mira qué pasa con el resultado\. \|/);
  assert.match(md, /## Por concepto\n\n\| Concepto \| Ejercicio \| Lo que se descubre fallándolo \|/);
  assert.match(md, /\| \[\[beta\\\|Beta\]\] \| \[ej beta\]\(ej-beta\.html\) \| Mueve x y mira qué pasa con el resultado\. \|/);
  assert.match(gen.markdownEjercicios(cursoTemporal()), /Ningún ejercicio todavía\./);
});

test('un ejercicio que sirve a varios conceptos sale una vez por cada uno, cada uno con lo suyo', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nejercicio: compartido\n---\n# Beta\n\n## Practícalo\n\ndesde beta\n',
    'estudio/conceptos/gamma.md': '---\ntipo: concepto\nalias: []\nejercicio: compartido\n---\n# Gamma\n\n## Practícalo\n\ndesde gamma\n',
    'estudio/ejercicios/compartido.html': '<p>x</p>',
  });
  const filas = gen.ejercicios(raiz);
  assert.deepEqual(filas.map(f => [f.concepto, f.descubre]).sort(), [['beta', 'desde beta'], ['gamma', 'desde gamma']]);
});

test('guardar regenera formulario.md y ejercicios/_index.md, creando la carpeta ejercicios/ si hiciera falta', () => {
  const raiz = cursoTemporal(EJ_BETA);
  iniciarGit(raiz);
  fs.rmSync(path.join(raiz, 'estudio', 'ejercicios'), { recursive: true });   // la carpeta desaparece del todo
  const r = guardar({ raiz, mensaje: 'x', permitirErrores: true });
  assert.equal(r.guardado, true, JSON.stringify(r.informe.errores));
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'formulario.md'), 'utf8'), /Bloque 2/);
  const indiceEjercicios = fs.readFileSync(path.join(raiz, 'estudio', 'ejercicios', '_index.md'), 'utf8');
  assert.match(indiceEjercicios, /no se encuentra el fichero/);   // el .html ya no está: se avisa, no revienta
});

test('markdownFormulario: un curso sin fórmulas reúne la definición de cada concepto, de su nota o del índice', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/_index.md': '# Índice\n\n## Conceptos\n\n```\nalfa | La primera letra | B1 | 1 | alias: a\nromanico | Estilo del siglo XI | 1 | 2 | alias:\n```\n',
    'estudio/conceptos/romanico.md': '---\ntipo: concepto\nbloques: [1]\nalias: []\n---\n# Románico\n\n> **En una frase:** El arte de los monasterios.\n',
  });
  const md = gen.markdownFormulario(raiz);
    assert.match(md, /## Bloque 1\n\n- \[\[romanico\|Románico\]\]: El arte de los monasterios\./, 'la de la nota manda');
  assert.match(md, /- \[\[alfa\|Alfa\]\]: La primera letra/, 'si la nota no la trae, la del índice');
  assert.doesNotMatch(md, /### /);
});

test('markdownFormulario: se mezcla; cada concepto con su fórmula si la tiene, y si no, con su definición', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\n---\n# Beta\n\n> **En una frase:** La segunda.\n\n## La fórmula\n\n$$ b = 2 $$\n',
  });
  const md = gen.markdownFormulario(raiz);
  assert.match(md, /### \[\[beta\|Beta\]\]\n\n\$\$ b = 2 \$\$/);
  assert.doesNotMatch(md, /La segunda/, 'con fórmula, no se repite la definición');
  assert.match(md, /### Definiciones\n\n- \[\[alfa\|Alfa\]\]: La primera letra/, 'el concepto sin fórmula también sale');
});

// pendientes(): FALTA INFO/TODO dentro de una fila de tabla (issue #51) -------------------------------------

test('pendientes: FALTA INFO en una celda de tabla lleva la primera celda como contexto y corta en la barra', () => {
  const raiz = cursoTemporal({
    'estudio/mapa-del-curso.md': '# Mapa\n\n| Sesión | Estado |\n|---|---|\n| 1.4.4 Masterclass: el oro | FALTA INFO: no hay material |\n',
  });
  const [p] = gen.pendientes(raiz).filter(x => x.tipo === 'falta-info');
  assert.equal(p.texto, '1.4.4 Masterclass: el oro: no hay material');
});

test('pendientes: fuera de tablas, FALTA INFO sigue capturando toda la línea como antes', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n⚠️ **FALTA INFO:** la tabla de la diapositiva 4\n',
  });
  const [p] = gen.pendientes(raiz).filter(x => x.tipo === 'falta-info');
  assert.equal(p.texto, 'la tabla de la diapositiva 4');
});

test('pendientes: TODO en una fila de tabla, con paréntesis abierto antes de la marca, limpia el ")" y el "**" sueltos', () => {
  const raiz = cursoTemporal({
    'estudio/mapa-del-curso.md': '# Mapa\n\n| Sesión | Estado |\n|---|---|\n'
      + '| 2.3.1 DCA | (aparece en clase pero **TODO:** origen de "Límites del DCA", no está en el menú) |\n',
  });
  const [p] = gen.pendientes(raiz).filter(x => x.tipo === 'todo');
  assert.equal(p.texto, '2.3.1 DCA: origen de "Límites del DCA", no está en el menú');
});

test('pendientes: cuatro filas con el mismo texto de FALTA INFO se distinguen por su primera celda', () => {
  const raiz = cursoTemporal({
    'estudio/mapa-del-curso.md': '# Mapa\n\n| Sesión | Estado |\n|---|---|\n'
      + '| 1.1.1 Uno | FALTA INFO: no hay material |\n'
      + '| 1.1.2 Dos | FALTA INFO: no hay material |\n'
      + '| 1.1.3 Tres | FALTA INFO: no hay material |\n'
      + '| 1.1.4 Cuatro | FALTA INFO: no hay material |\n',
  });
  const textos = gen.pendientes(raiz).filter(x => x.tipo === 'falta-info').map(x => x.texto);
  assert.deepEqual(textos, [
    '1.1.1 Uno: no hay material', '1.1.2 Dos: no hay material', '1.1.3 Tres: no hay material', '1.1.4 Cuatro: no hay material',
  ]);
});

test('pendientes: si la primera celda es un enlace con alias (barra escapada), sale legible', () => {
  const raiz = cursoTemporal({
    'estudio/mapa-del-curso.md': '# Mapa\n\n| Sesión | Estado |\n|---|---|\n'
      + '| [[sesiones/s01-intro\\|1.1 Intro]] | FALTA INFO: no hay material |\n',
  });
  const [p] = gen.pendientes(raiz).filter(x => x.tipo === 'falta-info');
  assert.equal(p.texto, '[[sesiones/s01-intro|1.1 Intro]]: no hay material');
});

// pendientes(): los ficheros que genera el propio kit no se leen como fuente (issue #51) ---------------------

test('pendientes: un TODO de un concepto no se duplica si también está en formulario.md (lo genera el kit)', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nbloques: [2]\n---\n# Beta\n\n**TODO:** el caso base no se agota hacia el año 59, sino hacia el 93\n',
    'estudio/formulario.md': '# Formulario\n\n## Bloque 2\n\n- [[beta|Beta]]: **TODO:** el caso base no se agota hacia el año 59, sino hacia el 93\n',
  });
  const apariciones = gen.pendientes(raiz).filter(x => x.tipo === 'todo' && /caso base/.test(x.texto));
  assert.equal(apariciones.length, 1);
  assert.equal(apariciones[0].fichero, 'conceptos/beta.md');
});

test('pendientes: no mira inicio.md ni ejercicios/_index.md, aunque exista un TODO ahí (los genera el kit)', () => {
  const raiz = cursoTemporal({
    'estudio/inicio.md': '# Inicio\n\n**TODO:** solo del generado\n',
    'estudio/ejercicios/_index.md': '# Índice de ejercicios\n\n**TODO:** solo del generado\n',
  });
  const apariciones = gen.pendientes(raiz).filter(x => /solo del generado/.test(x.texto));
  assert.equal(apariciones.length, 0);
});

test('pendientes: si la marca está en la primera celda, no se pone a sí misma de contexto', () => {
  const raiz = cursoTemporal({
    'estudio/mapa-del-curso.md': '# Mapa\n\n| Estado | Sesión |\n|---|---|\n| FALTA INFO: no hay material | 1.4.4 |\n',
  });
  const [p] = gen.pendientes(raiz).filter(x => x.tipo === 'falta-info');
  assert.equal(p.texto, 'no hay material');
});
