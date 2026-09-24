'use strict';
const path = require('node:path');

// Ver 004-…: la ejecuta el actualizar.js de la versión vieja, con sus piezas viejas en memoria.
function cargarFresco(rel) {
  const herramientas = path.dirname(__dirname) + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
  return require(path.join(path.dirname(__dirname), ...rel.split('/')));
}

// Formato v6 (E1, repaso espaciado): cada flashcard de una sesión estudiada lleva debajo sus casillas (✅ la sabía,
// ❌ no la sabía) y la línea de su caja, y config/repaso.json guarda en qué caja está y cuándo vuelve. Solo añade
// líneas: el texto de las tarjetas no cambia. Lo de las sesiones sin estudiar entra cuando el alumno las marque.
module.exports = {
  descripcion: 'Las flashcards de las sesiones estudiadas entran en el repaso espaciado (cinco cajas)',
  migrar(raiz) {
    const indice = cargarFresco('lib/indice.js');
    const repaso = cargarFresco('lib/repaso.js');
    const estudiadas = new Set(indice.leerSesiones(raiz).filter(s => s.estudiada).map(s => s.id));
    repaso.procesar(raiz, { hoy: new Date().toISOString().slice(0, 10), estudiadas });
  },
};
