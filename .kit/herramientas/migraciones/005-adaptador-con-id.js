'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Formato v5 (issue #39, H09): el adaptador que escribe el curso (config/adaptador-llm.json) dice de qué asistente es
// (`id`), y solo manda para ese. Los de antes no lo tenían: son del asistente que usa el curso ahora.
module.exports = {
  descripcion: 'El adaptador propio del curso dice de qué asistente es',
  migrar(raiz) {
    const fichero = path.join(raiz, 'config', 'adaptador-llm.json');
    if (!fs.existsSync(fichero)) return;
    let adaptador;
    try { adaptador = JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch { return; }
    if (!adaptador || typeof adaptador !== 'object' || adaptador.id) return;
    let llm = 'claude-code';
    try { llm = JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8')).llm || llm; } catch { /* sin ajustes: el de por defecto */ }
    fs.writeFileSync(fichero, JSON.stringify({ id: llm, ...adaptador }, null, 2) + '\n');
  },
};
