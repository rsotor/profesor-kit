'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const g = require('./lib/git');

const SOLO_DEL_KIT = ['docs', '.github', '.githooks', 'CONTRIBUTING.md'];
const MARCA_README_DEL_KIT = '# profesor-kit';

function prepararCurso({ raiz, subir, llm = 'claude-code', nombre = '' }) {
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

  // El README del kit se sustituye por la portada del curso (visible en GitHub desde el primer push).
  // Si el README ya es del alumno, no se toca.
  let readmeCreado = false;
  const readme = path.join(raiz, 'README.md');
  const esDelKit = fs.existsSync(readme) && fs.readFileSync(readme, 'utf8').startsWith(MARCA_README_DEL_KIT);
  if (!fs.existsSync(readme) || esDelKit) {
    const plantilla = fs.readFileSync(path.join(raiz, '.kit', 'plantillas', 'readme-del-curso.md'), 'utf8');
    fs.writeFileSync(readme, plantilla
      .replace('{{NOMBRE_DEL_CURSO}}', nombre || 'Mi curso')
      .replace('{{DE_QUE_VA}}', '_Pendiente: lo rellena mi profesor al configurar el curso._')
      .replace('{{TEMARIO}}', '_Pendiente._')
      .replace('{{ESTADO}}', 'Sin empezar.')
      .replace('{{ATAJO}}', '<mi palabra>'));
    readmeCreado = true;
  }

  const ficheroAjustes = path.join(raiz, 'config', 'ajustes.json');
  const ajustesCreados = !fs.existsSync(ficheroAjustes);
  if (ajustesCreados) {
    v.escribirAjustes(raiz, { ...structuredClone(v.AJUSTES_POR_DEFECTO), subir_a_github: subir, llm, nombre_curso: nombre, version_datos: motor.version_datos });
  }
  return { borrado, remotoEliminado, ajustesCreados, readmeCreado };
}

function cli(args, raiz) {
  const valor = nombre => { const i = args.indexOf(nombre); return i >= 0 ? args[i + 1] : undefined; };
  const subir = valor('--subir');
  if (subir !== 'si' && subir !== 'no') { console.error('Uso: node .kit/herramientas/preparar-curso.js --subir si|no [--nombre "<nombre del curso>"] [--llm <llm>]'); return 2; }
  const r = prepararCurso({ raiz, subir: subir === 'si', llm: valor('--llm'), nombre: valor('--nombre') });
  console.log(`Curso preparado. Borrado: ${r.borrado.join(', ') || 'nada'} · remoto del kit eliminado: ${r.remotoEliminado ? 'sí' : 'no'} · ajustes creados: ${r.ajustesCreados ? 'sí' : 'ya existían'}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'preparar-curso.js');

module.exports = { prepararCurso, cli };
