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
//
// Cada frase corre sin permisos para escribir (se deniegan sin preguntar) y se corta en cuanto elige: la primera
// skill que usa, o ninguna si contesta sin skill o pasa LIMITE_HERRAMIENTAS herramientas sin usar una. Solo sabe
// lanzar claude; Codex, en la issue #45. Resultado: pruebas/disparadores-claude-code.md. Nunca en el CI.
//
// "casos_guia" de disparadores.json mide otra cosa (plan 0.26.0, tarea 1.3): situación → el profesor debe abrir
// tal guía de .kit/guias/. Cada caso trae `preparar` (un nombre de pruebas/lib/casos-guia.js que deja el curso
// montado en ese estado: una propiedad "a su manera", una preparación en segundo plano terminada o interrumpida)
// y `guia` (el fichero esperado). Se corta en cuanto el asistente la lee (un `Read`, o un `Bash` que la cite) o
// tras LIMITE_HERRAMIENTAS_GUIA herramientas sin leerla.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { borrar, montarCurso, carpetaTemporal, copiar } = require('./lib/montaje');
const { modeloRecomendado, entornoDeAlumno } = require('./prueba-real');
const casosGuia = require('./lib/casos-guia');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const FRASES = path.join(__dirname, 'disparadores.json');
const RESULTADO = path.join(__dirname, 'disparadores-claude-code.md');
// AGENTS.md manda leer config/, el diario y estado.js antes: "¿qué es la liquidez?" llega a /dudas en la 5.ª o 6.ª
// herramienta (2026-09-24). Con 6 se cortaba antes y salía un fallo que no era.
const LIMITE_HERRAMIENTAS = 12;
// Un caso de guía tarda más en decidirse que una skill (no hay un tool_use "Skill" que lo corte antes):
// hasta que no comprueba el curso y sigue la situación, no llega a abrir la guía. Provisional: a ajustar
// con lo que diga la primera medición real.
const LIMITE_HERRAMIENTAS_GUIA = 25;
const LIMITE_MS = 3 * 60 * 1000;
const EN_PARALELO = 4;

// Las líneas de stream-json que lleva la ejecución → { decidido, skill }. Puro, para poder probarlo.
function decidirEleccion(lineas) {
  let herramientas = 0;
  for (const linea of lineas) {
    let m;
    try { m = JSON.parse(linea); } catch { continue; }
    if (m.type === 'result') return { decidido: true, skill: null };
    if (m.type !== 'assistant') continue;
    for (const c of (m.message && m.message.content) || []) {
      if (c.type !== 'tool_use') continue;
      if (c.name === 'Skill') return { decidido: true, skill: String((c.input || {}).skill || '').split(':').pop() };
      if (++herramientas >= LIMITE_HERRAMIENTAS) return { decidido: true, skill: null, nota: `${LIMITE_HERRAMIENTAS} herramientas sin skill` };
    }
  }
  return { decidido: false };
}

// ¿Es este evento de herramienta un Read (o un Bash que la cite) de la guía `guia`? "O equivalente" (la tarea):
// cualquier otro nombre de herramienta que traiga una ruta o un comando con la guía también cuenta.
function abreLaGuia(c, guia) {
  if (c.type !== 'tool_use') return false;
  const entrada = c.input || {};
  const objetivo = `guias/${guia}`;
  if (typeof entrada.file_path === 'string' && entrada.file_path.replace(/\\/g, '/').includes(objetivo)) return true;
  if (typeof entrada.path === 'string' && entrada.path.replace(/\\/g, '/').includes(objetivo)) return true;
  return typeof entrada.command === 'string' && entrada.command.includes(objetivo);
}

// Las líneas de stream-json de un "caso de guía" → { decidido, abierta }. Puro, igual que decidirEleccion,
// pero sin cortar en la primera herramienta que no sea la guía (aquí no hay un tool_use "Skill" que decida
// solo: el profesor puede leer config/, estado.js, comprobar.js... antes de llegar a la guía).
function abrioGuia(lineas, guia) {
  let herramientas = 0;
  for (const linea of lineas) {
    let m;
    try { m = JSON.parse(linea); } catch { continue; }
    if (m.type === 'result') return { decidido: true, abierta: false, nota: 'terminó sin abrir la guía' };
    if (m.type !== 'assistant') continue;
    for (const c of (m.message && m.message.content) || []) {
      if (c.type !== 'tool_use') continue;
      if (abreLaGuia(c, guia)) return { decidido: true, abierta: true };
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
function markdownGuias(resultadosGuia) {
  if (!resultadosGuia.length) return [];
  const buenas = resultadosGuia.filter(r => r.abierta).length;
  const l = ['## Guías', '', `**${buenas} de ${resultadosGuia.length}** situaciones abren la guía esperada.`, '',
    '| Frase | Preparación | Guía esperada | Abrió |', '|---|---|---|---|'];
  for (const r of resultadosGuia) {
    l.push(`| "${r.frase}" | ${r.preparar} | ${r.guia} | ${r.abierta ? '✅' : '❌'}${r.nota ? ` (${r.nota})` : ''} |`);
  }
  const fallos = resultadosGuia.filter(r => !r.abierta);
  l.push('', '### Fallos de guías', '');
  if (!fallos.length) l.push('Ninguno.');
  for (const r of fallos) l.push(`- "${r.frase}" (${r.preparar}) → no abrió \`${r.guia}\`${r.nota ? ` (${r.nota})` : ''}`);
  return l;
}

function markdownResumen({ fecha, version, modelo, resultados, resultadosGuia = [] }) {
  const l = ['# Disparadores · claude-code', '', `- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo}`, ''];
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

// Lo que comparten lanzarFrase (skill elegida) y lanzarCasoGuia (guía abierta): lanzar claude sin permisos de
// escritura y leer su stream-json línea a línea hasta que `detectar` decida algo, corte el tiempo o termine.
function ejecutarClaude({ frase, destino, modelo, detectar, sinDecidir }) {
  return new Promise(resolve => {
    const args = ['-p', frase, '--model', modelo, '--permission-mode', 'default', '--permission-prompts', 'none',
      '--output-format', 'stream-json', '--verbose'];
    const hijo = spawn('claude', args, { cwd: destino, env: entornoDeAlumno(), stdio: ['ignore', 'pipe', 'pipe'] });
    const lineas = [];
    let resto = '';
    let hecho = false;
    const terminar = resultado => {
      if (hecho) return;
      hecho = true;
      clearTimeout(reloj);
      hijo.kill('SIGTERM');
      resolve(resultado);
    };
    const reloj = setTimeout(() => terminar(sinDecidir('tiempo agotado')), LIMITE_MS);
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

function lanzarFrase({ frase, destino, modelo }) {
  return ejecutarClaude({
    frase, destino, modelo,
    detectar: decidirEleccion,
    sinDecidir: nota => ({ decidido: true, skill: null, nota }),
  }).then(({ skill, nota }) => ({ skill, nota }));
}

function lanzarCasoGuia({ frase, destino, modelo, guia }) {
  return ejecutarClaude({
    frase, destino, modelo,
    detectar: lineas => abrioGuia(lineas, guia),
    sinDecidir: nota => ({ decidido: true, abierta: false, nota }),
  }).then(({ abierta, nota }) => ({ abierta, nota }));
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

// Un caso de guía necesita su propio curso montado (cada uno lo deja en un estado distinto: una propiedad "a
// su manera", una preparación terminada, una interrumpida) — a diferencia de las frases de skills, que no
// tocan el curso y por eso comparten uno solo. Devuelve también el modelo usado, para el resumen cuando se
// lanza con --solo-guias y no hay ningún otro curso montado del que sacarlo.
async function ejecutarCasoGuia({ caso, modelo }) {
  const destino = carpetaTemporal();
  const datos = datosDelCurso();
  try {
    montarCurso({ trabajo: RAIZ_KIT, datosCurso: datos, nombre: 'curso-ejemplo', destino });
    const modeloUsado = modelo || modeloRecomendado(destino);
    const preparado = casosGuia.preparar(destino, caso.preparar);
    if (!preparado.ok) return { ...caso, abierta: false, nota: `no se pudo preparar la situación: ${preparado.motivo}`, modeloUsado };
    const { abierta, nota } = await lanzarCasoGuia({ frase: caso.frase, destino, modelo: modeloUsado, guia: caso.guia });
    return { ...caso, abierta, nota, modeloUsado };
  } finally {
    borrar(destino);
    borrar(datos);
  }
}

// Uno a uno, no en paralelo (EN_PARALELO es para frases que comparten curso): son pocos, y cada uno monta y
// borra su propio curso.
async function ejecutarCasosGuia({ modelo }) {
  const casos = JSON.parse(fs.readFileSync(FRASES, 'utf8')).casos_guia || [];
  const resultados = [];
  for (const caso of casos) {
    const r = await ejecutarCasoGuia({ caso, modelo });
    resultados.push(r);
    console.log(`  ${r.abierta ? '✅' : '❌'} "${r.frase}" (${r.preparar}) → ${r.abierta ? `abrió ${r.guia}` : `no abrió ${r.guia}`}${r.nota ? ` (${r.nota})` : ''}`);
  }
  return resultados;
}

async function ejecutar({ modelo, solo, frase, veces = 1, soloGuias = false }) {
  if (soloGuias) {
    const resultadosGuia = await ejecutarCasosGuia({ modelo });
    const md = markdownResumen({
      fecha: new Date().toISOString().slice(0, 10), version: fs.readFileSync(path.join(RAIZ_KIT, '.kit', 'VERSION'), 'utf8').trim(),
      modelo: modelo || (resultadosGuia[0] && resultadosGuia[0].modeloUsado) || 'desconocido', resultados: [], resultadosGuia,
    });
    fs.writeFileSync(RESULTADO, md);
    return md;
  }
  const destino = carpetaTemporal();
  const datos = datosDelCurso();
  try {
    montarCurso({ trabajo: RAIZ_KIT, datosCurso: datos, nombre: 'curso-ejemplo', destino });
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
        const { skill, nota } = await lanzarFrase({ frase: frases[i].frase, destino, modelo });
        resultados[i] = { ...frases[i], elegida: skill, nota };
        console.log(`  ${acierta(skill, frases[i].esperada) ? '✅' : '❌'} "${frases[i].frase}" → ${nombre(skill)}${nota ? ` (${nota})` : ''}`);
      }
    };
    // Los casos de guía montan su propio curso: pueden correr a la vez que las frases, que comparten el suyo.
    const resultadosGuiaPromesa = frase ? Promise.resolve([]) : ejecutarCasosGuia({ modelo });
    await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));
    const resultadosGuia = await resultadosGuiaPromesa;
    const md = markdownResumen({
      fecha: new Date().toISOString().slice(0, 10), version: fs.readFileSync(path.join(destino, '.kit', 'VERSION'), 'utf8').trim(),
      modelo, resultados, resultadosGuia,
    });
    if (!frase) fs.writeFileSync(RESULTADO, md);   // repetir una frase suelta no pisa la medición completa
    return md;
  } finally {
    borrar(destino);
    borrar(datos);
  }
}

async function cli(args) {
  const valor = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  if (spawnSync('claude', ['--version'], { encoding: 'utf8' }).status !== 0) {
    console.error('No encuentro `claude`: esta medición necesita el asistente instalado y con sesión.');
    return 1;
  }
  const md = await ejecutar({
    modelo: valor('--modelo'), solo: Number(valor('--solo')) || 0, frase: valor('--frase'), veces: Number(valor('--veces')) || 1,
    soloGuias: args.includes('--solo-guias'),
  });
  console.log('\n' + md.split('\n').slice(0, 20).join('\n') + `\nResultado completo: ${path.relative(RAIZ_KIT, RESULTADO)}`);
  return 0;
}

if (require.main === module) cli(process.argv.slice(2)).then(c => process.exit(c));

module.exports = {
  decidirEleccion, abrioGuia, acierta, markdownResumen, markdownGuias, datosDelCurso,
  LIMITE_HERRAMIENTAS, LIMITE_HERRAMIENTAS_GUIA,
};
