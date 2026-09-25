'use strict';
// Registro de lanzadores de asistente para las pruebas del kit (issue #45): cada uno implementa la interfaz de
// pruebas/lib/asistentes/claude-code.js — comprobar, argsTarea, argsSondeo, eventos, leerSalida, entorno.
const claudeCode = require('./claude-code');
const codex = require('./codex');

const REGISTRO = { 'claude-code': claudeCode, codex };

// El id sale de `adaptador.id` (el mismo que usa config/ajustes.json#llm, vía el alias de v.leerAdaptador):
// sin lanzador para ese id, un error claro que dice qué fichero falta, no un "undefined is not a function".
function lanzadorPara(adaptador) {
  const lanzador = REGISTRO[adaptador.id];
  if (!lanzador) throw new Error(`la prueba no sabe lanzar \`${adaptador.id}\`: añade pruebas/lib/asistentes/${adaptador.id}.js`);
  return lanzador;
}

module.exports = { lanzadorPara, REGISTRO, claudeCode, codex };
