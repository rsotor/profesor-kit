'use strict';
// Asistente falso para probar pruebas/disparadores.js#ejecutarAsistente sin lanzar codex/claude de verdad
// (issue #45, plan-lanzadores, test 11): lee stdin entero y, si se le pasa `--eco-a <fichero>`, lo escribe
// ahí para que el test compruebe que el prompt llegó completo. Luego escupe una línea JSONL al estilo Codex
// (una skill leída) para que decidirEleccion pueda cortar en cuanto la vea, y se queda vivo (un temporizador
// que nunca se limpia) para que solo `ejecutarAsistente` matándolo con SIGTERM lo termine — si no lo mata,
// el proceso (y el test) se quedan colgados.
const fs = require('node:fs');

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { entrada += chunk; });
process.stdin.on('end', () => {
  const i = process.argv.indexOf('--eco-a');
  if (i >= 0) fs.writeFileSync(process.argv[i + 1], entrada);
  console.log(JSON.stringify({ type: 'item.completed', item: { id: '1', type: 'command_execution', command: 'sed -n 1,10p .agents/skills/dudas/SKILL.md', status: 'completed' } }));
  // Se queda vivo: solo lo termina un kill de verdad (setInterval no está en los globals del linter del kit).
  (function mantenerVivo() { setTimeout(mantenerVivo, 60 * 60 * 1000); })();
});
