'use strict';
// El proceso hijo que lanza verificar-ejercicio.js para ejecutar de verdad el JS de un ejercicio. Vive
// aparte y no requiere ningún otro fichero del kit a propósito: es el único fichero al que este proceso
// tiene permiso de leer (se lanza con `node --permission --allow-fs-read=<esta ruta>`, sin
// --allow-fs-write, --allow-child-process ni --allow-worker).
//
// `vm` aísla el JS del ejercicio de las variables de este fichero, pero no del proceso: hay formas conocidas
// de escapar de un `vm.Script` (`this.constructor.constructor('return process')()` llega al `process` de
// verdad). Por eso la seguridad no depende de `vm` — depende de que el proceso entero, escape o no,
// no tenga permiso para tocar el disco ni lanzar procesos o hilos. Eso lo impone `--permission`, no este
// fichero: un ejercicio manipulado por el material del alumno como mucho revienta este proceso hijo.
//
// Entrada por stdin: {"codigo": "<todo el JS del ejercicio>", "casos": [{...}, ...]}.
// Salida por stdout: {"error": "..."} si el ejercicio no carga o no expone verificar(), o
// {"resultados": [{"caso":{...}, "esperado":…, "obtenido":…}, …]} — un caso con "error" es una excepción
// suya, y no corta a los demás.
const fs = require('node:fs');
const vm = require('node:vm');

function elementoFalso() {
  const atributos = {};
  return {
    value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, checked: false, className: '',
    style: {}, dataset: {},
    onclick: null, oninput: null, onchange: null,
    addEventListener() {}, removeEventListener() {},
    getAttribute: n => (n in atributos ? atributos[n] : null),
    setAttribute: (n, val) => { atributos[n] = String(val); },
    appendChild() {}, remove() {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
  };
}

function documentoFalso() {
  const elementos = new Map();
  const porId = id => {
    if (!elementos.has(id)) elementos.set(id, elementoFalso());
    return elementos.get(id);
  };
  return {
    getElementById: porId,
    querySelector: sel => (sel.startsWith('#') ? porId(sel.slice(1)) : null),
    querySelectorAll: () => [],
    createElement: () => elementoFalso(),
    addEventListener() {}, removeEventListener() {},
    body: elementoFalso(),
  };
}

// `window` es el propio contexto: `window.verificar = fn` deja `verificar` accesible como global, igual que
// en un navegador de verdad (window ES el objeto global ahí).
function contexto() {
  const sandbox = {
    document: documentoFalso(),
    console: { log() {}, warn() {}, error() {} },
    navigator: { language: 'es-ES' },
    location: { href: '' },
    setTimeout, clearTimeout,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function main() {
  const entrada = JSON.parse(fs.readFileSync(0, 'utf8'));
  const sandbox = contexto();
  try {
    new vm.Script(entrada.codigo, { filename: 'ejercicio.html' }).runInContext(sandbox);
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: `el ejercicio revienta al cargar: ${error.message}` }));
    return;
  }
  if (typeof sandbox.verificar !== 'function') {
    process.stdout.write(JSON.stringify({
      error: 'no expone "window.verificar = function (caso) {...}": añádela con la misma lógica que ya decide '
        + 'la respuesta correcta, para poder barrer casos sin un script aparte.',
    }));
    return;
  }
  const resultados = entrada.casos.map(caso => {
    const { esperado, ...datos } = caso;
    try {
      return { caso: datos, esperado, obtenido: sandbox.verificar(datos) };
    } catch (error) {
      return { caso: datos, esperado, error: error.message };
    }
  });
  process.stdout.write(JSON.stringify({ resultados }));
}

main();
