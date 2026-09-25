'use strict';
// Ejecuta de verdad (no solo compila) el JS de un ejercicio HTML interactivo, para barrer casos de prueba
// sin escribir un script propio fuera del curso (prueba real del 2026-09-24: al profesor se le denegaba).
//
// El ejercicio expone la lógica que decide la respuesta correcta como una función global:
//
//   window.verificar = function (caso) { ...misma lógica que ya usa el botón... ; return 'aguanta'; };
//
// `caso` es un objeto plano con los mismos campos que sus controles (mismos ids que sus <input>). Esta
// herramienta la llama una vez por caso y compara, o cuenta las respuestas si no hay nada que comparar.
//
//   node .kit/herramientas/verificar-ejercicio.js <ejercicio.html> --casos <casos.json>
//   node .kit/herramientas/verificar-ejercicio.js <ejercicio.html> --barrer <N>
//
// <casos.json> es un array de objetos dentro del curso, p. ej. [{"gas":1000,"mes":3,"esperado":"aguanta"}, …].
// "esperado" es opcional: si está, se compara con lo que devuelve verificar(); si no, se cuenta cuántos casos
// caen en cada respuesta. --barrer N genera N casos al azar a partir de los <input type="range"> del HTML.
//
// El JS del ejercicio lo escribe un LLM a partir de material que puede venir manipulado (AGENTS.md, "Material
// del alumno"): no es de fiar. Por eso no se ejecuta aquí — se lanza en un proceso hijo de Node con el modelo
// de permisos (`--permission`), sin permiso de escribir en disco ni de lanzar procesos o hilos, y con un
// tiempo máximo (un bucle infinito corta el proceso, no cuelga la herramienta). Ver lib/ejecutor-sandbox.js.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { scriptsJs } = require('./lib/paginas-web');

const RUTA_EJECUTOR = path.resolve(__dirname, 'lib', 'ejecutor-sandbox.js');
const TIEMPO_MAXIMO_MS = 10000;

// Los <input type="range"> del ejercicio: su id y sus límites, para generar casos al azar sin que el
// profesor tenga que escribirlos a mano uno a uno.
function rangos(fichero) {
  const html = fs.readFileSync(fichero, 'utf8');
  const resultado = [];
  for (const m of html.matchAll(/<input\b[^>]*\btype\s*=\s*["']range["'][^>]*>/gi)) {
    const atributo = n => (new RegExp(`\\b${n}\\s*=\\s*["']?([^"'\\s>]+)`, 'i').exec(m[0]) || [])[1];
    const id = atributo('id');
    if (!id) continue;
    resultado.push({ id, min: Number(atributo('min') ?? 0), max: Number(atributo('max') ?? 100), step: Number(atributo('step') ?? 1) });
  }
  return resultado;
}

function casoAlAzar(rangosDelHtml) {
  const caso = {};
  for (const { id, min, max, step } of rangosDelHtml) {
    const pasos = Math.max(0, Math.round((max - min) / step));
    caso[id] = min + Math.round(Math.random() * pasos) * step;
  }
  return caso;
}

// Saca el JS del HTML (parte de confianza: solo lee y con regex, no ejecuta nada) y lo manda al hijo
// aislado, con los casos, por stdin. Sin --allow-fs-write, --allow-child-process ni --allow-worker: aunque el
// JS del ejercicio escape del `vm` de dentro (hay formas conocidas), el proceso entero sigue sin poder tocar
// el disco ni lanzar nada. La red no la corta el modelo de permisos de Node (no existe un --allow-net
// todavía): se acepta porque el hijo no tiene nada que leer ni filtrar — sin acceso al disco (solo puede leer
// su propio fichero) y sin variables de entorno (`env: {}`), no hay qué exfiltrar.
function ejecutarEnHijo(rutaHtml, casos, { tiempoMaximoMs = TIEMPO_MAXIMO_MS } = {}) {
  const html = fs.readFileSync(rutaHtml, 'utf8');
  const codigo = scriptsJs(html).map(s => s.codigo).join('\n');
  if (!codigo.trim()) throw new Error(`${path.basename(rutaHtml)} no tiene ningún <script> con JS que ejecutar.`);

  const r = spawnSync(process.execPath, [
    '--permission', `--allow-fs-read=${RUTA_EJECUTOR}`, RUTA_EJECUTOR,
  ], {
    input: JSON.stringify({ codigo, casos }),
    encoding: 'utf8',
    env: {},
    timeout: tiempoMaximoMs,
    killSignal: 'SIGKILL',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (r.error && r.error.code === 'ETIMEDOUT') {
    throw new Error(`${path.basename(rutaHtml)} no ha terminado en ${tiempoMaximoMs / 1000}s — probablemente un `
      + 'bucle infinito en su JS. Se ha cortado el proceso.');
  }
  if (r.error) throw r.error;

  let salida;
  try { salida = JSON.parse(r.stdout); } catch {
    throw new Error(`${path.basename(rutaHtml)} no ha podido ejecutarse: ${(r.stderr || r.stdout || 'sin salida').trim().slice(0, 500)}`);
  }
  if (salida.error) throw new Error(`${path.basename(rutaHtml)} ${salida.error}`);
  return salida.resultados;
}

function informe(resultados) {
  const lineas = [`${resultados.length} casos ejecutados.`];
  const fallos = resultados.filter(r => r.error);
  const degenerados = resultados.filter(r => !r.error && r.obtenido === undefined);
  if (fallos.length) {
    lineas.push(`${fallos.length} han lanzado una excepción:`);
    fallos.forEach(f => lineas.push(`  ${JSON.stringify(f.caso)} → ${f.error}`));
  }
  if (degenerados.length) {
    lineas.push(`${degenerados.length} sin resultado (verificar() ha devuelto undefined) — caso degenerado:`);
    degenerados.forEach(d => lineas.push(`  ${JSON.stringify(d.caso)}`));
  }
  const conEsperado = resultados.filter(r => !r.error && r.esperado !== undefined);
  const mal = conEsperado.filter(r => r.obtenido !== r.esperado);
  if (conEsperado.length) {
    lineas.push(`${conEsperado.length - mal.length}/${conEsperado.length} casos con "esperado" coinciden.`);
    mal.forEach(m => lineas.push(`  ${JSON.stringify(m.caso)} → esperado ${JSON.stringify(m.esperado)}, obtenido ${JSON.stringify(m.obtenido)}`));
  }
  if (resultados.length > conEsperado.length + fallos.length) {
    const distribucion = {};
    resultados.filter(r => !r.error && r.esperado === undefined)
      .forEach(r => { distribucion[r.obtenido] = (distribucion[r.obtenido] || 0) + 1; });
    lineas.push(`Distribución de las respuestas sin "esperado": ${Object.entries(distribucion).map(([k, n]) => `${k}: ${n}`).join(', ')}.`);
  }
  return { texto: lineas.join('\n'), ok: !fallos.length && !degenerados.length && !mal.length };
}

function cli(args, raiz) {
  const valor = marca => { const i = args.indexOf(marca); return i >= 0 ? args[i + 1] : undefined; };
  const fichero = args[0] && !args[0].startsWith('--') ? args[0] : undefined;
  const casosArg = valor('--casos');
  const barrerArg = valor('--barrer');
  const uso = 'Uso: node .kit/herramientas/verificar-ejercicio.js <ejercicio.html> --casos <casos.json>'
    + ' · node .kit/herramientas/verificar-ejercicio.js <ejercicio.html> --barrer <N>';
  if (!fichero || (!casosArg && !barrerArg)) { console.error(uso); return 2; }

  const rutaHtml = path.resolve(raiz, fichero);
  if (!fs.existsSync(rutaHtml)) { console.error(`No existe: ${fichero}`); return 2; }

  let casos;
  if (casosArg) {
    const rutaJson = path.resolve(raiz, casosArg);
    if (!fs.existsSync(rutaJson)) { console.error(`No existe: ${casosArg}`); return 2; }
    try { casos = JSON.parse(fs.readFileSync(rutaJson, 'utf8')); } catch (error) { console.error(`${casosArg} no es JSON válido: ${error.message}`); return 2; }
    if (!Array.isArray(casos) || !casos.length) { console.error(`${casosArg} tiene que ser un array de casos, con al menos uno.`); return 2; }
  } else {
    const n = Number(barrerArg);
    if (!Number.isInteger(n) || n < 1) { console.error('--barrer necesita un número entero mayor que 0.'); return 2; }
    const rangosDelHtml = rangos(rutaHtml);
    if (!rangosDelHtml.length) {
      console.error(`${fichero} no tiene ningún <input type="range">: escribe los casos a mano con --casos <casos.json>.`);
      return 2;
    }
    casos = Array.from({ length: n }, () => casoAlAzar(rangosDelHtml));
  }

  let resultados;
  try { resultados = ejecutarEnHijo(rutaHtml, casos); } catch (error) { console.error(error.message); return 1; }

  const resultado = informe(resultados);
  console.log(resultado.texto);
  return resultado.ok ? 0 : 1;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'verificar-ejercicio.js');

module.exports = { cli, ejecutarEnHijo, rangos, casoAlAzar, informe };
