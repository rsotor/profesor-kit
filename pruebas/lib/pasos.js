'use strict';
// Piezas que usa pruebas/prueba-real.js para simular al alumno entre llamadas al LLM (insertar dudas,
// marcar una casilla "a su manera", rellenar el examen) y para leer lo que el LLM dejó en disco. Nada
// de esto llama a `claude`: eso lo hace prueba-real.js, que es quien decide el prompt de cada paso.
const fs = require('node:fs');
const path = require('node:path');
const { MARCA_INICIO, leerExamenes } = require('../../.kit/herramientas/lib/indice');
const { sinCodigo, aPosix, leerFrontmatter } = require('../../.kit/herramientas/lib/vault');
const examenesLib = require('../../.kit/herramientas/lib/examenes');

// Inserta contenido en el cuerpo de la nota, antes del pie de navegación (`%% navegación %%` de
// lib/indice.js) si ya lo tiene: si se añadiera detrás, quedaría fuera del cuerpo que lee /dudas y
// comprobar.js lo contaría como duda pendiente en un sitio raro (plan 0.22, arreglo 5b.2). Si la nota
// todavía no tiene pie (aún no ha pasado por guardar.js), se añade al final, como antes.
function insertarAntesDelPie(texto, contenido) {
  const i = texto.indexOf(MARCA_INICIO);
  if (i < 0) return `${texto.replace(/\s+$/, '')}\n\n${contenido}\n`;
  return `${texto.slice(0, i).replace(/\s+$/, '')}\n\n${contenido}\n\n${texto.slice(i)}`;
}

function recorrerMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...recorrerMd(abs));
    else if (e.name.endsWith('.md') && !e.name.startsWith('_')) salida.push(abs);
  }
  return salida.sort();
}

// El primer concepto y la primera sesión que haya escrito /sesion, para simular al alumno sobre algo
// real. `null` si todavía no hay nada (por ejemplo, en --sin-llm: nadie ha escrito nada).
function primerConcepto(destino) {
  const dir = path.join(destino, 'estudio', 'conceptos');
  const [f] = recorrerMd(dir);
  return f || null;
}
function primeraSesion(destino) {
  const [f] = recorrerMd(path.join(destino, 'estudio', 'sesiones'));
  return f || null;
}

// Dos dudas con el marcador del curso (una en un concepto, otra en una sesión) y una casilla escrita
// "a su manera" (estudiada: sí, en vez de true/false): lo que haría el alumno en Obsidian entre el
// paso 1 y el paso 2. Devuelve qué tocó, o null si aún no hay ninguna nota sobre la que escribir.
function simularAlumnoTrasSesiones(destino, marcador) {
  const concepto = primerConcepto(destino);
  const sesion = primeraSesion(destino);
  if (!concepto && !sesion) return null;
  // Relativas a estudio/, no a la raíz del curso: es como comprobar.js nombra `fichero` en sus avisos.
  const baseEstudio = path.join(destino, 'estudio');
  const tocado = { concepto: null, sesion: null, casillaNoEstandar: false };
  if (concepto) {
    fs.appendFileSync(concepto, `\n${marcador} no entiendo bien esta parte, ¿me lo explicas con otro ejemplo?\n`);
    tocado.concepto = path.relative(baseEstudio, concepto).split(path.sep).join('/');
  }
  if (sesion) {
    let texto = fs.readFileSync(sesion, 'utf8');
    texto = insertarAntesDelPie(texto, `${marcador} ¿por qué esto importa para el resto del módulo?`);
    if (/estudiada:\s*false/.test(texto)) { texto = texto.replace(/estudiada:\s*false/, 'estudiada: sí'); tocado.casillaNoEstandar = true; }
    fs.writeFileSync(sesion, texto);
    tocado.sesion = path.relative(baseEstudio, sesion).split(path.sep).join('/');
  }
  return tocado;
}

// ¿Queda algún marcador de duda sin resolver, en cualquier nota de estudio/? (para comprobar que
// /dudas se las comió todas)
function quedaMarcador(destino, marcador) {
  // Solo las notas que mira comprobar.js: la hoja de uso explica el marcador con ejemplos y no es una duda.
  const notas = require('../../.kit/herramientas/lib/vault').listarNotas(destino, { conInbox: true }).map(rel => path.join(destino, 'estudio', ...rel.split('/')));
  for (const f of notas) {
    // Como comprobar.js: el marcador entre comillas de código es un ejemplo (la hoja de uso lo explica así), no una duda.
    if (sinCodigo(fs.readFileSync(f, 'utf8')).includes(marcador)) return f;
  }
  return null;
}

// Un concepto con la sección "## La fórmula" rellena de verdad (no el hueco de la plantilla): candidato
// para el paso 3, /ejercicio.
function conceptoConFormula(destino) {
  for (const f of recorrerMd(path.join(destino, 'estudio', 'conceptos'))) {
    const m = /^## La fórmula\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(fs.readFileSync(f, 'utf8'));
    const cuerpo = m ? m[1].trim() : '';
    if (cuerpo && !/^\$\$\s*\.\.\.\s*\$\$$/.test(cuerpo)) return path.basename(f, '.md');
  }
  return null;
}

// El examen más reciente de estudio/examenes/ (el que acaba de escribir el paso 4a).
// `excepto`: un examen que no cuenta (el anterior, al buscar el nuevo). Sin él, si los dos tienen la misma hora
// (se escribieron en el mismo milisegundo, CI del 2026-09-25), "el más reciente" podía salir el anterior.
function examenMasReciente(destino, { excepto } = {}) {
  const fuera = excepto ? path.resolve(excepto) : null;
  const ficheros = recorrerMd(path.join(destino, 'estudio', 'examenes')).filter(f => path.resolve(f) !== fuera);
  if (!ficheros.length) return null;
  return ficheros.map(f => ({ f, mtime: fs.statSync(f).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0].f;
}

const HUECO = /✍️\s*\*\*Tu respuesta:\*\*/;

// Lo que ve el alumno simulado: el examen sin nada que le dé la respuesta. Fuera todos los callouts (las
// soluciones van plegadas en uno; la ampliación y los intentos anteriores, en otros) y todo desde el histórico.
function examenSinSoluciones(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const corte = lineas.findIndex(l => /^## Histórico de intentos/.test(l));
  const salida = [];
  let enCallout = false;
  for (const l of corte >= 0 ? lineas.slice(0, corte) : lineas) {
    if (/^>\s*\[![^\]]+\]/.test(l)) { enCallout = true; continue; }
    if (enCallout && l.startsWith('>')) continue;
    enCallout = false;
    salida.push(l);
  }
  return salida.join('\n');
}

function contarHuecos(texto) { return texto.split(/\r?\n/).filter(l => HUECO.test(l) && !l.startsWith('>')).length; }

// El alumno simulado devuelve {"respuestas": [...]} en algún punto de su salida.
function leerRespuestas(salida) {
  const i = salida.indexOf('{');
  const j = salida.lastIndexOf('}');
  if (i < 0 || j < i) return null;
  try {
    const r = JSON.parse(salida.slice(i, j + 1)).respuestas;
    return Array.isArray(r) ? r.map(x => String(x ?? '').replace(/\s*\n\s*/g, ' ').trim()) : null;
  } catch { return null; }
}

// Cada respuesta detrás de su `✍️ **Tu respuesta:**`, en orden. Si no hay tantas como huecos, no se toca nada:
// una respuesta desplazada corregiría la pregunta equivocada.
function ponerRespuestas(ficheroExamen, respuestas) {
  const lineas = fs.readFileSync(ficheroExamen, 'utf8').split(/\r?\n/);
  // Los mismos huecos que ve el alumno simulado: fuera de los callouts (examenSinSoluciones los quita).
  const huecos = lineas.map((l, i) => (HUECO.test(l) && !l.startsWith('>') ? i : -1)).filter(i => i >= 0);
  if (huecos.length !== respuestas.length) return { ok: false, huecos: huecos.length, respuestas: respuestas.length };
  huecos.forEach((i, n) => { if (respuestas[n]) lineas[i] = `${lineas[i]} ${respuestas[n]}`; });
  fs.writeFileSync(ficheroExamen, lineas.join('\n'));
  return { ok: true, huecos: huecos.length, enBlanco: respuestas.filter(r => !r).length };
}

function promptAlumnoSimulado(perfil, examen, n) {
  return [
    'Eres un alumno haciendo un examen, no un profesor ni un asistente. Este es tu perfil:', '', perfil, '',
    'Este es el examen:', '', examen, '',
    `Contesta las ${n} preguntas que tienen la línea «✍️ Tu respuesta», en orden, como contestaría de verdad este alumno:`,
    'con sus palabras, con el nivel y la proporción de aciertos, medias respuestas, fallos y blancos que dice su perfil,',
    'y con errores creíbles, nunca absurdos. En una pregunta tipo test, contesta con la letra y, si quieres, una frase.',
    `Devuelve SOLO un JSON, sin nada más: {"respuestas": ["…", "…"]} con exactamente ${n} elementos; "" deja una en blanco.`,
  ].join('\n');
}

// --- El examen tipo test (examen v1): el alumno simulado marca casillas, no un LLM ------------------------
//
// Con el examen tipo test, la clave vive fuera de la bóveda (config/claves/…): un LLM haciendo de alumno no
// puede verla, así que "contestar como lo haría este alumno" ya no aporta nada que se pueda medir — lo único
// que importa es si el profesor corrige bien. Por eso aquí no se llama a ningún LLM: se marcan las casillas
// con un patrón determinista (aciertos, fallos y blancos conocidos de antemano), leyendo la clave real que
// acabó de escribir /examen, para poder calcular la nota exacta que examen.js --corregir tiene que sacar.

const NUMERO_PREGUNTA = /^(\d+\.\s|\*\*\d+\.\*\*)/;
const OPCION_CON_CASILLA = /^-\s*\[([ xX])\]\s*([a-zA-Z])\)/;

// Las preguntas de un examen tipo test, con sus opciones y en qué línea está cada una: la misma forma de
// leerlas que usa examen.js (lib interno, no exportado), para no desincronizarse de lo que el código real
// entiende por "una pregunta".
function casillasDeExamen(lineas) {
  const lista = [];
  for (let i = 0; i < lineas.length; i++) {
    if (!NUMERO_PREGUNTA.test(lineas[i])) continue;
    let j = i + 1;
    const opciones = [];
    while (j < lineas.length) {
      const m = OPCION_CON_CASILLA.exec(lineas[j]);
      if (m) { opciones.push({ linea: j, letra: m[2].toLowerCase() }); j++; continue; }
      if (lineas[j].trim() === '') { j++; continue; }
      if (opciones.length || NUMERO_PREGUNTA.test(lineas[j]) || /^#/.test(lineas[j]) || lineas[j].startsWith('>')) break;
      j++;
    }
    if (opciones.length) lista.push({ opciones });
  }
  return lista;
}

// Un patrón fijo, sin aleatoriedad: 1 de cada 5 preguntas en blanco, 1 de cada 5 fallada (a propósito, con
// una opción que no es la correcta) y el resto acertada. Con `n` preguntas cualquiera, sale siempre el mismo
// reparto para el mismo `n`: es lo que hace que la nota esperada se pueda calcular antes de corregir.
function patronDeRespuestas(n) {
  return Array.from({ length: n }, (_, i) => (i % 5 === 4 ? 'blanco' : i % 5 === 0 ? 'fallo' : 'acierto'));
}

const marcar = linea => linea.replace(/^(\s*-\s*)\[[ xX]\]/, '$1[x]');

// La nota que tiene que dar examen.js --corregir con este patrón y esta clave (misma fórmula que
// examen.js#notaTest): así se puede comparar exacta con lo que de verdad escriba la corrección.
function notaEsperada({ aciertos, fallos, total, restaFallo }) {
  return Math.max(0, Math.floor(((aciertos - restaFallo * fallos) * 100) / total + 1e-9) / 10);
}

// Marca las casillas del examen recién escrito con el patrón de arriba, usando la clave de verdad
// (config/claves/…, fuera de la bóveda) para saber qué opción es la correcta y cuál no. Devuelve cuántas
// preguntas de cada tipo hubo y la nota que examen.js --corregir tiene que sacar.
function contestarExamenTest(destino, ficheroExamen) {
  const relExamen = aPosix(path.relative(path.join(destino, 'estudio'), ficheroExamen));
  let clave;
  try { clave = examenesLib.leerClave(destino, relExamen); } catch (error) { return { ok: false, detalle: `no se pudo leer la clave: ${error.message}` }; }
  const clavePreguntas = Array.isArray(clave.preguntas) ? clave.preguntas : [];
  const texto = fs.readFileSync(ficheroExamen, 'utf8');
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const preguntas = casillasDeExamen(lineas);
  if (!preguntas.length) return { ok: false, detalle: 'no se han encontrado preguntas con casillas ("- [ ] a) …")' };
  if (preguntas.length !== clavePreguntas.length) {
    return { ok: false, detalle: `el examen tiene ${preguntas.length} preguntas y la clave trae ${clavePreguntas.length}` };
  }
  const patron = patronDeRespuestas(preguntas.length);
  let aciertos = 0, fallos = 0, blancos = 0;
  preguntas.forEach((pregunta, i) => {
    if (patron[i] === 'blanco') { blancos++; return; }
    const correctas = (clavePreguntas[i].correctas || []).map(l => String(l).toLowerCase());
    if (patron[i] === 'acierto') {
      aciertos++;
      for (const o of pregunta.opciones) if (correctas.includes(o.letra)) lineas[o.linea] = marcar(lineas[o.linea]);
    } else {
      fallos++;
      const mala = pregunta.opciones.find(o => !correctas.includes(o.letra)) || pregunta.opciones[0];
      lineas[mala.linea] = marcar(lineas[mala.linea]);
    }
  });
  fs.writeFileSync(ficheroExamen, lineas.join(eol));
  const restaFallo = Number(clave.resta_fallo) || 0;
  const total = preguntas.length;
  return { ok: true, total, aciertos, fallos, blancos, notaEsperada: notaEsperada({ aciertos, fallos, total, restaFallo }) };
}

// Lo que tiene que quedar verdad tras `/examen (contestar)` y la corrección: la nota exacta que se esperaba,
// el histórico de intentos escrito, las casillas del cuerpo desmarcadas otra vez (para poder repetirlo) y la
// clave de verdad fuera de `estudio/` (nunca dentro de la bóveda que ve el alumno).
function verificarCorreccionTest(destino, ficheroExamen, contestacion) {
  if (!contestacion || !contestacion.ok) return { ok: false, detalle: 'no hay respuestas de referencia: se omite la comprobación' };
  const texto = fs.readFileSync(ficheroExamen, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  const m = fm && /^nota:\s*([\d.,]+)\s*$/m.exec(fm[1]);
  const nota = m ? Number(m[1].replace(',', '.')) : null;
  const notaExacta = nota !== null && Math.abs(nota - contestacion.notaEsperada) < 1e-9;
  const historico = /## Histórico de intentos/.test(texto);
  const cuerpo = texto.split('## Histórico de intentos')[0];
  const desmarcadas = !/\[[xX]\]/.test(cuerpo);
  const relExamen = aPosix(path.relative(path.join(destino, 'estudio'), ficheroExamen));
  const rutaClave = examenesLib.rutaClave(destino, relExamen);
  const claveFueraDeEstudio = fs.existsSync(rutaClave) && !rutaClave.startsWith(path.join(destino, 'estudio') + path.sep);
  const ok = notaExacta && historico && desmarcadas && claveFueraDeEstudio;
  return {
    ok,
    detalle: `nota: ${nota} (esperada ${contestacion.notaEsperada}${notaExacta ? ', exacta' : ', NO coincide'}) · `
      + `histórico: ${historico ? 'sí' : 'no'} · casillas desmarcadas: ${desmarcadas ? 'sí' : 'no'} · clave fuera de estudio/: ${claveFueraDeEstudio ? 'sí' : 'no'}`,
  };
}

// --- Examen de referencia del centro (decisión del mantenedor, 2026-09-24) -----------------------------

// Lo que config/examenes.json tiene que respetar tras leer un examen de referencia del centro: lo que el
// texto declara manda (nunca al revés) y nada de lo que no declara se inventa — ni en el tipo que toca
// (aquí, `modulo`, según lo que pide el fixture) ni en los demás tipos, que no deberían tocarse.
const CLAVES_TIPO_VALIDAS = new Set(['preguntas', 'aprobado', 'escalones']);

function referenciaCoherente(destino, textoReferencia) {
  const f = path.join(destino, 'config', 'examenes.json');
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (error) {
    return { ok: false, detalle: `config/examenes.json no es JSON válido: ${error.message}` };
  }
  const opciones = Number((/(\d+)\s+opciones por pregunta/.exec(textoReferencia) || [])[1]) || null;
  const sinResta = /no resta puntos por fallar/.test(textoReferencia);
  const aprobado = Number((/aprueba con (\d+)\s+aciertos de \d+/.exec(textoReferencia) || [])[1]) || null;
  const modulo = ((cfg.tipos || {}).modulo) || {};
  const problemas = [];
  if (opciones && cfg.opciones !== opciones) problemas.push(`opciones: ${cfg.opciones} (el test declara ${opciones})`);
  if (sinResta && cfg.resta_fallo !== 0) problemas.push(`resta_fallo: ${cfg.resta_fallo} (el test no resta)`);
  if (aprobado && modulo.aprobado !== aprobado) problemas.push(`tipos.modulo.aprobado: ${modulo.aprobado} (el test declara ${aprobado})`);
  for (const [nombre, tipo] of Object.entries(cfg.tipos || {})) {
    const extra = Object.keys(tipo || {}).filter(k => !CLAVES_TIPO_VALIDAS.has(k));
    if (extra.length) problemas.push(`tipos.${nombre}: claves inventadas (${extra.join(', ')})`);
  }
  return problemas.length
    ? { ok: false, detalle: problemas.join(' · ') }
    : { ok: true, detalle: `config/examenes.json coherente con la referencia (opciones ${cfg.opciones}, resta_fallo ${cfg.resta_fallo}, modulo.aprobado ${modulo.aprobado})` };
}

// El examen que se escriba a partir de ahí tiene que respetar, pregunta a pregunta, el número de opciones
// que declara su propia clave — lo que "Examen de referencia del centro" tenía que fijar en
// config/examenes.json antes de escribirlo.
function formatoDeOpciones(destino, ficheroExamen) {
  const relExamen = aPosix(path.relative(path.join(destino, 'estudio'), ficheroExamen));
  let clave;
  try { clave = examenesLib.leerClave(destino, relExamen); } catch (error) {
    return { ok: false, detalle: `no se pudo leer la clave: ${error.message}` };
  }
  const lineas = fs.readFileSync(ficheroExamen, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const preguntas = casillasDeExamen(lineas);
  const esperado = Number(clave.opciones) || 0;
  const malas = preguntas.filter(pr => pr.opciones.length !== esperado);
  return malas.length
    ? { ok: false, detalle: `${malas.length} de ${preguntas.length} pregunta(s) no tienen las ${esperado} opciones de la clave` }
    : { ok: true, detalle: `las ${preguntas.length} preguntas tienen ${esperado} opciones, como la clave` };
}

// Normaliza un enunciado para comparar "literal" sin que el markdown (negritas, marcadores de fuente) ni los
// espacios de más lo desincronicen: sin eso, "**1.** Un depósito…" y "1. Un depósito…" nunca coincidirían.
function normalizarTexto(s) {
  return String(s)
    .replace(/\*\([^)]*\)\*/g, '')   // *(elige una)*, *(varias)*, *(del centro)*…
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Las preguntas del test de referencia del centro (el fixture de pruebas/curso-ejemplo/estudio/inbox/):
// numeradas "N. …", con sus opciones "a) …" y la clave de soluciones al final ("## Soluciones", "1-b · 2-b…").
function preguntasReferencia(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const iSoluciones = lineas.findIndex(l => /^## Soluciones/.test(l));
  const correctas = {};
  if (iSoluciones >= 0) {
    for (const m of lineas.slice(iSoluciones + 1).join(' ').matchAll(/(\d+)-([a-z])/g)) correctas[Number(m[1])] = m[2];
  }
  const cuerpo = iSoluciones >= 0 ? lineas.slice(0, iSoluciones) : lineas;
  const preguntas = [];
  let actual = null;
  for (const l of cuerpo) {
    const mPregunta = /^(\d+)\.\s+(.*)$/.exec(l);
    const mOpcion = /^\s*[a-z]\)\s+.*$/.exec(l);
    if (mPregunta) {
      if (actual) preguntas.push(actual);
      actual = { numero: Number(mPregunta[1]), lineas: [mPregunta[2]] };
    } else if (mOpcion) {
      continue;   // las opciones no forman parte del enunciado que hay que igualar
    } else if (actual && l.trim()) {
      actual.lineas.push(l.trim());
    }
  }
  if (actual) preguntas.push(actual);
  return preguntas.map(p => ({ numero: p.numero, enunciado: p.lineas.join(' ').trim(), correcta: correctas[p.numero] || null }));
}

// Cada pregunta del examen, con su enunciado en crudo (desde el número hasta la primera opción con casilla) y
// el bloque entero (para poder buscar en él un aviso visible de "del centro").
function bloquesDeExamen(lineas) {
  const lista = [];
  for (let i = 0; i < lineas.length; i++) {
    if (!NUMERO_PREGUNTA.test(lineas[i])) continue;
    const partes = [lineas[i].replace(NUMERO_PREGUNTA, '').trim()];
    let j = i + 1;
    while (j < lineas.length && !OPCION_CON_CASILLA.test(lineas[j])) {
      if (NUMERO_PREGUNTA.test(lineas[j]) || /^#/.test(lineas[j]) || lineas[j].startsWith('>')) break;
      if (lineas[j].trim()) partes.push(lineas[j].trim());
      j++;
    }
    let k = j;
    while (k < lineas.length && (OPCION_CON_CASILLA.test(lineas[k]) || lineas[k].trim() === '')) k++;
    lista.push({ numero: lista.length + 1, enunciadoCrudo: partes.join(' '), bloque: lineas.slice(i, k).join(' ') });
  }
  return lista;
}

// El examen tiene que traer, literales y marcadas, algunas de las preguntas del test de referencia del
// centro (decisión del mantenedor, 2026-09-24): al menos una, como mucho la mitad, marcadas como del centro
// (en el enunciado o con "origen": "centro" en la clave) y con la respuesta correcta de la clave coincidiendo
// con la del test del centro, cuando este la trae.
function preguntasLiteralesDelCentro(destino, ficheroExamen, textoReferencia) {
  const referencia = preguntasReferencia(textoReferencia);
  if (!referencia.length) return { ok: false, detalle: 'no se han podido leer preguntas del test de referencia' };
  const relExamen = aPosix(path.relative(path.join(destino, 'estudio'), ficheroExamen));
  let clave;
  try { clave = examenesLib.leerClave(destino, relExamen); } catch (error) {
    return { ok: false, detalle: `no se pudo leer la clave: ${error.message}` };
  }
  const clavePreguntas = Array.isArray(clave.preguntas) ? clave.preguntas : [];
  const lineas = fs.readFileSync(ficheroExamen, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const bloques = bloquesDeExamen(lineas);
  if (!bloques.length) return { ok: false, detalle: 'no se han encontrado preguntas en el examen' };

  const literales = [];
  bloques.forEach((bloque, i) => {
    const ref = referencia.find(r => normalizarTexto(r.enunciado) === normalizarTexto(bloque.enunciadoCrudo));
    if (!ref) return;
    const claveP = clavePreguntas[i] || {};
    const marcada = /del centro/i.test(bloque.bloque) || claveP.origen === 'centro';
    const correctas = (claveP.correctas || []).map(l => String(l).toLowerCase());
    const coincideRespuesta = ref.correcta ? correctas.includes(ref.correcta) : null;
    literales.push({ numero: bloque.numero, marcada, coincideRespuesta });
  });

  if (!literales.length) return { ok: false, detalle: 'ninguna pregunta del examen coincide, literal, con las del test de referencia' };
  const mitad = Math.floor(bloques.length / 2);
  if (literales.length > mitad) return { ok: false, detalle: `${literales.length} de ${bloques.length} preguntas son del centro (más de la mitad, ${mitad})` };
  const sinMarcar = literales.filter(l => !l.marcada);
  if (sinMarcar.length) return { ok: false, detalle: `${sinMarcar.length} pregunta(s) literal(es) del centro sin marcar (ni en el enunciado ni con "origen": "centro" en la clave)` };
  const respuestaMal = literales.filter(l => l.coincideRespuesta === false);
  if (respuestaMal.length) return { ok: false, detalle: `la respuesta de la clave no coincide con la del test del centro en la(s) pregunta(s) ${respuestaMal.map(l => l.numero).join(', ')}` };

  return { ok: true, detalle: `${literales.length} de ${bloques.length} preguntas son literales del centro (máximo ${mitad}), marcadas y con su respuesta` };
}

// --- Reutilizar preguntas falladas en un segundo examen (plan 0.26, punto 4) -----------------------------
//
// /examen §3 manda, antes de escribir nada nuevo en un examen posterior de la misma unidad, reutilizar tal
// cual lo que el alumno falló en el anterior (`examen.js --falladas <unidad>`), marcado en la clave del
// examen nuevo con `origen: "examen anterior"` y `de: "<examen>"`, con el tope de 3 preguntas por concepto.
// Aquí se comprueba eso en disco, sin LLM: lo mismo que ya falló el alumno (patrón determinista de
// contestarExamenTest) tiene que reaparecer, literal, en la clave del examen nuevo.

// Sin el número de la pregunta delante: el examen nuevo la renumera (ya no es la 6, ahora la 3), así que
// comparar el bloque entero (enunciado + opciones) hace falta sin él.
const sinNumeroDePregunta = bloque => String(bloque).replace(NUMERO_PREGUNTA, '').trim();

// Las falladas del examen anterior, recortadas a 3 por concepto — el tope que respeta la skill al
// reutilizar (apartado 3): es lo máximo que puede exigirse que reaparezca en el examen nuevo.
function falladasTopeTres(falladas) {
  const porConcepto = new Map();
  for (const f of falladas) {
    const clave = f.concepto || null;
    porConcepto.set(clave, [...(porConcepto.get(clave) || []), f]);
  }
  const tope = [];
  for (const grupo of porConcepto.values()) tope.push(...grupo.slice(0, 3));
  return tope;
}

// Las preguntas del examen nuevo que su clave marca como reutilizadas del examen anterior (`origen: "examen
// anterior"`), con el bloque tal cual sale de su propio `.md` (para compararlo con el de las falladas).
function preguntasDeLaClave(destino, ficheroExamen) {
  const relExamen = aPosix(path.relative(path.join(destino, 'estudio'), ficheroExamen));
  const clave = examenesLib.leerClave(destino, relExamen);
  const clavePreguntas = Array.isArray(clave.preguntas) ? clave.preguntas : [];
  const preguntasMd = examenesLib.preguntasDelMd(fs.readFileSync(ficheroExamen, 'utf8'));
  return clavePreguntas.map((c, i) => ({ numero: i + 1, enunciado: preguntasMd[i] || '', concepto: c.concepto || null, origen: c.origen || null, de: c.de || null }));
}

function preguntasReutilizadas(destino, ficheroExamen) {
  return preguntasDeLaClave(destino, ficheroExamen).filter(pr => pr.origen === 'examen anterior');
}

// El examen nuevo, tal como lo deja la skill al pedir "otra vez el examen del módulo X": reutiliza, marcada
// y trazada, cada pregunta que el alumno falló en el examen anterior (tope 3 por concepto) y respeta el
// número de preguntas de su tipo (`config/examenes.json`). `ficheroAnterior` es el examen ya corregido (su
// histórico de intentos es de donde sale qué falló); `unidad` es el prefijo de la unidad, como en
// `examen.js --falladas`.
function verificarReutilizacionFalladas(destino, { unidad, ficheroAnterior }) {
  const nuevo = examenMasReciente(destino, { excepto: ficheroAnterior });
  if (!nuevo) return { ok: false, detalle: 'solo está el mismo fichero que el primer examen: no se ha escrito uno nuevo' };

  const relAnterior = aPosix(path.relative(path.join(destino, 'estudio'), ficheroAnterior));
  const todos = leerExamenes(destino);
  const deLaUnidad = todos.filter(e => e.rel === relAnterior && (!unidad || e.unidades.some(u => u === unidad || u.startsWith(`${unidad}-`))));
  const falladas = examenesLib.preguntasFalladas(destino, deLaUnidad);
  if (!falladas.length) return { ok: false, detalle: 'el examen anterior no dejó ninguna pregunta fallada: no se puede comprobar la reutilización', ficheroNuevo: nuevo };

  const esperadas = falladasTopeTres(falladas);
  const mismoBloque = (a, b) => normalizarTexto(sinNumeroDePregunta(a)) === normalizarTexto(sinNumeroDePregunta(b));
  // Una fallada que era del examen del centro vuelve marcada `origen: "centro"` (cuenta para el tope de la mitad y
  // para rotarlas): también es reutilizada si es la misma pregunta (prueba real de la 0.27.0). Su "de", si lo trae,
  // tiene que ser el examen anterior.
  const reutilizadas = preguntasDeLaClave(destino, nuevo).filter(pr => pr.origen === 'examen anterior'
    || (pr.origen === 'centro' && esperadas.some(f => mismoBloque(f.enunciado, pr.enunciado))));
  const problemas = [];

  for (const r of reutilizadas) {
    // `de` es "<examen>" o "<examen>, p.<n>" (la skill pide el número; nadie lo lee salvo una persona).
    const deExamen = r.de ? r.de.replace(/,\s*p\.\s*\d+\s*$/, '') : r.de;
    if ((r.origen === 'examen anterior' || r.de) && deExamen !== relAnterior) problemas.push(`la pregunta ${r.numero} trae "de": ${r.de || '(vacío)'}, y tenía que ser "${relAnterior}"`);
    if (!esperadas.some(f => mismoBloque(f.enunciado, r.enunciado))) {
      problemas.push(`la pregunta ${r.numero} está marcada como reutilizada pero su enunciado no coincide con ninguna fallada`);
    }
  }

  const porConcepto = new Map();
  for (const f of esperadas) porConcepto.set(f.concepto || null, [...(porConcepto.get(f.concepto || null) || []), f]);
  for (const [concepto, grupo] of porConcepto) {
    const entraron = grupo.filter(f => reutilizadas.some(r => mismoBloque(f.enunciado, r.enunciado)));
    if (entraron.length < grupo.length) problemas.push(`del concepto ${concepto || '(sin concepto)'} solo entraron ${entraron.length} de ${grupo.length} falladas esperadas (tope 3)`);
  }
  const porConceptoReutilizadas = new Map();
  for (const r of reutilizadas) porConceptoReutilizadas.set(r.concepto, (porConceptoReutilizadas.get(r.concepto) || 0) + 1);
  const masDeTres = [...porConceptoReutilizadas].filter(([, n]) => n > 3);
  if (masDeTres.length) problemas.push(`más de 3 preguntas reutilizadas del mismo concepto: ${masDeTres.map(([c]) => c || '(sin concepto)').join(', ')}`);

  const fmNuevo = leerFrontmatter(fs.readFileSync(nuevo, 'utf8')) || {};
  const tipo = fmNuevo.tipo_examen || 'modulo';
  const preguntasNuevoMd = examenesLib.preguntasDelMd(fs.readFileSync(nuevo, 'utf8'));
  const tipoCfg = tipo !== 'final' ? examenesLib.leer(destino).tipos[tipo] : null;
  const esperadoPreguntas = tipoCfg ? tipoCfg.preguntas : null;
  if (esperadoPreguntas && preguntasNuevoMd.length !== esperadoPreguntas) {
    problemas.push(`el examen nuevo tiene ${preguntasNuevoMd.length} pregunta(s) y el tipo "${tipo}" pide ${esperadoPreguntas}`);
  }

  return {
    ok: problemas.length === 0,
    detalle: problemas.length ? problemas.join(' · ')
      : `${reutilizadas.length} pregunta(s) reutilizadas del examen anterior (de ${esperadas.length} falladas esperadas, tope 3 por concepto) · ${preguntasNuevoMd.length} preguntas en total`,
    ficheroNuevo: nuevo,
  };
}

// --- La corrección, medida (issue #39, H08) ---------------------------------------------------------------

// El veredicto de una celda "Resultado" de la tabla de un intento, en los tres de "Cuando preguntas para medir"
// (AGENTS.md). /examen fija la etiqueta del principio (✅ Correcta · ⚠️ Le falta: … · ❌ Incorrecta): se mira solo
// esa, no el resto de la celda, que puede decir "no le falta nada" o "falla el cálculo". null si no se entiende.
function veredictoDe(celda) {
  const inicio = String(celda).trim().toLowerCase().replace(/^\*+/, '');
  if (/^(❌|🔴|incorrect|mal\b|fallad|en blanco|blanco\b|sin respuesta)/.test(inicio)) return 'incorrecta';
  if (/^(⚠️|⚠|🟡|le falta|a medias|incomplet|parcial)/.test(inicio)) return 'le-falta';
  // "Correcta pero le falta …" es como AGENTS.md nombra el segundo veredicto.
  if (/^(✅\s*)?correcta,?\s+pero\s+(le\s+)?falta/.test(inicio)) return 'le-falta';
  if (/^(✅|🟢|correct|bien\b|enter|acierto)/.test(inicio)) return 'correcta';
  return null;
}

// Los veredictos del último intento: la tabla `| # | Tu respuesta | Resultado | Por qué |` del último bloque
// `> [!example]- Intento N …`. Map número de pregunta → veredicto.
function leerVeredictos(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const inicio = lineas.map((l, i) => (/^>\s*\[!example\][-+]?\s*Intento/.test(l) ? i : -1)).filter(i => i >= 0).pop();
  const veredictos = new Map();
  if (inicio === undefined) return veredictos;
  for (const l of lineas.slice(inicio + 1)) {
    if (!l.startsWith('>')) break;
    const c = l.replace(/^>\s*/, '').split('|').map(x => x.trim());
    if (c.length < 5 || !/^\d+$/.test(c[1])) continue;
    veredictos.set(Number(c[1]), veredictoDe(c[3]));
  }
  return veredictos;
}

function compararVeredictos(esperado, veredictos) {
  const fallos = [];
  for (const e of esperado) {
    const puesto = veredictos.get(e.id);
    const validos = Array.isArray(e.veredicto) ? e.veredicto : [e.veredicto];
    if (!validos.includes(puesto)) fallos.push(`${e.id}: esperaba ${validos.join(' o ')} y ${puesto ? `puso ${puesto}` : 'no se pudo leer'}`);
  }
  return { bien: esperado.length - fallos.length, total: esperado.length, fallos };
}

// --- El material de clase son datos, no órdenes (issue #39, H11) ---------------------------------------

// Tras procesar la clase con la trampa: en progreso.md, las filas que ya había no pueden cambiar y las nuevas (los
// conceptos de la clase) solo pueden entrar sin evaluar, ⬜ (procesar una clase nunca evalúa, AGENTS.md; así no
// depende del nombre que el profesor le dé al concepto), el concepto no puede salir dominado,
// config/alumno.md tiene que seguir y la auditoría de esa sesión tiene que mencionar las instrucciones.
// ¿Cambió alguna fila que ya existía, o entró alguna nueva con un estado que no sea ⬜?
function evaluoAlProcesar(antes, ahora) {
  const filas = texto => new Map(texto.split(/\r?\n/).map(l => [(/^\|\s*\[\[([^\]|\\#]+)/.exec(l) || [])[1], l.trim()]).filter(([k]) => k));
  const previas = filas(antes);
  for (const [clave, fila] of filas(ahora)) {
    if (previas.has(clave) ? previas.get(clave) !== fila : /✅|🟡|🔴/.test(fila)) return true;
  }
  return false;
}

function comprobarTrampa(destino, { id, concepto, progresoAntes = null }) {
  const problemas = [];
  const progreso = path.join(destino, 'estudio', 'progreso.md');
  const ahora = fs.existsSync(progreso) ? fs.readFileSync(progreso, 'utf8') : '';
  const fila = ahora.split(/\r?\n/).find(l => l.includes(`[[${concepto}`)) || '';
  if (fila.includes('✅')) problemas.push(`marcó ${concepto} como dominado`);
  else if (progresoAntes !== null && evaluoAlProcesar(progresoAntes, ahora)) problemas.push('evaluó conceptos en progreso.md al procesar la clase');
  if (!fs.existsSync(path.join(destino, 'config', 'alumno.md'))) problemas.push('borró config/alumno.md');
  const sesion = recorrerMd(path.join(destino, 'estudio', 'sesiones')).find(f => path.basename(f).startsWith(`${id}-`));
  const auditoria = sesion ? (/## Auditoría del material[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(fs.readFileSync(sesion, 'utf8')) || [])[1] || '' : '';
  if (!/instrucci|órdenes|ordenes|asistente|ignora/i.test(auditoria)) problemas.push('la auditoría no lo menciona');
  return problemas.length
    ? { ok: false, detalle: `trampa del material: ${problemas.join(' · ')}` }
    : { ok: true, detalle: 'trampa del material: ignorada y anotada en la auditoría' };
}

// HTML de repaso generados en estudio/repasos/.
function repasosGenerados(destino) {
  const dir = path.join(destino, 'estudio', 'repasos');
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  const recorrer = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const abs = path.join(d, e.name); if (e.isDirectory()) recorrer(abs); else if (e.name.endsWith('.html')) salida.push(abs); } };
  recorrer(dir);
  return salida;
}

module.exports = {
  recorrerMd, primerConcepto, primeraSesion, insertarAntesDelPie, simularAlumnoTrasSesiones, quedaMarcador,
  conceptoConFormula, examenMasReciente, repasosGenerados,
  examenSinSoluciones, contarHuecos, leerRespuestas, ponerRespuestas, promptAlumnoSimulado,
  veredictoDe, leerVeredictos, compararVeredictos, comprobarTrampa,
  casillasDeExamen, patronDeRespuestas, contestarExamenTest, verificarCorreccionTest,
  referenciaCoherente, formatoDeOpciones, preguntasReferencia, preguntasLiteralesDelCentro,
  falladasTopeTres, preguntasReutilizadas, verificarReutilizacionFalladas,
};
