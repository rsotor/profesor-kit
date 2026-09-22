'use strict';
const path = require('node:path');
const { aplicarAjustes, instalarComplementos } = require('./lib/obsidian');

// Deja Obsidian como lo recomienda el kit: ajustes (sin pisar los del alumno) y complementos instalados sin activar.
// Un fallo de red no es un error del curso: lo dice y sale bien.
async function cli(args, raiz, descargar) {
  const tocados = aplicarAjustes(raiz);
  console.log(tocados.length ? `Ajustes de Obsidian escritos: ${tocados.join(', ')}.` : 'Ajustes de Obsidian: ya estaban.');
  if (args.includes('--sin-complementos')) return 0;
  const r = await instalarComplementos(raiz, descargar);
  if (r.instalados.length) console.log(`Complementos instalados (sin activar): ${r.instalados.join(', ')}.`);
  if (r.yaEstaban.length) console.log(`Ya estaban: ${r.yaEstaban.join(', ')}.`);
  for (const f of r.fallidos) console.log(`No se pudo descargar ${f.id}: ${f.motivo}. Se puede repetir más tarde.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'obsidian.js');

module.exports = { cli };
