'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');

const MANIFIESTO = '.instaladas-por-kit.json';

function instalarSkills({ raiz, destino = '.claude/skills' }) {
  const origen = path.join(raiz, '.kit', 'skills');
  const dirDestino = path.join(raiz, ...destino.split('/'));
  fs.mkdirSync(dirDestino, { recursive: true });

  const ficheroManifiesto = path.join(dirDestino, MANIFIESTO);
  const anteriores = fs.existsSync(ficheroManifiesto) ? JSON.parse(fs.readFileSync(ficheroManifiesto, 'utf8')) : [];
  const actuales = fs.existsSync(origen)
    ? fs.readdirSync(origen, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()
    : [];

  const retiradas = anteriores.filter(n => !actuales.includes(n));
  for (const nombre of [...retiradas, ...actuales]) fs.rmSync(path.join(dirDestino, nombre), { recursive: true, force: true, maxRetries: 3 });
  for (const nombre of actuales) fs.cpSync(path.join(origen, nombre), path.join(dirDestino, nombre), { recursive: true });

  fs.writeFileSync(ficheroManifiesto, JSON.stringify(actuales, null, 2) + '\n');
  return { instaladas: actuales, retiradas };
}

// Sin --destino, se toma del adaptador del LLM que diga config/ajustes.json (config/adaptador-llm.json
// si el curso tiene uno propio, si no el de .kit/adaptadores/<llm>.json). Sin ninguno de los dos, el
// destino por defecto de instalarSkills() (Claude Code).
function cli(args, raiz) {
  const i = args.indexOf('--destino');
  let destino = i >= 0 ? args[i + 1] : undefined;
  if (!destino) {
    const adaptador = v.leerAdaptador(raiz, v.leerAjustes(raiz).llm);
    if (adaptador && adaptador.skills) destino = adaptador.skills;
  }
  const r = instalarSkills({ raiz, destino });
  console.log(`Skills instaladas: ${r.instaladas.join(', ') || 'ninguna'}${r.retiradas.length ? ` · retiradas: ${r.retiradas.join(', ')}` : ''}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'instalar-skills.js');

module.exports = { instalarSkills, cli };
