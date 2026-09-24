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
//
// Cada frase corre sin permisos para escribir (se deniegan sin preguntar) y se corta en cuanto elige: la primera
// skill que usa, o ninguna si contesta sin skill o pasa LIMITE_HERRAMIENTAS herramientas sin usar una. Solo sabe
// lanzar claude; Codex, en la issue #45. Resultado: pruebas/disparadores-claude-code.md. Nunca en el CI.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { borrar, montarCurso, carpetaTemporal, copiar } = require('./lib/montaje');
const { modeloRecomendado, entornoDeAlumno } = require('./prueba-real');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const FRASES = path.join(__dirname, 'disparadores.json');
const RESULTADO = path.join(__dirname, 'disparadores-claude-code.md');
// AGENTS.md manda leer config/, el diario y estado.js antes: "¿qué es la liquidez?" llega a /dudas en la 5.ª o 6.ª
// herramienta (2026-09-24). Con 6 se cortaba antes y salía un fallo que no era.
const LIMITE_HERRAMIENTAS = 12;
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

function acierta(elegida, esperada) {
  return [].concat(esperada).includes(elegida);
}

const nombre = s => (s === null ? 'ninguna' : s);

function markdownResumen({ fecha, version, modelo, resultados }) {
  const buenas = resultados.filter(r => acierta(r.elegida, r.esperada)).length;
  const l = ['# Disparadores · claude-code', '', `- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo}`, '',
    `**${buenas} de ${resultados.length}** frases eligen lo esperado.`, '', '| Esperada | Aciertos |', '|---|---|'];
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
  return l.join('\n') + '\n';
}

function lanzarFrase({ frase, destino, modelo }) {
  return new Promise(resolve => {
    const args = ['-p', frase, '--model', modelo, '--permission-mode', 'default', '--permission-prompts', 'none',
      '--output-format', 'stream-json', '--verbose'];
    const hijo = spawn('claude', args, { cwd: destino, env: entornoDeAlumno(), stdio: ['ignore', 'pipe', 'pipe'] });
    const lineas = [];
    let resto = '';
    let hecho = false;
    const terminar = (skill, nota) => {
      if (hecho) return;
      hecho = true;
      clearTimeout(reloj);
      hijo.kill('SIGTERM');
      resolve({ skill, nota });
    };
    const reloj = setTimeout(() => terminar(null, 'tiempo agotado'), LIMITE_MS);
    hijo.stdout.on('data', trozo => {
      const partes = (resto + trozo).split('\n');
      resto = partes.pop();
      lineas.push(...partes);
      const d = decidirEleccion(lineas);
      if (d.decidido) terminar(d.skill, d.nota);
    });
    hijo.on('close', codigo => {
      const d = decidirEleccion([...lineas, resto]);
      terminar(d.decidido ? d.skill : null, d.decidido ? d.nota : `terminó (código ${codigo}) sin decidir`);
    });
  });
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

async function ejecutar({ modelo, solo, frase, veces = 1 }) {
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
    await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));
    const md = markdownResumen({
      fecha: new Date().toISOString().slice(0, 10), version: fs.readFileSync(path.join(destino, '.kit', 'VERSION'), 'utf8').trim(),
      modelo, resultados,
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
  const md = await ejecutar({ modelo: valor('--modelo'), solo: Number(valor('--solo')) || 0, frase: valor('--frase'), veces: Number(valor('--veces')) || 1 });
  console.log('\n' + md.split('\n').slice(0, 20).join('\n') + `\nResultado completo: ${path.relative(RAIZ_KIT, RESULTADO)}`);
  return 0;
}

if (require.main === module) cli(process.argv.slice(2)).then(c => process.exit(c));

module.exports = { decidirEleccion, acierta, markdownResumen, datosDelCurso, LIMITE_HERRAMIENTAS };
