'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const g = require('./lib/git');

const SOLO_DEL_KIT = ['docs', '.github', 'README.md'];

function prepararCurso({ raiz, subir, llm = 'claude-code' }) {
  const motor = v.leerMotor(raiz);

  const borrado = [];
  for (const nombre of SOLO_DEL_KIT) {
    const ruta = path.join(raiz, nombre);
    if (fs.existsSync(ruta)) { fs.rmSync(ruta, { recursive: true, force: true, maxRetries: 3 }); borrado.push(nombre); }
  }

  let remotoEliminado = false;
  if (g.esRepo(raiz)) {
    const url = g.urlOrigen(raiz);
    if (url && url.includes(motor.repo)) { g.git(raiz, ['remote', 'remove', 'origin']); remotoEliminado = true; }
  }

  const ficheroAjustes = path.join(raiz, 'config', 'ajustes.json');
  const ajustesCreados = !fs.existsSync(ficheroAjustes);
  if (ajustesCreados) {
    v.escribirAjustes(raiz, { ...structuredClone(v.AJUSTES_POR_DEFECTO), subir_a_github: subir, llm, version_datos: motor.version_datos });
  }
  return { borrado, remotoEliminado, ajustesCreados };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const valor = nombre => { const i = args.indexOf(nombre); return i >= 0 ? args[i + 1] : undefined; };
  const subir = valor('--subir');
  if (subir !== 'si' && subir !== 'no') { console.error('Uso: node .kit/herramientas/preparar-curso.js --subir si|no [--llm <nombre>]'); process.exit(2); }
  const r = prepararCurso({ raiz: path.resolve(__dirname, '..', '..'), subir: subir === 'si', llm: valor('--llm') });
  console.log(`Curso preparado. Borrado: ${r.borrado.join(', ') || 'nada'} · remoto del kit eliminado: ${r.remotoEliminado ? 'sí' : 'no'} · ajustes creados: ${r.ajustesCreados ? 'sí' : 'ya existían'}`);
}

module.exports = { prepararCurso };
