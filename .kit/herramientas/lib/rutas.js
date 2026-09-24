'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Una sola forma de decidir si una ruta que viene de un fichero (motor.json, el manifiesto de las skills,
// config/estructura.json) es segura antes de escribir o borrar con ella (issue #39, H02). Las rutas del kit
// son siempre relativas y con `/`: una `\`, una unidad (`C:`), una ruta absoluta, `..`, `.` o un tramo vacío
// no son rutas del kit, se escriban en Windows o en Mac. `.git` y las carpetas protegidas se comparan sin
// distinguir mayúsculas: en Windows y en macOS `CONFIG` es `config`.
function motivoRutaNoSegura(ruta, { protegidas = [], unTramo = false } = {}) {
  if (typeof ruta !== 'string' || ruta === '') return 'no es una ruta';
  if (/[\\\0]/.test(ruta)) return 'lleva "\\" o un carácter nulo (las rutas del kit van con "/")';
  if (ruta.startsWith('/') || /^[A-Za-z]:/.test(ruta)) return 'es una ruta absoluta';
  const tramos = ruta.split('/');
  if (unTramo && tramos.length > 1) return 'tiene que ser un solo nombre, sin "/"';
  if (tramos.some(t => t === '' || t === '.' || t === '..')) return 'sale de su sitio o tiene un tramo vacío';
  if (tramos.some(t => t.includes(':'))) return 'lleva ":"';
  if (tramos.some(t => t.toLowerCase() === '.git')) return 'toca .git';
  const primero = tramos[0].toLowerCase();
  if (protegidas.some(p => p.toLowerCase() === primero)) return `toca ${tramos[0]}, que es del alumno`;
  return null;
}

// Además de la forma, el sitio real: `rel` dentro de `base`, siguiendo enlaces simbólicos si ya existen (un
// enlace dentro de la carpeta puede apuntar fuera).
function estaDentro(base, rel) {
  const real = p => { try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } };
  const raizReal = real(base);
  const destino = real(path.join(base, ...rel.split('/')));
  return destino !== raizReal && destino.startsWith(raizReal + path.sep);
}

module.exports = { motivoRutaNoSegura, estaDentro };
