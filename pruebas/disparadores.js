'use strict';
// Qué skill elige el profesor ante cada frase de alumno (pruebas/disparadores.json), con el asistente de verdad y
// el curso de ejemplo montado entero: todas las skills y AGENTS.md compitiendo, como en el ordenador del alumno.
// No sirve medir cada skill a solas (lo que hace run_eval.py de skill-creator): lo que falla es el cruce entre
// skills y con lo que AGENTS.md deja para la conversación ("¿repasamos?", "hazme unas preguntas").
//
//   npm run disparadores                        # todas las frases, con el modelo recomendado del adaptador
//   npm run disparadores -- --solo 3            # las 3 primeras (para probar el lanzador sin gastar)
//   npm run disparadores -- --modelo haiku
//   npm run disparadores -- --frase "¿qué es la liquidez?" --veces 3   # repetir una que falló (no escribe el resultado)
//   npm run disparadores -- --solo-guias        # solo los "casos de guía" (ver abajo), sin las frases de skills
//   npm run disparadores -- --asistente codex   # con el adaptador de otro asistente (issue #45)
//   npm run disparadores -- --volcar /tmp/volcado   # guarda el stream crudo de cada ejecución
//
// Cada frase corre sin permisos para escribir (se deniegan sin preguntar) y se corta en cuanto elige: la primera
// skill que usa, o ninguna si contesta sin skill o pasa LIMITE_HERRAMIENTAS herramientas sin usar una. Con Claude
// Code, resultado en pruebas/disparadores-claude-code.md; con otro asistente, pruebas/disparadores-<id>.md. Nunca
// en el CI.
//
// "casos_guia" de disparadores.json mide otra cosa (plan 0.26.0, tarea 1.3): situación → el profesor debe abrir
// tal guía de .kit/guias/. Cada caso trae `preparar` (un nombre de pruebas/lib/casos-guia.js que deja el curso
// montado en ese estado: una propiedad "a su manera", una preparación en segundo plano terminada o interrumpida)
// y `guia` (el fichero esperado). Se corta en cuanto el asistente la lee (un `Read`, o un `Bash` que la cite) o
// tras LIMITE_HERRAMIENTAS_GUIA herramientas sin leerla.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { borrar, montarCurso, carpetaTemporal, copiar } = require('./lib/montaje');
const { modeloRecomendado, adaptadorDelCurso } = require('./prueba-real');
const { lanzadorPara, claudeCode } = require('./lib/asistentes');
const casosGuia = require('./lib/casos-guia');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const FRASES = path.join(__dirname, 'disparadores.json');
// El de Claude no cambia de nombre (lo leen los mismos sitios de siempre); los demás asistentes, uno por id.
const rutaResultado = id => path.join(__dirname, `disparadores-${id || 'claude-code'}.md`);
// AGENTS.md manda leer config/, el diario y estado.js antes: "¿qué es la liquidez?" llega a /dudas en la 5.ª o 6.ª
// herramienta (2026-09-24). Con 6 se cortaba antes y salía un fallo que no era.
const LIMITE_HERRAMIENTAS = 12;
// Un caso de guía tarda más en decidirse que una skill (no hay un tool_use "Skill" que lo corte antes):
// hasta que no comprueba el curso y sigue la situación, no llega a abrir la guía. Provisional: a ajustar
// con lo que diga la primera medición real.
const LIMITE_HERRAMIENTAS_GUIA = 25;
const LIMITE_MS = 3 * 60 * 1000;
const EN_PARALELO = 4;

// Cuenta un evento de herramienta/skill una sola vez: en Codex, `item.started` e `item.completed` traen el
// mismo `item.id` para la misma llamada (issue #45). Sin id (Claude Code, o un evento sintético de test sin
// id), nunca se descarta: cada línea cuenta, como siempre.
function contarUnaVez(vistos, ev) {
  if (ev.id === undefined) return true;
  if (vistos.has(ev.id)) return false;
  vistos.add(ev.id);
  return true;
}

// Las líneas de stream del asistente → { decidido, skill }. Puro, para poder probarlo. `lanzador` normaliza
// cada línea en eventos (pruebas/lib/asistentes/): por defecto, Claude Code, para no romper nada de lo que ya
// medía esta función.
// El asistente falló (límite de uso, error de la API…): no ha elegido nada, así que esa frase no cuenta ni como
// acierto ni como fallo. Medición del 2026-09-25: un límite de uso a mitad dejó 19 frases como "ninguna".
function sinMedir(ev) {
  return { sinMedir: true, nota: `el asistente falló: ${String(ev.error || '').slice(0, 120)}` };
}

// Si el asistente falló en alguna (límite de uso…), la medición no vale: se dice y no se escribe el resultado,
// para no dejar en el repo una tabla con fallos que no lo son.
function quedoSinMedir(resultados) {
  const sin = resultados.filter(r => r && r.sinMedir);
  if (!sin.length) return false;
  console.error(`\n⚠️  ${sin.length} sin medir: ${sin[0].nota}. No se escribe el resultado; repítelo cuando se pueda.`);
  process.exitCode = 1;
  return true;
}

function decidirEleccion(lineas, lanzador = claudeCode) {
  const vistos = new Set();
  let herramientas = 0;
  for (const linea of lineas) {
    for (const ev of lanzador.eventos(linea)) {
      if (ev.tipo === 'fin') return ev.ok === false ? { decidido: true, skill: null, ...sinMedir(ev) } : { decidido: true, skill: null };
      if (ev.tipo === 'skill') return { decidido: true, skill: ev.skill };
      if (ev.tipo !== 'herramienta' || !contarUnaVez(vistos, ev)) continue;
      if (++herramientas >= LIMITE_HERRAMIENTAS) return { decidido: true, skill: null, nota: `${LIMITE_HERRAMIENTAS} herramientas sin skill` };
    }
  }
  return { decidido: false };
}

// ¿Es este evento de herramienta un Read (o un Bash que la cite) de la guía `guia`? "O equivalente" (la tarea):
// cualquier otro nombre de herramienta que traiga una ruta o un comando con la guía también cuenta.
function abreLaGuia(ev, guia) {
  if (ev.tipo !== 'herramienta') return false;
  const entrada = ev.entrada || {};
  const objetivo = `guias/${guia}`;
  if (typeof entrada.file_path === 'string' && entrada.file_path.replace(/\\/g, '/').includes(objetivo)) return true;
  if (typeof entrada.path === 'string' && entrada.path.replace(/\\/g, '/').includes(objetivo)) return true;
  return typeof entrada.command === 'string' && entrada.command.includes(objetivo);
}

// Las líneas de stream de un "caso de guía" → { decidido, abierta }. Puro, igual que decidirEleccion, pero sin
// cortar en la primera herramienta que no sea la guía (aquí no hay un evento "skill" que decida solo: el
// profesor puede leer config/, estado.js, comprobar.js... antes de llegar a la guía).
function abrioGuia(lineas, guia, lanzador = claudeCode) {
  const vistos = new Set();
  let herramientas = 0;
  for (const linea of lineas) {
    for (const ev of lanzador.eventos(linea)) {
      if (ev.tipo === 'fin') return { decidido: true, abierta: false, ...(ev.ok === false ? sinMedir(ev) : { nota: 'terminó sin abrir la guía' }) };
      if (ev.tipo !== 'herramienta' && ev.tipo !== 'skill') continue;
      if (!contarUnaVez(vistos, ev)) continue;
      if (abreLaGuia(ev, guia)) return { decidido: true, abierta: true };
      if (++herramientas >= LIMITE_HERRAMIENTAS_GUIA) return { decidido: true, abierta: false, nota: `${LIMITE_HERRAMIENTAS_GUIA} herramientas sin abrir la guía` };
    }
  }
  return { decidido: false };
}

function acierta(elegida, esperada) {
  return [].concat(esperada).includes(elegida);
}

const nombre = s => (s === null ? 'ninguna' : s);

// La tabla de los casos de guía, aparte de la de frases → skill: son dos medidas distintas (plan 0.26.0, 1.3).
// `meta` (fecha, modelo) solo se pasa desde --solo-guias cuando sustituye la sección dentro de un resultado
// más viejo (reemplazarGuias): sin eso, la tabla de frases de arriba puede ser de otro día y con otro modelo,
// y sin decirlo esta sección parecería medida a la vez que ella.
function markdownGuias(resultadosGuia, { fecha, modelo } = {}) {
  if (!resultadosGuia.length) return [];
  const buenas = resultadosGuia.filter(r => r.abierta).length;
  const l = ['## Guías', '', `**${buenas} de ${resultadosGuia.length}** situaciones abren la guía esperada.`, ''];
  if (fecha) l.push(`_Medidas el ${fecha} · ${modelo || 'el suyo por defecto'}_`, '');
  l.push('| Frase | Preparación | Guía esperada | Abrió |', '|---|---|---|---|');
  for (const r of resultadosGuia) {
    l.push(`| "${r.frase}" | ${r.preparar} | ${r.guia} | ${r.abierta ? '✅' : '❌'}${r.nota ? ` (${r.nota})` : ''} |`);
  }
  const fallos = resultadosGuia.filter(r => !r.abierta);
  l.push('', '### Fallos de guías', '');
  if (!fallos.length) l.push('Ninguno.');
  for (const r of fallos) l.push(`- "${r.frase}" (${r.preparar}) → no abrió \`${r.guia}\`${r.nota ? ` (${r.nota})` : ''}`);
  return l;
}

// --solo-guias no puede pisar la tabla de frases de una ejecución completa anterior (era el bug: escribía el
// fichero entero con "Sin frases de skills" encima de una medición que sí las tenía). Pura: solo toca el
// texto desde "## Guías" en adelante; si no había esa sección, la añade al final.
function reemplazarGuias(anterior, lineasGuias) {
  const idx = anterior.search(/^## Guías\s*$/m);
  const cabecera = (idx === -1 ? anterior : anterior.slice(0, idx)).trimEnd();
  const guias = lineasGuias.join('\n').trimEnd();
  return guias ? `${cabecera}\n\n${guias}\n` : `${cabecera}\n`;
}

function markdownResumen({ fecha, version, modelo, resultados, resultadosGuia = [], asistente = 'claude-code' }) {
  const l = [`# Disparadores · ${asistente}`, '', `- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo || 'el suyo por defecto'}`, ''];
  if (resultados.length) {
    const buenas = resultados.filter(r => acierta(r.elegida, r.esperada)).length;
    l.push(`**${buenas} de ${resultados.length}** frases eligen lo esperado.`, '', '| Esperada | Aciertos |', '|---|---|');
    const grupos = new Map();
    for (const r of resultados) {
      const clave = [].concat(r.esperada).map(nombre).join(' o ');
      const g = grupos.get(clave) || { bien: 0, total: 0 };
      g.total++; if (acierta(r.elegida, r.esperada)) g.bien++;
      grupos.set(clave, g);
    }
    for (const [clave, g] of grupos) l.push(`| ${clave} | ${g.bien} / ${g.total} |`);
    const fallos = resultados.filter(r => !acierta(r.elegida, r.esperada));
    l.push('', '## Fallos', '');
    if (!fallos.length) l.push('Ninguno.');
    for (const r of fallos) {
      l.push(`- "${r.frase}" → esperada ${[].concat(r.esperada).map(nombre).join(' o ')}, eligió \`${nombre(r.elegida)}\`${r.nota ? ` (${r.nota})` : ''}`);
    }
    l.push('');
  } else {
    l.push('_Sin frases de skills en esta ejecución (`--solo-guias`)._', '');
  }
  l.push(...markdownGuias(resultadosGuia));
  return l.join('\n').trimEnd() + '\n';
}

// Un nombre de fichero legible para --volcar: el stream crudo de cada ejecución (obligatorio en la primera
// medición con un asistente nuevo, para poder revisar a mano qué llegó de verdad).
let contadorVolcado = 0;
function volcar(dir, etiqueta, texto) {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const nombreFichero = `${String(++contadorVolcado).padStart(3, '0')}-${etiqueta.replace(/[^\w-]+/g, '_').slice(0, 60)}.jsonl`;
  fs.writeFileSync(path.join(dir, nombreFichero), texto);
}

// Qué stdio le corresponde al hijo: 'pipe' solo si hay que escribirle algo (el prompt por stdin, Codex);
// 'ignore' si no (Claude Code, como siempre: el prompt va como argumento). Pura, para poder probarla sin
// spawnear nada.
function stdioDeEntrada(entrada) {
  return [entrada === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'];
}

// Lo que comparten lanzarFrase (skill elegida) y lanzarCasoGuia (guía abierta): lanzar el asistente sin
// permisos de escritura y leer su stream línea a línea hasta que `detectar` decida algo, corte el tiempo o
// termine. El prompt va por stdin cuando el lanzador lo pide (Codex); si no, como argumento (Claude Code, como
// siempre). `lanzador.comoEjecutar` resuelve el ejecutable de verdad (en Windows, un `.cmd` de npm no se
// puede lanzar tal cual: preparar.js#comoLanzar).
function ejecutarAsistente({ lanzador, adaptador, frase, destino, modelo, detectar, sinDecidir, volcarDir, etiquetaVolcado }) {
  return new Promise(resolve => {
    const plan = lanzador.comoEjecutar(lanzador.argsSondeo({ prompt: frase, modelo, cwd: destino, adaptador }));
    if (plan.error) { resolve(sinDecidir(`no se pudo preparar el lanzamiento: ${plan.error}`)); return; }
    const conEntrada = plan.entrada !== undefined;
    const hijo = spawn(plan.ejecutable, plan.args, {
      cwd: destino, env: lanzador.entorno(), stdio: stdioDeEntrada(plan.entrada), windowsVerbatimArguments: plan.literal === true,
    });
    const lineas = [];
    let resto = '';
    let hecho = false;
    const terminar = resultado => {
      if (hecho) return;
      hecho = true;
      clearTimeout(reloj);
      hijo.kill('SIGTERM');
      if (volcarDir) volcar(volcarDir, etiquetaVolcado || frase, [...lineas, resto].join('\n'));
      resolve(resultado);
    };
    const reloj = setTimeout(() => terminar(sinDecidir('tiempo agotado')), LIMITE_MS);
    // Si el proceso no llega ni a arrancar (comando no encontrado, sin permiso de ejecución...), spawn no
    // lanza: emite 'error' de forma asíncrona. Sin este handler, la promesa nunca se resolvía (se quedaba
    // esperando hasta LIMITE_MS sin motivo real).
    hijo.on('error', e => terminar(sinDecidir(`no arrancó: ${e.message}`)));
    if (conEntrada) {
      // Si el proceso muere justo al arrancar, escribir en su stdin ya cerrado tira un 'error' (EPIPE) que,
      // sin escucharlo, tumba el proceso entero (Node exige que todo 'error' tenga un listener).
      hijo.stdin.on('error', () => {});
      hijo.stdin.write(plan.entrada);
      hijo.stdin.end();
    }
    hijo.stdout.on('data', trozo => {
      const partes = (resto + trozo).split('\n');
      resto = partes.pop();
      lineas.push(...partes);
      const d = detectar(lineas);
      if (d.decidido) terminar(d);
    });
    hijo.on('close', codigo => {
      const d = detectar([...lineas, resto]);
      terminar(d.decidido ? d : sinDecidir(`terminó (código ${codigo}) sin decidir`));
    });
  });
}

function lanzarFrase({ frase, destino, modelo, lanzador, adaptador, volcarDir }) {
  return ejecutarAsistente({
    lanzador, adaptador, frase, destino, modelo, volcarDir, etiquetaVolcado: `frase-${frase}`,
    detectar: lineas => decidirEleccion(lineas, lanzador),
    sinDecidir: nota => ({ decidido: true, skill: null, nota }),
  }).then(({ skill, nota, sinMedir: s }) => ({ skill, nota, sinMedir: s }));
}

function lanzarCasoGuia({ frase, destino, modelo, guia, lanzador, adaptador, volcarDir }) {
  return ejecutarAsistente({
    lanzador, adaptador, frase, destino, modelo, volcarDir, etiquetaVolcado: `guia-${guia}`,
    detectar: lineas => abrioGuia(lineas, guia, lanzador),
    sinDecidir: nota => ({ decidido: true, abierta: false, nota }),
  }).then(({ abierta, nota, sinMedir: s }) => ({ abierta, nota, sinMedir: s }));
}

// El curso de ejemplo configurado, con lo que dejó la última prueba real encima (sesiones procesadas, dudas, examen):
// así hay algo que repasar. resultado/config/ solo trae lo que cambió en la prueba (alumno.md), no curso.md ni
// profesor.md: montar solo el resultado dejaba un curso sin configurar (medición del 2026-09-24, repetida).
function datosDelCurso() {
  const datos = carpetaTemporal();
  for (const origen of [EJEMPLO, path.join(EJEMPLO, 'resultado')]) {
    for (const rel of ['config', 'estudio', 'README.md']) copiar(path.join(origen, rel), path.join(datos, rel));
  }
  return datos;
}

// El adaptador del curso montado, ya con el lanzador que sabe hablar con él (pruebas/lib/asistentes/). Sin
// adaptador, un error claro: el mismo que usaría cli() para no gastar nada lanzando un asistente a ciegas.
function lanzadorDelCurso(destino) {
  const { llm, adaptador } = adaptadorDelCurso(destino);
  if (!adaptador) throw new Error(`el curso usa \`${llm}\` y no tiene adaptador`);
  return { adaptador, lanzador: lanzadorPara(adaptador) };
}

// Un caso de guía necesita su propio curso montado (cada uno lo deja en un estado distinto: una propiedad "a
// su manera", una preparación terminada, una interrumpida) — a diferencia de las frases de skills, que no
// tocan el curso y por eso comparten uno solo. Devuelve también el modelo usado, para el resumen cuando se
// lanza con --solo-guias y no hay ningún otro curso montado del que sacarlo.
async function ejecutarCasoGuia({ caso, modelo, asistente, volcarDir }) {
  const destino = carpetaTemporal();
  const datos = datosDelCurso();
  try {
    montarCurso({ trabajo: RAIZ_KIT, datosCurso: datos, nombre: 'curso-ejemplo', destino, llm: asistente });
    const { adaptador, lanzador } = lanzadorDelCurso(destino);
    const modeloUsado = modelo || modeloRecomendado(destino);
    const preparado = casosGuia.preparar(destino, caso.preparar);
    if (!preparado.ok) return { ...caso, abierta: false, nota: `no se pudo preparar la situación: ${preparado.motivo}`, modeloUsado };
    const { abierta, nota, sinMedir: s } = await lanzarCasoGuia({
      frase: caso.frase, destino, modelo: modeloUsado, guia: caso.guia, lanzador, adaptador, volcarDir,
    });
    return { ...caso, abierta, nota, sinMedir: s, modeloUsado };
  } finally {
    borrar(destino);
    borrar(datos);
  }
}

// Uno a uno, no en paralelo (EN_PARALELO es para frases que comparten curso): son pocos, y cada uno monta y
// borra su propio curso.
async function ejecutarCasosGuia({ modelo, asistente, volcarDir }) {
  const casos = JSON.parse(fs.readFileSync(FRASES, 'utf8')).casos_guia || [];
  const resultados = [];
  for (const caso of casos) {
    const r = await ejecutarCasoGuia({ caso, modelo, asistente, volcarDir });
    resultados.push(r);
    console.log(`  ${r.abierta ? '✅' : '❌'} "${r.frase}" (${r.preparar}) → ${r.abierta ? `abrió ${r.guia}` : `no abrió ${r.guia}`}${r.nota ? ` (${r.nota})` : ''}`);
  }
  return resultados;
}

async function ejecutar({ modelo, solo, frase, veces = 1, soloGuias = false, asistente, volcarDir }) {
  const RESULTADO = rutaResultado(asistente);
  if (soloGuias) {
    const resultadosGuia = await ejecutarCasosGuia({ modelo, asistente, volcarDir });
    const fecha = new Date().toISOString().slice(0, 10);
    const modeloUsado = modelo || (resultadosGuia[0] && resultadosGuia[0].modeloUsado) || null;
    // Si ya hay un resultado de una ejecución completa (con su tabla de frases), --solo-guias no lo pisa
    // entero: solo sustituye su sección "## Guías" — con su propia fecha y modelo, porque la tabla de
    // frases de arriba puede ser de otro día. Sin resultado previo, se escribe como una ejecución completa
    // sin frases (el mensaje "Sin frases de skills" de markdownResumen; ahí la fecha/modelo del encabezado
    // ya cubre la sección de guías, así que no hace falta repetirla dentro).
    const anterior = fs.existsSync(RESULTADO) ? fs.readFileSync(RESULTADO, 'utf8') : null;
    const md = anterior
      ? reemplazarGuias(anterior, markdownGuias(resultadosGuia, { fecha, modelo: modeloUsado }))
      : markdownResumen({
        fecha, version: fs.readFileSync(path.join(RAIZ_KIT, '.kit', 'VERSION'), 'utf8').trim(),
        modelo: modeloUsado, resultados: [], resultadosGuia, asistente,
      });
    if (!quedoSinMedir(resultadosGuia)) fs.writeFileSync(RESULTADO, md);
    return md;
  }
  const destino = carpetaTemporal();
  const datos = datosDelCurso();
  try {
    montarCurso({ trabajo: RAIZ_KIT, datosCurso: datos, nombre: 'curso-ejemplo', destino, llm: asistente });
    const { adaptador, lanzador } = lanzadorDelCurso(destino);
    modelo = modelo || modeloRecomendado(destino);
    let frases = JSON.parse(fs.readFileSync(FRASES, 'utf8')).frases;
    if (solo) frases = frases.slice(0, solo);
    if (frase) {
      const conocida = frases.find(f => f.frase === frase);
      frases = Array.from({ length: veces }, () => ({ frase, esperada: conocida ? conocida.esperada : null }));
    }
    const resultados = new Array(frases.length);
    let siguiente = 0;
    const trabajador = async () => {
      while (siguiente < frases.length) {
        const i = siguiente++;
        const { skill, nota, sinMedir: s } = await lanzarFrase({ frase: frases[i].frase, destino, modelo, lanzador, adaptador, volcarDir });
        resultados[i] = { ...frases[i], elegida: skill, nota, sinMedir: s };
        console.log(`  ${s ? '⚠️' : acierta(skill, frases[i].esperada) ? '✅' : '❌'} "${frases[i].frase}" → ${nombre(skill)}${nota ? ` (${nota})` : ''}`);
      }
    };
    // Los casos de guía montan su propio curso: pueden correr a la vez que las frases, que comparten el suyo.
    const resultadosGuiaPromesa = frase ? Promise.resolve([]) : ejecutarCasosGuia({ modelo, asistente, volcarDir });
    await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));
    const resultadosGuia = await resultadosGuiaPromesa;
    const md = markdownResumen({
      fecha: new Date().toISOString().slice(0, 10), version: fs.readFileSync(path.join(destino, '.kit', 'VERSION'), 'utf8').trim(),
      modelo, resultados, resultadosGuia, asistente,
    });
    // Repetir una frase suelta no pisa la medición completa; una medición con frases sin medir, tampoco.
    if (!quedoSinMedir([...resultados, ...resultadosGuia]) && !frase) fs.writeFileSync(RESULTADO, md);
    return md;
  } finally {
    borrar(destino);
    borrar(datos);
  }
}

async function cli(args) {
  const valor = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const asistente = valor('--asistente') || JSON.parse(fs.readFileSync(path.join(EJEMPLO, 'config', 'ajustes.json'), 'utf8')).llm || 'claude-code';
  const ficheroAdaptador = path.join(RAIZ_KIT, '.kit', 'adaptadores', `${asistente}.json`);
  if (!fs.existsSync(ficheroAdaptador)) { console.error(`el curso usa \`${asistente}\` y no tiene adaptador`); return 1; }
  const lanzador = lanzadorPara(JSON.parse(fs.readFileSync(ficheroAdaptador, 'utf8')));
  const chequeo = lanzador.comprobar();
  if (!chequeo.ok) {
    // "no-encontrado" es el único caso en el que el mensaje de comprobar() habla de `--sin-llm`: esta
    // medición no tiene ese flag, así que aquí es un texto propio (el de siempre, con Claude, generalizado
    // al comando del lanzador). "sin-sesion" (Codex) no lo menciona: ese sí vale tal cual.
    const mensaje = chequeo.motivo === 'no-encontrado'
      ? `No encuentro \`${lanzador.comando}\`: esta medición necesita el asistente instalado y con sesión.`
      : chequeo.mensaje;
    console.error(mensaje);
    return 1;
  }
  const md = await ejecutar({
    modelo: valor('--modelo'), solo: Number(valor('--solo')) || 0, frase: valor('--frase'), veces: Number(valor('--veces')) || 1,
    soloGuias: args.includes('--solo-guias'), asistente, volcarDir: valor('--volcar'),
  });
  console.log('\n' + md.split('\n').slice(0, 20).join('\n') + `\nResultado completo: ${path.relative(RAIZ_KIT, rutaResultado(asistente))}`);
  return process.exitCode || 0;
}

if (require.main === module) cli(process.argv.slice(2)).then(c => process.exit(c));

module.exports = {
  decidirEleccion, abrioGuia, acierta, markdownResumen, markdownGuias, datosDelCurso, reemplazarGuias, rutaResultado,
  ejecutarAsistente, stdioDeEntrada,
  LIMITE_HERRAMIENTAS, LIMITE_HERRAMIENTAS_GUIA,
};
