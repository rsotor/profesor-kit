'use strict';
// verificar-ejercicio.js: ejecuta de verdad el JS de un ejercicio HTML (no solo lo compila, como comprobar.js)
// para barrer casos, sin que el profesor tenga que escribir un script propio fuera del curso (prueba real del
// 2026-09-24: se le denegaba). El JS del ejercicio no es de fiar (lo escribe un LLM a partir de material que
// puede venir manipulado): se ejecuta en un hijo con `node --permission`, sin permiso de escribir en disco ni
// de lanzar procesos o hilos, y con un tiempo máximo — no en el proceso de esta herramienta.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { temporal } = require('./ayuda');
const { cli, ejecutarEnHijo, rangos, casoAlAzar, informe } = require('../verificar-ejercicio');

// Un ejercicio de verdad: la lógica vive dentro de una IIFE (como los que escribe /ejercicio) y solo se ve
// desde fuera lo que se expone a propósito en `window.verificar`.
const EJERCICIO = `<!DOCTYPE html><html><body>
<input type="range" id="gas" min="600" max="2000" step="50" value="1000">
<input type="range" id="mes" min="1" max="12" step="1" value="3">
<div id="botones"><button data-r="aguanta"></button></div>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function decidir(caso) { return caso.gas * caso.mes > 3000 ? 'alto' : 'bajo'; }
  // el resto del ejercicio, tal cual tocaría el DOM en un navegador de verdad
  $('gas').oninput = function () {};
  $('botones').onclick = function () {};
  window.verificar = decidir;
})();
</script>
</body></html>`;

const SIN_VERIFICAR = '<html><body><script>(function () { var x = 1; })();</script></body></html>';
const SIN_SCRIPT = '<html><body><p>nada</p></body></html>';
const QUE_LANZA = '<script>window.verificar = function (caso) { if (caso.x < 0) throw new Error("x negativo"); return caso.x; };</script>';
const BUCLE_INFINITO = '<script>window.verificar = function () { while (true) {} };</script>';

function fichero(nombre, contenido, dir = temporal('kit-verificar-ejercicio-')) {
  const f = path.join(dir, nombre);
  fs.writeFileSync(f, contenido);
  return f;
}

test('ejecutarEnHijo: aísla la lógica dentro de la IIFE, y "verificar" responde caso a caso', () => {
  const r = ejecutarEnHijo(fichero('ej.html', EJERCICIO), [{ gas: 1000, mes: 4 }, { gas: 500, mes: 1 }]);
  assert.deepEqual(r.map(x => x.obtenido), ['alto', 'bajo']);
});

test('ejecutarEnHijo: sin ningún <script>, error claro', () => {
  assert.throws(() => ejecutarEnHijo(fichero('sin-script.html', SIN_SCRIPT), [{}]), /ningún <script>/);
});

test('ejecutarEnHijo: sin window.verificar, error que dice exactamente qué falta', () => {
  assert.throws(() => ejecutarEnHijo(fichero('sin-verificar.html', SIN_VERIFICAR), [{}]), /window\.verificar/);
});

// El ataque exacto de la revisión de seguridad: escapar del `vm` con this.constructor.constructor(...) para
// llegar al `process` de verdad y escribir en disco. El aislamiento ya no depende de `vm` (se sabe que se
// puede escapar): depende de que el proceso hijo no tenga permiso de escritura, escape o no. Tras ejecutar,
// el fichero no debe existir, y la herramienta tiene que informar del fallo sin reventar.
test('seguridad: un ejercicio que intenta escapar del vm y escribir en disco no lo consigue, y se informa sin reventar', () => {
  const dir = temporal('kit-verificar-ejercicio-');
  const objetivo = path.join(dir, 'pwned.txt');
  const ataque = `<script>
    window.verificar = function (caso) {
      const p = this.constructor.constructor('return process')();
      p.mainModule.require('fs').writeFileSync(${JSON.stringify(objetivo)}, 'pwned');
      return 'nunca-llega';
    };
  </script>`;
  const r = ejecutarEnHijo(fichero('ataque.html', ataque, dir), [{}]);
  assert.equal(fs.existsSync(objetivo), false, 'el fichero no se ha podido escribir');
  assert.equal(r.length, 1);
  assert.match(r[0].error, /Access|permis|denied/i);
  const resultado = informe(r);
  assert.equal(resultado.ok, false);
  assert.match(resultado.texto, /han lanzado una excepción/);
});

// Un bucle infinito en verificar() no puede colgar la herramienta: se corta con un tiempo máximo.
test('seguridad: un bucle infinito se corta con el tiempo máximo, en vez de colgar la herramienta', () => {
  const t0 = Date.now();
  assert.throws(
    () => ejecutarEnHijo(fichero('bucle.html', BUCLE_INFINITO), [{}], { tiempoMaximoMs: 500 }),
    /bucle infinito|tiempo máximo/,
  );
  assert.ok(Date.now() - t0 < 5000, 'se ha cortado enseguida, no ha esperado de más');
});

test('rangos: lee id, min, max y step de cada <input type="range">', () => {
  const r = rangos(fichero('ej2.html', EJERCICIO));
  assert.deepEqual(r, [
    { id: 'gas', min: 600, max: 2000, step: 50 },
    { id: 'mes', min: 1, max: 12, step: 1 },
  ]);
});

test('casoAlAzar: cae dentro del rango y respeta el step', () => {
  const r = rangos(fichero('ej3.html', EJERCICIO));
  for (let i = 0; i < 50; i++) {
    const caso = casoAlAzar(r);
    assert.ok(caso.gas >= 600 && caso.gas <= 2000 && (caso.gas - 600) % 50 === 0);
    assert.ok(caso.mes >= 1 && caso.mes <= 12);
  }
});

test('informe: cuenta aciertos y falla el caso con "esperado" distinto', () => {
  const r = ejecutarEnHijo(fichero('ej4.html', EJERCICIO), [
    { gas: 1000, mes: 4, esperado: 'alto' },
    { gas: 500, mes: 1, esperado: 'alto' },   // mal a propósito: da "bajo"
  ]);
  const informado = informe(r);
  assert.equal(informado.ok, false);
  assert.match(informado.texto, /1\/2 casos con "esperado" coinciden/);
  assert.match(informado.texto, /esperado "alto", obtenido "bajo"/);
});

test('informe: sin "esperado", cuenta la distribución de respuestas', () => {
  const r = ejecutarEnHijo(fichero('ej5.html', EJERCICIO), [{ gas: 1000, mes: 4 }, { gas: 500, mes: 1 }, { gas: 900, mes: 5 }]);
  const informado = informe(r);
  assert.equal(informado.ok, true);
  assert.match(informado.texto, /alto: \d, bajo: \d|bajo: \d, alto: \d/);
});

test('informe: una excepción de un caso no tapa a los demás, y queda listada', () => {
  const r = ejecutarEnHijo(fichero('ej6.html', QUE_LANZA), [{ x: 5 }, { x: -1 }]);
  const informado = informe(r);
  assert.equal(informado.ok, false);
  assert.match(informado.texto, /1 han lanzado una excepción/);
  assert.match(informado.texto, /x negativo/);
});

test('cli: --casos con un fichero json dentro del curso', () => {
  const dir = temporal('kit-verificar-ejercicio-');
  fichero('ej.html', EJERCICIO, dir);
  fichero('casos.json', JSON.stringify([{ gas: 1000, mes: 4, esperado: 'alto' }]), dir);
  let salida = '';
  const original = console.log;
  console.log = t => { salida += t; };
  try { assert.equal(cli(['ej.html', '--casos', 'casos.json'], dir), 0); } finally { console.log = original; }
  assert.match(salida, /1\/1 casos con "esperado" coinciden/);
});

test('cli: --barrer genera casos al azar a partir de los <input type="range">', () => {
  const dir = temporal('kit-verificar-ejercicio-');
  fichero('ej.html', EJERCICIO, dir);
  let salida = '';
  const original = console.log;
  console.log = t => { salida += t; };
  try { assert.equal(cli(['ej.html', '--barrer', '20'], dir), 0); } finally { console.log = original; }
  assert.match(salida, /20 casos ejecutados/);
});

test('cli: sin fichero ni --casos/--barrer, uso por stderr y código 2', () => {
  assert.equal(cli([], '.'), 2);
});

test('cli: fichero que no existe, código 2', () => {
  assert.equal(cli(['no-existe.html', '--barrer', '5'], '.'), 2);
});

test('cli: --barrer en un ejercicio sin <input type="range">, pide --casos', () => {
  const dir = temporal('kit-verificar-ejercicio-');
  fichero('sin-rangos.html', QUE_LANZA, dir);
  assert.equal(cli(['sin-rangos.html', '--barrer', '5'], dir), 2);
});

test('cli: --casos con un fichero que no existe, código 2', () => {
  const dir = temporal('kit-verificar-ejercicio-');
  fichero('ej.html', EJERCICIO, dir);
  assert.equal(cli(['ej.html', '--casos', 'no-existe.json'], dir), 2);
});
