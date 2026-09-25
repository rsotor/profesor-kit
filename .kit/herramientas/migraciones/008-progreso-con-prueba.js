'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Ver 004-…: la ejecuta el actualizar.js de la versión vieja, con sus piezas viejas en memoria.
function cargarFresco(rel) {
  const herramientas = path.dirname(__dirname) + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
  return require(path.join(path.dirname(__dirname), ...rel.split('/')));
}

// Formato v8 (P5+H12, 0.26.0): una casilla de progreso.md distinta de ⬜ cita de qué respuesta sale
// (`🟡 flojo · examen 1, p.1: …`); comprobar.js avisa con `progreso-sin-prueba` si falta. Un curso ya empezado
// tiene casillas puestas antes de esta versión, sin cita y sin forma de reconstruirla: se marcan como tal, para
// que el aviso no salte en cursos viejos hasta que se vuelvan a tocar de verdad.
const CITA = ' · antes de la 0.26, sin prueba';
const ESTADO = /(✅|🟡|🔴)/;

module.exports = {
  descripcion: 'Las casillas de estudio/progreso.md distintas de ⬜ que no citaban su prueba, con "antes de la 0.26, sin prueba"',
  migrar(raiz) {
    const v = cargarFresco('lib/vault.js');
    const fichero = path.join(v.baseAlumno(raiz), 'progreso.md');
    if (!fs.existsSync(fichero)) return;

    const original = fs.readFileSync(fichero, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let cambiado = false;
    const lineas = original.replace(/\r\n/g, '\n').split('\n').map(linea => {
      if (!/^\s*\|/.test(linea)) return linea;
      const celdas = linea.split(/(?<!\\)\|/);
      if (!/^\s*\[\[/.test(celdas[1] || '')) return linea;   // cabecera o separador, no una fila de concepto
      const nuevas = celdas.map((celda, i) => {
        if (i === 0 || i === celdas.length - 1) return celda;   // fuera de la tabla: antes del primer | y después del último
        if (i === 1) return celda;   // la celda del concepto, nunca lleva estado
        if (!ESTADO.test(celda) || celda.includes('·')) return celda;
        cambiado = true;
        return ` ${celda.trim()}${CITA} `;
      });
      return nuevas.join('|');
    });
    if (!cambiado) return;   // idempotente: nada que no tenga ya su cita (o su marca de "antes de la 0.26")
    fs.writeFileSync(fichero, lineas.join('\n').replace(/\n/g, eol));
  },
};
