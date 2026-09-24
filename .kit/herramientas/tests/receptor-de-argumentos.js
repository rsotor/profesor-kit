'use strict';
// Receptor de prueba para el lanzamiento en segundo plano (issue #39, H01): apunta en un fichero qué
// argumentos le llegaron y qué recibió por la entrada estándar, y no hace nada más.
//   node receptor-de-argumentos.js <fichero de salida> [argumentos…]
const fs = require('node:fs');
const [salida, ...args] = process.argv.slice(2);
let entrada = '';
try { entrada = fs.readFileSync(0, 'utf8'); } catch { /* sin entrada */ }
fs.writeFileSync(salida, JSON.stringify({ args, entrada }));
