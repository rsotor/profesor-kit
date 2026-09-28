'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Ver 004-…: la ejecuta el actualizar.js de la versión vieja, con sus piezas viejas en memoria.
function cargarFresco(rel) {
  const herramientas = path.dirname(__dirname) + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
  return require(path.join(path.dirname(__dirname), ...rel.split('/')));
}

// Formato v9 (issue #54): los cursos de antes de la 0.26 tienen una cuarta columna, `Última prueba`, con la
// prueba de cada fila. La 008 no la miraba: marcó "sin prueba" casillas que sí la tenían ahí, y comprobar.js da
// un `no-se-vera-bien` falso por cada fila de 4 columnas. Aquí esa prueba pasa a la cita de sus casillas (la
// marca de la 008, o ninguna cita, se sustituye) y la columna se quita. Si en una fila la prueba no cabe en
// ninguna casilla (⬜, o casillas que ya citan otra cosa), no se pierde: va a una lista debajo de la tabla.
const MARCA_008 = ' · antes de la 0.26, sin prueba';
const ESTADO = /(✅|🟡|🔴)/;
const COLUMNA = /^[ÚU]ltima prueba$/i;
const VACIA = /^[\s—–-]*$/;

function celdasDe(linea) { return linea.split(/(?<!\\)\|/); }

module.exports = {
  descripcion: 'La columna "Última prueba" de estudio/progreso.md pasa a la cita de sus casillas, y se quita',
  migrar(raiz) {
    const v = cargarFresco('lib/vault.js');
    const fichero = path.join(v.baseAlumno(raiz), 'progreso.md');
    if (!fs.existsSync(fichero)) return;

    const original = fs.readFileSync(fichero, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const sinCasilla = [];
    let columna = -1;   // índice de `Última prueba` en la tabla en curso; -1 fuera de una tabla que la tenga
    const lineas = original.replace(/\r\n/g, '\n').split('\n').map(linea => {
      if (!/^\s*\|/.test(linea)) { columna = -1; return linea; }
      const celdas = celdasDe(linea);
      if (columna < 0) {
        columna = celdas.findIndex((c, i) => i > 0 && i < celdas.length - 1 && COLUMNA.test(c.trim()));
        if (columna < 0) return linea;
      }
      if (!/^\s*\[\[/.test(celdas[1] || '')) return celdas.filter((_, i) => i !== columna).join('|');   // cabecera o separador

      const prueba = (celdas[columna] || '').trim();
      const hayPrueba = !VACIA.test(prueba);
      let usada = false;
      const nuevas = celdas.map((celda, i) => {
        if (i <= 1 || i === columna || i === celdas.length - 1) return celda;
        if (!hayPrueba || !ESTADO.test(celda)) return celda;
        if (celda.includes(MARCA_008)) { usada = true; return ` ${celda.trim().replace(MARCA_008, ` · ${prueba}`)} `; }
        if (!celda.includes('·')) { usada = true; return ` ${celda.trim()} · ${prueba} `; }
        return celda;
      });
      if (hayPrueba && !usada) sinCasilla.push(`- ${celdas[1].trim().replace(/\\\|/g, '|')}: ${prueba.replace(/\\\|/g, '|')}`);
      return nuevas.filter((_, i) => i !== columna).join('|');
    });

    let texto = lineas.join('\n');
    if (texto === original.replace(/\r\n/g, '\n')) return;   // idempotente: ya no hay columna que quitar
    if (sinCasilla.length) {
      texto = `${texto.replace(/\n*$/, '')}\n\n## Última prueba, de antes de la 0.26\n\n`
        + 'Lo que decía la columna "Última prueba" cuando no cabía en ninguna casilla:\n\n'
        + `${sinCasilla.join('\n')}\n`;
    }
    fs.writeFileSync(fichero, texto.replace(/\n/g, eol));
  },
};
