'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const { motivoRutaNoSegura, estaDentro } = require('./lib/rutas');

const MANIFIESTO = '.instaladas-por-kit.json';

function instalarSkills({ raiz, destino = '.claude/skills' }) {
  // El destino sale del adaptador, que el curso puede escribir (config/adaptador-llm.json): se comprueba igual.
  const motivo = motivoRutaNoSegura(destino, { protegidas: v.RUTAS_PROTEGIDAS });
  if (motivo) throw new Error(`Carpeta de skills no válida en el adaptador: ${destino} (${motivo})`);
  const origen = path.join(raiz, '.kit', 'skills');
  const dirDestino = path.join(raiz, ...destino.split('/'));
  fs.mkdirSync(dirDestino, { recursive: true });

  const ficheroManifiesto = path.join(dirDestino, MANIFIESTO);
  const anteriores = fs.existsSync(ficheroManifiesto) ? JSON.parse(fs.readFileSync(ficheroManifiesto, 'utf8')) : [];
  const actuales = fs.existsSync(origen)
    ? fs.readdirSync(origen, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()
    : [];

  // Solo se borra lo que es de verdad una carpeta de skill dentro del destino: un manifiesto estropeado o
  // manipulado ("../../algo") no puede borrar nada fuera (issue #39, H02).
  const borrable = n => !motivoRutaNoSegura(n, { unTramo: true }) && estaDentro(dirDestino, n);
  const retiradas = (Array.isArray(anteriores) ? anteriores : []).filter(n => !actuales.includes(n)).filter(borrable);
  for (const nombre of [...retiradas, ...actuales.filter(borrable)]) fs.rmSync(path.join(dirDestino, nombre), { recursive: true, force: true, maxRetries: 3 });
  for (const nombre of actuales) fs.cpSync(path.join(origen, nombre), path.join(dirDestino, nombre), { recursive: true });

  fs.writeFileSync(ficheroManifiesto, JSON.stringify(actuales, null, 2) + '\n');
  return { instaladas: actuales, retiradas };
}

// Sin --destino, se toma del adaptador del LLM que diga config/ajustes.json (config/adaptador-llm.json
// si el curso tiene uno propio, si no el de .kit/adaptadores/<llm>.json). Sin ninguno de los dos, el
// destino por defecto de instalarSkills() es el de Claude Code: solo vale si el curso de verdad usa
// Claude Code (o no ha dicho nada). Para cualquier otro LLM sin adaptador, copiar ahí sería un error
// silencioso (las skills quedarían donde ese asistente nunca las busca): se para y se explica qué falta.
function cli(args, raiz) {
  const i = args.indexOf('--destino');
  let destino = i >= 0 ? args[i + 1] : undefined;
  if (!destino) {
    const llm = v.leerAjustes(raiz).llm;
    const adaptador = v.leerAdaptador(raiz, llm);
    if (adaptador && adaptador.skills) {
      destino = adaptador.skills;
    } else if (llm && llm !== 'claude-code') {
      console.log(`No sé dónde busca las skills "${llm}": no hay un adaptador para él (ni del kit, ni propio del `
        + 'curso en config/adaptador-llm.json) y no se ha pasado --destino. No instalo nada en .claude/skills: es '
        + 'la carpeta de Claude Code, no la suya. Sigue .kit/ESTANDARES.md para escribir config/adaptador-llm.json, '
        + 'o repite con --destino <carpeta>.');
      return 1;
    }
  }
  const r = instalarSkills({ raiz, destino });
  console.log(`Skills instaladas: ${r.instaladas.join(', ') || 'ninguna'}${r.retiradas.length ? ` · retiradas: ${r.retiradas.join(', ')}` : ''}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'instalar-skills.js');

module.exports = { instalarSkills, cli };
