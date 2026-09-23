'use strict';
// Prueba de actualización: comprueba que un curso que se quedó en una versión antigua del kit se
// actualiza sin problemas a la copia de trabajo actual. No usa ningún LLM (es pura mecánica de
// ficheros y git): a diferencia de pruebas/prueba-real.js, sí corre en el CI, en cada PR.
//
// Punto de partida: `pruebas/curso-ejemplo/resultado/` (lo que dejó la última prueba real) + la
// versión del kit que hay anotada en su RESUMEN.md. Con eso se reconstruye "el curso tal como se
// quedó" usando el motor de esa versión (`git archive v<versión>`, o la release anterior disponible
// si esa etiqueta no existe), y se actualiza con `actualizar.js --aplicar --origen <esta copia de
// trabajo>`, ejecutándolo desde dentro del propio curso reconstruido — como lo haría un alumno.
//
//   node pruebas/prueba-actualizar.js
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { carpetaTemporal, borrar, copiar, iniciarGit, ejecutarNodo, comprobarJson } = require('./lib/montaje');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const RESULTADO = path.join(EJEMPLO, 'resultado');

function git(trabajo, args) {
  const r = spawnSync('git', args, { cwd: trabajo, encoding: 'utf8' });
  return { ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

function versionDeResumen(resumen) {
  const m = /\*\*Versión del kit:\*\*\s*([0-9.]+)/.exec(resumen);
  return m ? m[1] : null;
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

// La etiqueta que mejor representa "la versión que produjo este resultado": exacta si existe; si no,
// la release publicada más reciente que sea igual o anterior; si tampoco hay ninguna, la más antigua
// que exista (mejor eso que nada, avisando). `null` si no hay ninguna etiqueta en absoluto.
function resolverEtiqueta(version, etiquetas) {
  const exacta = `v${version}`;
  if (etiquetas.includes(exacta)) return { etiqueta: exacta, motivo: null };
  if (!etiquetas.length) return null;
  const anteriores = etiquetas.filter(t => !esMasNueva(t.slice(1), version));
  if (anteriores.length) {
    const elegida = anteriores[anteriores.length - 1];
    return { etiqueta: elegida, motivo: `no existe la etiqueta ${exacta}; se usa la última release anterior disponible` };
  }
  return { etiqueta: etiquetas[0], motivo: `no hay ninguna release igual o anterior a la ${version}; se usa la más antigua que hay (${etiquetas[0]})` };
}

function extraerEtiqueta(trabajo, etiqueta, destino) {
  fs.mkdirSync(destino, { recursive: true });
  const archivo = spawnSync('git', ['archive', etiqueta], { cwd: trabajo, encoding: 'buffer', maxBuffer: 1024 * 1024 * 1024 });
  if (archivo.status !== 0) throw new Error(`git archive ${etiqueta} falló: ${(archivo.stderr || Buffer.from('')).toString('utf8')}`);
  const tar = spawnSync('tar', ['-x', '-C', destino], { input: archivo.stdout });
  if (tar.status !== 0) throw new Error(`tar -x falló al extraer ${etiqueta}: ${(tar.stderr || Buffer.from('')).toString('utf8')}`);
}

// Todos los ficheros bajo `estudio/` y `config/` (lo del alumno), con su tamaño: para comprobar, tras
// actualizar, que no ha desaparecido ni se ha vaciado nada que no debiera.
function huellaDatos(raiz) {
  const huella = new Map();
  for (const carpeta of ['estudio', 'config']) {
    const base = path.join(raiz, carpeta);
    const recorrer = dir => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== '.obsidian') recorrer(abs); }
        else huella.set(path.relative(raiz, abs).split(path.sep).join('/'), fs.statSync(abs).size);
      }
    };
    recorrer(base);
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

function comprobarNoSePierdeNada(antes, despues) {
  const problemas = [];
  for (const [rel, tamano] of antes) {
    if (despues.has(rel)) {
      if (despues.get(rel) < tamano) problemas.push(`${rel} ha encogido (${tamano} → ${despues.get(rel)} bytes)`);
      continue;
    }
    const renombrado = variantesRenombradas(rel).find(v => despues.has(v) && despues.get(v) >= tamano);
    if (!renombrado) problemas.push(`${rel} ha desaparecido (y no hay ningún -anterior que lo explique)`);
  }
  return problemas;
}

function skillsInstaladas(raiz) {
  const dir = path.join(raiz, '.claude', 'skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => fs.statSync(path.join(dir, n)).isDirectory()).sort();
}

// Reconstruye, en `destino`, el curso tal como se quedó al producir `resultadoDir`: el motor de
// `origenViejo` (una copia de trabajo del kit en la versión antigua) + config/estudio del ejemplo +
// lo que hubiera en resultadoDir (estudio/ y config/alumno.md), con `version_datos` de esa versión.
function reconstruirCursoViejo({ origenViejo, resultadoDir, versionDatos, destino }) {
  fs.mkdirSync(destino, { recursive: true });
  const motor = JSON.parse(fs.readFileSync(path.join(origenViejo, '.kit', 'motor.json'), 'utf8'));
  for (const f of motor.ficheros) copiar(path.join(origenViejo, ...f.split('/')), path.join(destino, ...f.split('/')));
  ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'preparar-curso.js'), ['--subir', 'no', '--nombre', 'Finanzas personales para empezar'], destino);

  for (const rel of ['config', 'README.md']) copiar(path.join(EJEMPLO, rel), path.join(destino, rel));
  if (fs.existsSync(resultadoDir)) {
    copiar(path.join(resultadoDir, 'estudio'), path.join(destino, 'estudio'));
    if (fs.existsSync(path.join(resultadoDir, 'config', 'alumno.md'))) copiar(path.join(resultadoDir, 'config', 'alumno.md'), path.join(destino, 'config', 'alumno.md'));
  } else {
    copiar(path.join(EJEMPLO, 'estudio'), path.join(destino, 'estudio'));
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
// de sí mismo, con SU PROPIA copia (antigua) de la herramienta.
function ejecutarActualizacion(raizViejo, trabajoActual) {
  const r = spawnSync(process.execPath, [path.join(raizViejo, '.kit', 'herramientas', 'actualizar.js'), '--aplicar', '--origen', trabajoActual],
    { cwd: raizViejo, encoding: 'utf8' });
  return { ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// Inyectables para los tests: así se puede probar la lógica sin depender de que existan etiquetas de
// verdad ni de clonar el repo real.
function ejecutar({
  trabajoActual = RAIZ_KIT, resultadoDir = RESULTADO,
  buscarEtiquetas = etiquetasDisponibles, extraer = extraerEtiqueta,
} = {}) {
  const ficheroResumen = path.join(resultadoDir, 'RESUMEN.md');
  if (!fs.existsSync(ficheroResumen)) {
    return { hecho: false, motivo: 'Todavía no existe pruebas/curso-ejemplo/resultado/: nadie ha ejecutado `npm run prueba-real` con un LLM de verdad. No hay nada que actualizar; se sale sin error.' };
  }
  const version = versionDeResumen(fs.readFileSync(ficheroResumen, 'utf8'));
  if (!version) return { hecho: false, ok: false, motivo: 'RESUMEN.md no dice "**Versión del kit:**": no se puede saber de qué versión partir.' };

  const etiquetas = buscarEtiquetas(trabajoActual);
  const resuelta = resolverEtiqueta(version, etiquetas);
  if (!resuelta) return { hecho: false, ok: false, motivo: 'Este repo no tiene ninguna etiqueta vX.Y.Z (¿checkout superficial sin --fetch-depth 0?). No se puede reconstruir una versión antigua.' };

  const origenViejo = carpetaTemporal();
  const raizViejo = carpetaTemporal();
  try {
    extraer(trabajoActual, resuelta.etiqueta, origenViejo);
    const versionDatosVieja = JSON.parse(fs.readFileSync(path.join(origenViejo, '.kit', 'motor.json'), 'utf8')).version_datos;
    reconstruirCursoViejo({ origenViejo, resultadoDir, versionDatos: versionDatosVieja, destino: raizViejo });

    const antesInforme = comprobarJson(raizViejo);
    const antesHuella = huellaDatos(raizViejo);
    const antesSkills = skillsInstaladas(raizViejo);

    const r = ejecutarActualizacion(raizViejo, trabajoActual);

    const despuesInforme = comprobarJson(raizViejo);
    const despuesHuella = huellaDatos(raizViejo);
    const despuesSkills = skillsInstaladas(raizViejo);
    const perdidos = comprobarNoSePierdeNada(antesHuella, despuesHuella);
    const skillsActuales = fs.readdirSync(path.join(trabajoActual, '.kit', 'skills')).sort();

    const problemas = [];
    if (!r.ok) problemas.push(`actualizar.js --aplicar terminó con error: ${r.salida}`);
    if (despuesInforme.errores.length > antesInforme.errores.length) problemas.push(`comprobar.js tiene más errores tras actualizar (${antesInforme.errores.length} → ${despuesInforme.errores.length})`);
    if (perdidos.length) problemas.push(...perdidos);
    if (JSON.stringify(despuesSkills) !== JSON.stringify(skillsActuales)) problemas.push(`las skills instaladas no coinciden con las del motor actual: tiene ${despuesSkills.join(', ') || 'ninguna'}, esperaba ${skillsActuales.join(', ')}`);

    return {
      hecho: true, ok: problemas.length === 0, version, etiqueta: resuelta.etiqueta, motivoEtiqueta: resuelta.motivo,
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
  console.log(`Etiqueta usada como versión antigua: ${r.etiqueta}${r.motivoEtiqueta ? ` (${r.motivoEtiqueta})` : ''}`);
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
  ejecutar, cli, versionDeResumen, esMasNueva, etiquetasDisponibles, resolverEtiqueta, extraerEtiqueta,
  huellaDatos, comprobarNoSePierdeNada, reconstruirCursoViejo, skillsInstaladas,
};
