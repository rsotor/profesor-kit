'use strict';
// Prueba de actualización: comprueba que un curso que se quedó en una versión antigua del kit se
// actualiza sin problemas a la copia de trabajo actual. No usa ningún LLM (es pura mecánica de
// ficheros y git): a diferencia de pruebas/prueba-real.js, sí corre en el CI, en cada PR.
//
// Punto de partida: la release anterior a esta copia (la más alta por debajo de `.kit/VERSION`), entera, sacada
// de su etiqueta con `git archive`: su motor y el curso que dejó su prueba real (`pruebas/curso-ejemplo/` y
// `resultado/` de esa etiqueta). Nada de esta copia: si no, el curso "viejo" saldría con cosas de la versión
// nueva y la prueba mediría eso. Se actualiza con `actualizar.js --aplicar --origen <esta copia de trabajo>`,
// ejecutándolo desde dentro del propio curso reconstruido — como lo haría un alumno.
//
// Es la garantía de actualizar en secuencia: cada release se prueba desde la anterior, y un alumno que va varias
// versiones atrás pasa por todas, una a una (actualizar.js#aplicarSiguiente).
//
//   node pruebas/prueba-actualizar.js
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const { carpetaTemporal, borrar, copiar, iniciarGit, ejecutarNodo, comprobarJson } = require('./lib/montaje');
const { sinPie } = require('../.kit/herramientas/lib/indice');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO_REL = path.join('pruebas', 'curso-ejemplo');

function git(trabajo, args) {
  const r = spawnSync('git', args, { cwd: trabajo, encoding: 'utf8' });
  return { ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// '0.10.0' es más nueva que '0.9.1', aunque como texto no lo parezca (mismo criterio que
// actualizar.js#esMasNueva, que no se exporta: se repite aquí, es una comparación trivial).
function esMasNueva(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
}

// Etiquetas `vX.Y.Z` de este repo, ordenadas de más antigua a más nueva.
function etiquetasDisponibles(trabajo) {
  const r = git(trabajo, ['tag', '-l', 'v*']);
  if (!r.ok) return [];
  return r.salida.split(/\r?\n/).filter(t => /^v\d+\.\d+\.\d+$/.test(t)).sort((a, b) => (esMasNueva(a.slice(1), b.slice(1)) ? 1 : -1));
}

// La release anterior a `version`: la más alta de las que son estrictamente más viejas. null si no hay ninguna.
function etiquetaAnterior(version, etiquetas) {
  const anteriores = etiquetas.filter(t => esMasNueva(version, t.slice(1)));
  return anteriores.length ? anteriores[anteriores.length - 1] : null;
}

function extraerEtiqueta(trabajo, etiqueta, destino) {
  fs.mkdirSync(destino, { recursive: true });
  const archivo = spawnSync('git', ['archive', etiqueta], { cwd: trabajo, encoding: 'buffer', maxBuffer: 1024 * 1024 * 1024 });
  if (archivo.status !== 0) throw new Error(`git archive ${etiqueta} falló: ${(archivo.stderr || Buffer.from('')).toString('utf8')}`);
  const tar = spawnSync('tar', ['-x', '-C', destino], { input: archivo.stdout });
  if (tar.status !== 0) throw new Error(`tar -x falló al extraer ${etiqueta}: ${(tar.stderr || Buffer.from('')).toString('utf8')}`);
}

// Los que guardar.js reescribe en cada guardado (lib/generados.js, lib/perfil.js, lib/indice.js): de esos solo
// se comprueba que siguen ahí, no su contenido.
const GENERADOS = new Set(['estudio/inicio.md', 'estudio/pendientes.md', 'estudio/formulario.md', 'estudio/auditoria-del-material.md',
  'estudio/mi-perfil.md', 'estudio/ejercicios/_index.md']);
const DIARIO = 'config/diario.md';
const AJUSTES = 'config/ajustes.json';

// Todos los ficheros bajo `estudio/` y `config/` (lo del alumno): tamaño y huella del contenido (issue #39, H10:
// con solo el tamaño, un cambio que no encoge pasaba). El pie de navegación de las sesiones no cuenta: lo pone
// guardar.js. El diario y los ajustes se guardan enteros, que se comparan de otra forma.
function huellaDatos(raiz) {
  const huella = new Map();
  for (const carpeta of ['estudio', 'config']) {
    const recorrer = dir => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== '.obsidian') recorrer(abs); continue; }
        const rel = path.relative(raiz, abs).split(path.sep).join('/');
        const bytes = fs.readFileSync(abs);
        const contenido = rel.endsWith('.md') ? sinPie(bytes.toString('utf8')) : bytes;
        const dato = { tamano: bytes.length, hash: crypto.createHash('sha256').update(contenido).digest('hex') };
        if (rel === DIARIO || rel === AJUSTES) dato.texto = bytes.toString('utf8');
        huella.set(rel, dato);
      }
    };
    recorrer(path.join(raiz, carpeta));
  }
  return huella;
}

// Una migración conocida puede renombrar un fichero (p. ej. añadiendo `-anterior` antes de la
// extensión, ver migraciones/004): se acepta como equivalente si el tamaño no baja.
function variantesRenombradas(rel) {
  const punto = rel.lastIndexOf('.');
  const base = punto < 0 ? rel : rel.slice(0, punto);
  const ext = punto < 0 ? '' : rel.slice(punto);
  return [`${base}-anterior${ext}`];
}

const clavesDe = texto => { try { return Object.keys(JSON.parse(texto)); } catch { return []; } };

// Qué se ha perdido o cambiado de lo del alumno. Sin migraciones de por medio (`migro`), una actualización no
// cambia ni un byte de sus notas; con ellas, puede reescribir, pero no quitar (no encoger).
function comprobarNoSePierdeNada(antes, despues, { migro = false } = {}) {
  const problemas = [];
  for (const [rel, a] of antes) {
    const d = despues.get(rel);
    if (!d) {
      const renombrado = variantesRenombradas(rel).find(v => despues.has(v) && despues.get(v).tamano >= a.tamano);
      if (!renombrado) problemas.push(`${rel} ha desaparecido (y no hay ningún -anterior que lo explique)`);
      continue;
    }
    if (GENERADOS.has(rel) || a.hash === d.hash) continue;
    if (rel === DIARIO) {
      if (!d.texto.replace(/\r\n/g, '\n').startsWith(a.texto.replace(/\r\n/g, '\n').trimEnd())) problemas.push(`${rel} ha perdido líneas: solo puede crecer`);
      continue;
    }
    if (rel === AJUSTES) {
      const faltan = clavesDe(a.texto).filter(k => !clavesDe(d.texto).includes(k));
      if (faltan.length) problemas.push(`${rel} ha perdido ajustes: ${faltan.join(', ')}`);
      continue;
    }
    if (!migro) problemas.push(`${rel} ha cambiado, y ninguna migración lo explica`);
    else if (d.tamano < a.tamano) problemas.push(`${rel} ha encogido (${a.tamano} → ${d.tamano} bytes)`);
  }
  return problemas;
}

function skillsInstaladas(raiz) {
  const dir = path.join(raiz, '.claude', 'skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => fs.statSync(path.join(dir, n)).isDirectory()).sort();
}

// Reconstruye, en `destino`, el curso tal como lo dejó la prueba real de la versión vieja: el motor de
// `origenViejo` (esa versión, extraída de su etiqueta) + su pruebas/curso-ejemplo/ (config y portada) + su
// resultado/ (estudio/ y config/alumno.md), con `version_datos` de esa versión.
function reconstruirCursoViejo({ origenViejo, versionDatos, destino }) {
  const datosCurso = path.join(origenViejo, EJEMPLO_REL);
  const resultadoDir = path.join(datosCurso, 'resultado');
  fs.mkdirSync(destino, { recursive: true });
  const motor = JSON.parse(fs.readFileSync(path.join(origenViejo, '.kit', 'motor.json'), 'utf8'));
  for (const f of motor.ficheros) copiar(path.join(origenViejo, ...f.split('/')), path.join(destino, ...f.split('/')));
  ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'preparar-curso.js'), ['--subir', 'no', '--nombre', 'Finanzas personales para empezar'], destino);

  for (const rel of ['config', 'README.md']) copiar(path.join(datosCurso, rel), path.join(destino, rel));
  if (fs.existsSync(resultadoDir)) {
    copiar(path.join(resultadoDir, 'estudio'), path.join(destino, 'estudio'));
    if (fs.existsSync(path.join(resultadoDir, 'config', 'alumno.md'))) copiar(path.join(resultadoDir, 'config', 'alumno.md'), path.join(destino, 'config', 'alumno.md'));
  } else {
    copiar(path.join(datosCurso, 'estudio'), path.join(destino, 'estudio'));
  }
  fs.rmSync(path.join(destino, 'estudio', 'inbox'), { recursive: true, force: true });
  fs.mkdirSync(path.join(destino, 'estudio', 'inbox'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'estudio', 'inbox', '.gitkeep'), '');

  const ficheroAjustes = path.join(destino, 'config', 'ajustes.json');
  const ajustes = JSON.parse(fs.readFileSync(ficheroAjustes, 'utf8'));
  ajustes.version_datos = versionDatos;
  fs.writeFileSync(ficheroAjustes, JSON.stringify(ajustes, null, 2) + '\n');

  ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'instalar-skills.js'), [], destino);
  iniciarGit(destino);
  return destino;
}

// Ejecuta `actualizar.js --aplicar --origen <trabajoActual>` tal como lo haría el curso, desde dentro
// de sí mismo, con SU PROPIA copia (antigua) de la herramienta. Y después el guardado con el que termina
// /actualizar, ya con el motor nuevo: hasta la 0.22.3, actualizar.js hacía su guardado final con el código viejo
// (los generados salían como los hacía la versión vieja) y lo que el alumno ve es lo de después de /actualizar.
function ejecutarActualizacion(raizViejo, trabajoActual) {
  const r = spawnSync(process.execPath, [path.join(raizViejo, '.kit', 'herramientas', 'actualizar.js'), '--aplicar', '--origen', trabajoActual],
    { cwd: raizViejo, encoding: 'utf8' });
  const salida = ((r.stdout || '') + (r.stderr || '')).trim();
  if (r.status !== 0) return { ok: false, salida };
  const cierre = spawnSync(process.execPath, [path.join(raizViejo, '.kit', 'herramientas', 'guardar.js'), 'config: al día tras actualizar'],
    { cwd: raizViejo, encoding: 'utf8' });
  return { ok: cierre.status === 0, salida: [salida, ((cierre.stdout || '') + (cierre.stderr || '')).trim()].filter(Boolean).join('\n') };
}

// Inyectables para los tests: así se puede probar la lógica sin depender de que existan etiquetas de
// verdad ni de clonar el repo real.
function ejecutar({ trabajoActual = RAIZ_KIT, buscarEtiquetas = etiquetasDisponibles, extraer = extraerEtiqueta } = {}) {
  const version = fs.readFileSync(path.join(trabajoActual, '.kit', 'VERSION'), 'utf8').trim();
  const etiqueta = etiquetaAnterior(version, buscarEtiquetas(trabajoActual));
  if (!etiqueta) return { hecho: false, ok: false, motivo: `No hay ninguna release anterior a la ${version} (¿checkout superficial sin --fetch-depth 0?). No se puede reconstruir la versión anterior.` };

  const origenViejo = carpetaTemporal();
  const raizViejo = carpetaTemporal();
  try {
    extraer(trabajoActual, etiqueta, origenViejo);
    if (!fs.existsSync(path.join(origenViejo, EJEMPLO_REL, 'resultado', 'RESUMEN.md'))) {
      return { hecho: false, ok: false, motivo: `La ${etiqueta} no trae ${EJEMPLO_REL.split(path.sep).join('/')}/resultado/: no hay curso de esa versión del que partir.` };
    }
    const versionDatosVieja = JSON.parse(fs.readFileSync(path.join(origenViejo, '.kit', 'motor.json'), 'utf8')).version_datos;
    const versionDatosNueva = JSON.parse(fs.readFileSync(path.join(trabajoActual, '.kit', 'motor.json'), 'utf8')).version_datos;
    reconstruirCursoViejo({ origenViejo, versionDatos: versionDatosVieja, destino: raizViejo });

    const antesInforme = comprobarJson(raizViejo);
    const antesHuella = huellaDatos(raizViejo);
    const antesSkills = skillsInstaladas(raizViejo);

    const r = ejecutarActualizacion(raizViejo, trabajoActual);

    const despuesInforme = comprobarJson(raizViejo);
    const despuesHuella = huellaDatos(raizViejo);
    const despuesSkills = skillsInstaladas(raizViejo);
    const perdidos = comprobarNoSePierdeNada(antesHuella, despuesHuella, { migro: versionDatosNueva > versionDatosVieja });
    const skillsActuales = fs.readdirSync(path.join(trabajoActual, '.kit', 'skills')).sort();

    const problemas = [];
    if (!r.ok) problemas.push(`actualizar.js --aplicar terminó con error: ${r.salida}`);
    if (despuesInforme.errores.length > antesInforme.errores.length) problemas.push(`comprobar.js tiene más errores tras actualizar (${antesInforme.errores.length} → ${despuesInforme.errores.length})`);
    if (perdidos.length) problemas.push(...perdidos);
    if (JSON.stringify(despuesSkills) !== JSON.stringify(skillsActuales)) problemas.push(`las skills instaladas no coinciden con las del motor actual: tiene ${despuesSkills.join(', ') || 'ninguna'}, esperaba ${skillsActuales.join(', ')}`);

    return {
      hecho: true, ok: problemas.length === 0, version, etiqueta,
      antesErrores: antesInforme.errores.length, despuesErrores: despuesInforme.errores.length,
      antesSkills, despuesSkills, salidaActualizar: r.salida, problemas,
    };
  } finally {
    borrar(origenViejo);
    borrar(raizViejo);
  }
}

function cli() {
  const r = ejecutar();
  if (!r.hecho) { console.log(r.motivo); return r.ok === false ? 1 : 0; }
  console.log(`De la release anterior (${r.etiqueta}, con el curso de su prueba real) a esta copia (${r.version})`);
  console.log(`comprobar.js: ${r.antesErrores} error(es) antes → ${r.despuesErrores} después`);
  console.log(`Skills antes: ${r.antesSkills.join(', ') || 'ninguna'} · después: ${r.despuesSkills.join(', ') || 'ninguna'}`);
  if (r.problemas.length) { console.log('\nProblemas encontrados:'); for (const p of r.problemas) console.log(`  ✗ ${p}`); }
  else console.log('\nLa actualización deja el curso sano: nada del alumno se ha perdido y las skills están al día.');
  return r.ok ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exit(cli());
  } catch (error) {
    console.error(`prueba-actualizar.js: fallo inesperado: ${error.stack || error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ejecutar, cli, esMasNueva, etiquetasDisponibles, etiquetaAnterior, extraerEtiqueta,
  huellaDatos, comprobarNoSePierdeNada, reconstruirCursoViejo, skillsInstaladas,
};
