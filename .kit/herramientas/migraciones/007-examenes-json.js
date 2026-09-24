'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Ver 004-…: la ejecuta el actualizar.js de la versión vieja, con sus piezas viejas en memoria.
function cargarFresco(rel) {
  const herramientas = path.dirname(__dirname) + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
  return require(path.join(path.dirname(__dirname), ...rel.split('/')));
}

// Formato v7 (examen tipo test, docs/planes/2026-09-25-examen-v1.md): la configuración del examen —opciones,
// resta_fallo, y las preguntas y el aprobado de cada tipo— pasa a config/examenes.json. Un curso ya empezado
// tenía su aprobado en config/curso.md: se copia al de módulo, para no cambiarle la nota a nadie a mitad de
// curso; curso.md no se toca (puede seguir teniendo esa clave, cursos.js la sigue leyendo como último respaldo).
module.exports = {
  descripcion: 'config/examenes.json con la configuración del examen tipo test; el aprobado de módulo hereda el de config/curso.md si lo había',
  migrar(raiz) {
    const examenes = cargarFresco('lib/examenes.js');
    const fichero = path.join(raiz, ...examenes.RUTA_CONFIG.split('/'));
    if (fs.existsSync(fichero)) return;   // idempotente: si ya existe (otra vuelta, o lo escribió el profesor), no se toca

    const cfg = structuredClone(examenes.POR_DEFECTO);
    const aprobadoCurso = examenes.aprobadoDeCurso(raiz);
    if (aprobadoCurso !== null) cfg.tipos.modulo.aprobado = aprobadoCurso;

    fs.mkdirSync(path.dirname(fichero), { recursive: true });
    fs.writeFileSync(fichero, JSON.stringify(cfg, null, 2) + '\n');
  },
};
