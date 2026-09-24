'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const g = require('./lib/git');

// Recupera lo que falte en un curso sin pisar nunca nada que exista. Por orden de preferencia:
//  1. si el fichero está suelto en la raíz del curso (lo movieron), vuelve a su sitio con su contenido;
//  2. si git lo tiene guardado, se restaura la última versión guardada;
//  3. si es una carpeta del alumno, se crea vacía.
function reparar(raiz) {
  const resultado = { devueltos: [], restaurados: [], recreadas: [], sinArreglo: [] };
  // En un entorno restringido que no deja ejecutar git (#36), se repara igual lo que no necesita git.
  let esRepo = false;
  try { esRepo = g.esRepo(raiz); } catch (error) { if (error.code !== 'EPERM') throw error; resultado.sinGit = true; }

  for (const pieza of v.piezasAusentes(raiz)) {
    const destino = path.join(raiz, ...pieza.ruta.split('/'));
    if (fs.existsSync(destino)) continue;   // ya volvió al recuperar su carpeta
    const suelto = path.join(raiz, path.posix.basename(pieza.ruta));

    if (pieza.tipo === 'fichero' && suelto !== destino && fs.existsSync(suelto) && fs.statSync(suelto).isFile()) {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.renameSync(suelto, destino);
      resultado.devueltos.push(pieza.ruta);
    } else if (esRepo && g.intentarGit(raiz, ['cat-file', '-e', `HEAD:${pieza.ruta}`]).ok) {
      g.git(raiz, ['checkout', 'HEAD', '--', pieza.ruta]);
      resultado.restaurados.push(pieza.ruta);
    } else if (pieza.tipo === 'carpeta') {
      fs.mkdirSync(destino, { recursive: true });
      fs.writeFileSync(path.join(destino, '.gitkeep'), '');
      resultado.recreadas.push(pieza.ruta);
    } else {
      resultado.sinArreglo.push(pieza.ruta);
    }
  }
  return resultado;
}

function cli(args, raiz) {
  const r = reparar(raiz);
  const total = r.devueltos.length + r.restaurados.length + r.recreadas.length;
  if (!total && !r.sinArreglo.length) { console.log('No faltaba nada.'); return 0; }
  if (r.devueltos.length) console.log(`Devuelto a su sitio (con lo que tenía escrito): ${r.devueltos.join(', ')}`);
  if (r.restaurados.length) console.log(`Recuperado de la última vez que se guardó: ${r.restaurados.join(', ')}`);
  if (r.recreadas.length) console.log(`Carpeta creada de nuevo, vacía: ${r.recreadas.join(', ')}`);
  if (r.sinArreglo.length) { console.log(`No he podido recuperar: ${r.sinArreglo.join(', ')}. Prueba a actualizar el kit.`); return 1; }
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'reparar.js');

module.exports = { reparar, cli };
