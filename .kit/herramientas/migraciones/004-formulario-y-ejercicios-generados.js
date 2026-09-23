'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('../lib/vault');
const generados = require('../lib/generados');

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
    conservarSiNoCoincide(raiz, `${v.CARPETA_ALUMNO}/formulario.md`, generados.markdownFormulario, `${v.CARPETA_ALUMNO}/formulario-anterior.md`);
    conservarSiNoCoincide(raiz, `${v.CARPETA_ALUMNO}/ejercicios/_index.md`, generados.markdownEjercicios, `${v.CARPETA_ALUMNO}/ejercicios/_index-anterior.md`);
  },
};
