'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Una migración la ejecuta el `actualizar.js` de la versión VIEJA, que ya tiene en memoria sus propias piezas
// (`lib/indice.js`, `lib/vault.js`…). Un `require` normal devolvería esas piezas viejas aunque en disco ya estén
// las nuevas, y la migración fallaría (pasó de la 0.20 a la 0.21: "indice.tituloDe is not a function"). Por eso
// se olvida lo cargado de las herramientas y se carga de nuevo, desde disco, dentro de `migrar`.
function cargarFresco(rel) {
  const herramientas = path.dirname(__dirname) + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
  return require(path.join(path.dirname(__dirname), ...rel.split('/')));
}

// Formato v4: estudio/formulario.md y estudio/ejercicios/_index.md pasan a generarlos guardar.js (como ya
// pasaba con inicio.md, pendientes.md y auditoria-del-material.md), a partir de las notas de concepto. Un
// curso ya empezado puede tener ahí texto escrito a mano que la generación no reproduciría igual: si el
// contenido actual no es exactamente el que generaría el kit nuevo, se conserva con otro nombre (nunca se
// borra nada del alumno) y guardar.js escribe la versión generada la próxima vez que guarde.
function conservarSiNoCoincide(raiz, relActual, generar, relAnterior) {
  const actual = path.join(raiz, ...relActual.split('/'));
  if (!fs.existsSync(actual)) return false;
  if (fs.readFileSync(actual, 'utf8') === generar(raiz)) return false;   // ya es justo lo que generaría el kit
  const anterior = path.join(raiz, ...relAnterior.split('/'));
  if (fs.existsSync(anterior)) return false;   // ya se conservó en una vuelta anterior de esta misma migración
  fs.renameSync(actual, anterior);
  return true;
}

module.exports = {
  descripcion: 'estudio/formulario.md y estudio/ejercicios/_index.md pasan a generarlos guardar.js',
  migrar(raiz) {
    const v = cargarFresco('lib/vault.js');
    const generados = cargarFresco('lib/generados.js');
    conservarSiNoCoincide(raiz, `${v.CARPETA_ALUMNO}/formulario.md`, generados.markdownFormulario, `${v.CARPETA_ALUMNO}/formulario-anterior.md`);
    conservarSiNoCoincide(raiz, `${v.CARPETA_ALUMNO}/ejercicios/_index.md`, generados.markdownEjercicios, `${v.CARPETA_ALUMNO}/ejercicios/_index-anterior.md`);
  },
};
