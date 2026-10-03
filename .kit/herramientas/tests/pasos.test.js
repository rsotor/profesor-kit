'use strict';
// pruebas/lib/pasos.js desde aquí (mismo patrón que prueba-real.test.js con un script fuera de .kit/).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ix = require('../lib/indice');
const { temporal } = require('./ayuda');
const { insertarAntesDelPie, simularAlumnoTrasSesiones, quedaMarcador, sesionConEjercicio } = require('../../../pruebas/lib/pasos');

test('insertarAntesDelPie: sin pie todavía, se añade al final', () => {
  const texto = '# Intro\n\nAlgo de contenido.\n';
  const resultado = insertarAntesDelPie(texto, '@@ una duda');
  assert.match(resultado, /Algo de contenido\.\n\n@@ una duda\n$/);
});

test('insertarAntesDelPie: con pie de navegación, se inserta antes del marcador (dentro del cuerpo)', () => {
  const pie = ix.pieDeSesion(null, null);
  const texto = `# Intro\n\nAlgo de contenido.\n\n${pie}\n`;
  const resultado = insertarAntesDelPie(texto, '@@ una duda');
  const iDuda = resultado.indexOf('@@ una duda');
  const iPie = resultado.indexOf(ix.MARCA_INICIO);
  assert.ok(iDuda >= 0 && iPie >= 0 && iDuda < iPie, 'la duda queda antes del pie, no detrás');
  assert.equal(ix.marcadoresRotos(resultado), false, 'el pie sigue teniendo sus dos marcadores intactos');
});

test('simularAlumnoTrasSesiones: la duda de la sesión queda dentro del cuerpo, no detrás del pie', () => {
  const destino = temporal('kit-pasos-');
  const sesionDir = path.join(destino, 'estudio', 'sesiones');
  fs.mkdirSync(sesionDir, { recursive: true });
  const pie = ix.pieDeSesion(null, null);
  fs.writeFileSync(
    path.join(sesionDir, 's01-intro.md'),
    `---\ntipo: sesion\nestudiada: false\n---\n# Intro\n\n## Conceptos\n\n- [[alfa]]\n\n${pie}\n`,
  );
  const conceptosDir = path.join(destino, 'estudio', 'conceptos');
  fs.mkdirSync(conceptosDir, { recursive: true });
  fs.writeFileSync(path.join(conceptosDir, 'alfa.md'), '---\ntipo: concepto\nalias: []\n---\n# Alfa\n');

  const tocado = simularAlumnoTrasSesiones(destino, '@@');
  assert.ok(tocado.sesion, 'tocó la sesión');
  const texto = fs.readFileSync(path.join(sesionDir, 's01-intro.md'), 'utf8');
  const iDuda = texto.indexOf('@@ ¿por qué esto importa');
  const iPie = texto.indexOf(ix.MARCA_INICIO);
  assert.ok(iDuda >= 0 && iPie >= 0 && iDuda < iPie);
  assert.equal(ix.marcadoresRotos(texto), false);
  assert.ok(quedaMarcador(destino, '@@'), 'la duda sigue ahí (aún no la resolvió /dudas)');
});

test('sesionConEjercicio: verde con el ejercicio en la carpeta de su unidad (.md o .html)', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios', 'modulo-01', '1.1-dinero');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '01-01-01-inflacion.html'), '<p>x</p>');
  const r = sesionConEjercicio(destino, '01-01');
  assert.equal(r.ok, true);
  assert.match(r.detalle, /01-01-01-inflacion\.html/);
});

test('sesionConEjercicio: verde con el ejercicio en plano (curso sin estructura)', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 's01-interes.md'), '# Ejercicio\n');
  assert.equal(sesionConEjercicio(destino, 's01').ok, true);
});

test('sesionConEjercicio: rojo sin ninguno, aunque haya _index.md y .gitkeep (o ni exista la carpeta)', () => {
  const destino = temporal('kit-pasos-');
  assert.equal(sesionConEjercicio(destino, '01-01').ok, false);
  const dir = path.join(destino, 'estudio', 'ejercicios');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_index.md'), '01-01 aparece aquí\n');
  fs.writeFileSync(path.join(dir, '.gitkeep'), '');
  const r = sesionConEjercicio(destino, '01-01');
  assert.equal(r.ok, false);
  assert.match(r.detalle, /no hay ningún ejercicio/);
});

test('sesionConEjercicio: rojo si solo hay ejercicios de otra clase o entregas del alumno', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios', 'modulo-01', '1.2-presupuesto');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '01-02-01-colchon.md'), '# Ejercicio\n');
  fs.mkdirSync(path.join(destino, 'estudio', 'ejercicios', 'entregas'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'estudio', 'ejercicios', 'entregas', '01-01-mi-entrega.md'), 'x');
  assert.equal(sesionConEjercicio(destino, '01-01').ok, false);
  assert.equal(sesionConEjercicio(destino, '01-02').ok, true);
});
