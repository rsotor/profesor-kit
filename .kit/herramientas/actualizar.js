'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const v = require('./lib/vault');
const g = require('./lib/git');
const { ejecutar: ejecutarProceso, explicar } = require('./lib/proceso');
const { guardar } = require('./guardar');
const { escanearSecretos } = require('./lib/secretos');
const { motivoRutaNoSegura } = require('./lib/rutas');
const { spawnSync } = require('node:child_process');

function validarMotor(ficheros) {
  for (const f of ficheros) {
    if (motivoRutaNoSegura(f)) throw new Error(`Ruta de motor no válida: ${f} (${motivoRutaNoSegura(f)})`);
    if (motivoRutaNoSegura(f, { protegidas: v.RUTAS_PROTEGIDAS })) throw new Error(`El motor no puede tocar datos del alumno: ${f}`);
  }
}

// `node <script>` no debería dar ENOENT ni EACCES en circunstancias normales (es el mismo intérprete que
// ya está corriendo esto), pero un entorno restringido puede negarse a lanzar procesos hijos sin más
// explicación: por eso pasa también por proceso.js, en vez de spawnSync a pelo.
function nodo(script, args, cwd) {
  return ejecutarProceso(process.execPath, [script, ...args], { cwd });
}

// comprobar.js --json sale con el código 1 cuando el curso tiene errores: eso no es un fallo del proceso,
// es su contrato (ver comprobar.js#cli). Lo que sí es un fallo real es que el proceso ni llegara a
// arrancar (permiso denegado, comando inexistente): ahí no hay stdout que parsear, solo lo dice `motivo`.
// Devuelve cada error como "regla · fichero": se compara cuáles hay, no cuántos (issue #39, H10). Si no, arreglar
// uno y romper otro distinto pasaría por "no empeora".
function erroresDe(dirKit, raiz) {
  const r = nodo(path.join(dirKit, '.kit', 'herramientas', 'comprobar.js'), ['--json', '--raiz', raiz], raiz);
  if (['permiso', 'no-existe'].includes(r.motivo)) throw new Error(`comprobar.js falló: ${explicar(r)}`);
  try {
    return JSON.parse(r.stdout).errores.map(e => `${e.regla} · ${e.fichero}`);
  } catch {
    throw new Error(`comprobar.js --json no devolvió un informe legible (llegaron ${r.stdout.length} bytes; el final: ${r.salida.slice(-300)})`);
  }
}

// Sin adaptador para un LLM que no es Claude Code, instalar-skills.js se niega a adivinar destino (ver
// instalar-skills.js): eso no es un fallo de la actualización, es que este curso aún no tiene su
// config/adaptador-llm.json. Se avisa y se sigue, en vez de deshacer la actualización entera por esto.
function reinstalarSkills(raiz) {
  const ajustes = v.leerAjustes(raiz);
  const adaptador = v.leerAdaptador(raiz, ajustes.llm);
  if (!adaptador && ajustes.llm && ajustes.llm !== 'claude-code') {
    console.log(`Aviso: no hay adaptador para "${ajustes.llm}"; no se han podido reinstalar las skills. Sigue .kit/ESTANDARES.md para escribir config/adaptador-llm.json y repite node .kit/herramientas/instalar-skills.js.`);
    return;
  }
  const r = nodo(path.join(raiz, '.kit', 'herramientas', 'instalar-skills.js'), [], raiz);
  if (!r.ok) throw new Error(`instalar-skills falló: ${explicar(r)}`);
}

function migracionesPendientes(raiz, desde) {
  const dir = path.join(raiz, '.kit', 'herramientas', 'migraciones');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(n => /^\d+-.+\.js$/.test(n))
    .map(n => ({ version: parseInt(n, 10), fichero: path.join(dir, n) }))
    .filter(m => m.version > desde)
    .sort((a, b) => a.version - b.version);
}

// Pone la fecha de modificación a "ahora" en todo lo copiado. En Windows, copiar un fichero conserva
// la fecha del original: si además pesa lo mismo que el que sustituye, git lo da por no modificado y
// ni lo guarda ni lo restaura. Con la fecha nueva, git siempre mira el contenido.
function tocar(ruta) {
  const ahora = new Date();
  const ficheros = fs.statSync(ruta).isDirectory() ? v.recorrer(ruta, () => true) : [ruta];
  for (const f of ficheros) fs.utimesSync(f, ahora, ahora);
}

// Deja el curso exactamente como estaba en `sha`. El índice se vacía antes para que git reescriba
// TODOS los ficheros en vez de fiarse de fechas y tamaños (ver `tocar`).
function restaurar(raiz, sha) {
  g.git(raiz, ['read-tree', '--empty']);
  g.git(raiz, ['reset', '-q', '--hard', sha]);
  g.git(raiz, ['clean', '-q', '-fd']);
}

// Ficheros del motor que el alumno también puede haber tocado: no se sustituyen, se les añade lo que falte.
// `.gitignore` es el caso: las reglas del kit son unas y las suyas (o las de otro LLM) son otras.
const SE_FUSIONAN = ['.gitignore'];
const patronesDe = texto => new Set(texto.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')));

function fusionarGitignore(actual, nuevo, version) {
  const tiene = patronesDe(actual);
  const faltan = [...patronesDe(nuevo)].filter(p => !tiene.has(p));
  if (!faltan.length) return actual;
  const eol = actual.includes('\r\n') ? '\r\n' : '\n';
  return actual.replace(/(\r?\n)*$/, '') + eol + eol + `# Reglas del kit añadidas al actualizar a la ${version}` + eol + faltan.join(eol) + eol;
}

function actualizar({ raiz, origen }) {
  const motorViejo = v.leerMotor(raiz);
  const motorNuevo = v.leerMotor(origen);
  validarMotor(motorNuevo.ficheros);

  const de = v.leerVersion(raiz);
  const a = v.leerVersion(origen);
  if (de === a) return { actualizado: false, motivo: 'al-dia', de, a, migraciones: [] };
  if (!g.esRepo(raiz)) return { actualizado: false, motivo: 'sin-repo', de, a, migraciones: [] };

  // Un posible secreto sin guardar no puede entrar en el commit previo: ese commit no se sube, pero el siguiente
  // guardado limpio subiría toda la historia, secreto incluido. Primero se quita; después se actualiza.
  const secretos = escanearSecretos(raiz);
  if (secretos.length) {
    return { actualizado: false, motivo: 'secreto', de, a, migraciones: [], detalle: `hay un posible secreto en ${[...new Set(secretos.map(x => x.fichero))].join(', ')}: quítalo antes de actualizar; no se toca nada` };
  }
  const antes = erroresDe(origen, raiz);
  // No es una copia aparte: es un commit de lo que hubiera sin guardar, para poder volver exactamente aquí.
  // Si no se pudo guardar (git sin identidad, por ejemplo), no se sigue: la vuelta atrás borraría lo que no
  // llegó a guardarse, y eso es lo único que la actualización promete no tocar nunca.
  const previo = guardar({ raiz, mensaje: `guardado antes de actualizar a ${a}`, permitirErrores: true });
  if (!previo.guardado && previo.motivo !== 'sin-cambios') {
    return { actualizado: false, motivo: 'sin-guardar', de, a, migraciones: [], detalle: `no se pudo guardar tu trabajo antes de actualizar (${previo.motivo}); no se toca nada` };
  }
  const sha = g.shaActual(raiz);

  const hechas = [];
  try {
    for (const f of motorViejo.ficheros) {
      if (!motorNuevo.ficheros.includes(f)) fs.rmSync(path.join(raiz, ...f.split('/')), { recursive: true, force: true, maxRetries: 3 });
    }
    for (const f of motorNuevo.ficheros) {
      const desde = path.join(origen, ...f.split('/'));
      const hasta = path.join(raiz, ...f.split('/'));
      if (!fs.existsSync(desde)) continue;
      if (SE_FUSIONAN.includes(f) && fs.existsSync(hasta)) {
        fs.writeFileSync(hasta, fusionarGitignore(fs.readFileSync(hasta, 'utf8'), fs.readFileSync(desde, 'utf8'), a));
        continue;
      }
      fs.rmSync(hasta, { recursive: true, force: true, maxRetries: 3 });
      fs.mkdirSync(path.dirname(hasta), { recursive: true });
      fs.cpSync(desde, hasta, { recursive: true });
      tocar(hasta);
    }

    // Lo que había en memoria de las herramientas es de la versión vieja: se olvida antes de migrar, para que
    // las migraciones (nuevas) carguen las piezas nuevas. Las migraciones también lo hacen por su cuenta.
    const herramientas = path.join(raiz, '.kit', 'herramientas') + path.sep;
    for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
    const ajustes = v.leerAjustes(raiz);
    for (const m of migracionesPendientes(raiz, ajustes.version_datos)) {
      require(m.fichero).migrar(raiz);
      hechas.push(m.version);
    }
    if (hechas.length) v.escribirAjustes(raiz, { ...v.leerAjustes(raiz), version_datos: motorNuevo.version_datos });

    reinstalarSkills(raiz);
    const nuevos = erroresDe(raiz, raiz).filter(e => !antes.includes(e));
    if (nuevos.length) throw new Error(`tras actualizar hay errores que antes no estaban: ${[...new Set(nuevos)].join('; ')}`);
  } catch (error) {
    restaurar(raiz, sha);
    reinstalarSkills(raiz);
    return { actualizado: false, motivo: 'revertido', de, a, migraciones: hechas, detalle: error.message };
  }

  // Con el guardar.js del motor nuevo, como las migraciones: el importado arriba es el de la versión vieja, y
  // regeneraría inicio.md y compañía como los hacía ella (sin mi-perfil al pasar a la 0.23.0, prueba-actualizar).
  require(path.join(raiz, '.kit', 'herramientas', 'guardar.js')).guardar({ raiz, mensaje: `kit: actualizado a ${a}`, permitirErrores: true });
  return { actualizado: true, de, a, migraciones: hechas };
}

function gh(args) {
  return ejecutarProceso('gh', args);
}

function consultaEtiqueta(repo, ejecutar) {
  return ejecutar(['api', `repos/${repo}/releases/latest`, '--jq', '.tag_name']);
}
const esEtiqueta = r => r.ok && /^v\d+\.\d+\.\d+$/.test(r.salida);

// La versión publicada es la última **release** del kit (etiqueta `vX.Y.Z`), nunca lo que haya en `main`:
// así a los cursos solo les llega lo que se ha decidido publicar, y se puede volver a una versión concreta.
function etiquetaPublicada(repo, ejecutar = gh) {
  const r = consultaEtiqueta(repo, ejecutar);
  return esEtiqueta(r) ? r.salida : null;
}

// Sin sesión de `gh` o sin red, la consulta a la API falla igual que si `gh` no pudiera ni lanzarse
// (sandbox) o no estuviera instalado: `motivo` (de proceso.js) distingue esos dos últimos casos, que no
// son "sin sesión ni release" sino del entorno de quien lo ejecuta.
// Sin `etiqueta`, la última publicada (para --ver: su CHANGELOG trae las novedades de todas las intermedias).
function descargar(repo, etiquetaPedida = null, ejecutar = gh) {
  let etiqueta = etiquetaPedida;
  if (!etiqueta) {
    const consulta = consultaEtiqueta(repo, ejecutar);
    if (!esEtiqueta(consulta)) {
      const razon = ['permiso', 'no-existe'].includes(consulta.motivo) ? `: ${explicar(consulta)}` : ' (¿sesión de gh iniciada? ¿hay alguna release?)';
      throw new Error(`No se pudo saber cuál es la última versión publicada del kit${razon}`);
    }
    etiqueta = consulta.salida;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profesor-kit-'));
  const r = ejecutar(['repo', 'clone', repo, tmp, '--', '--depth', '1', '--branch', etiqueta, '-q']);
  if (!r.ok) throw new Error(`No se pudo descargar el kit ${etiqueta}: ${explicar(r)}`);
  return tmp;
}

// Todas las releases publicadas (sin borradores ni versiones de prueba). null si no se puede saber.
function listarReleases(repo, ejecutar = gh) {
  const r = ejecutar(['api', `repos/${repo}/releases?per_page=100`, '--paginate', '--jq', '.[] | select((.draft or .prerelease) | not) | .tag_name']);
  if (!r.ok) return null;
  return r.salida.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
}

// Las releases posteriores a la instalada, de la más vieja a la más nueva: los pasos que faltan.
function pasosPendientes(actual, etiquetas) {
  return etiquetas.filter(t => /^v\d+\.\d+\.\d+$/.test(t) && esMasNueva(t.slice(1), actual))
    .sort((a, b) => (esMasNueva(a.slice(1), b.slice(1)) ? 1 : -1));
}

// El paso siguiente lo da el actualizar.js recién instalado, en un proceso nuevo: el de esa versión, que es el que
// se probó al publicarla (prueba-actualizar: de la versión anterior a la nueva). Nunca el código que ya está en
// memoria, que es el de la versión de antes.
function continuarConLaNueva(raiz) {
  const r = spawnSync(process.execPath, [path.join(raiz, '.kit', 'herramientas', 'actualizar.js'), '--aplicar'], { cwd: raiz, stdio: 'inherit' });
  return r.status === null ? 1 : r.status;
}

function novedades(origen, versionActual) {
  const lineas = fs.readFileSync(path.join(origen, '.kit', 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
  const inicio = lineas.findIndex(l => l.startsWith('## '));
  const fin = lineas.findIndex(l => l.trim() === `## ${versionActual}`);
  return lineas.slice(inicio < 0 ? 0 : inicio, fin < 0 ? lineas.length : fin).join('\n').trim();
}

// Consulta ligera (sin clonar): ¿qué versión hay publicada? Devuelve null si no hay red, sesión ni releases.
function versionPublicada(repo, ejecutar = gh) {
  const etiqueta = etiquetaPublicada(repo, ejecutar);
  return etiqueta ? etiqueta.slice(1) : null;
}

// Compara versiones número a número: '0.10.0' es más nueva que '0.9.1', aunque como texto no lo parezca.
function esMasNueva(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
}

// `--comprobar`: para el arranque de cada sesión. Una vez al día como mucho; imprime una línea solo si hay
// versión nueva, y nada si no la hay o no se puede saber. Nunca bloquea al alumno.
function comprobarNovedades(raiz, hoy = new Date().toISOString().slice(0, 10), consultar = versionPublicada) {
  const ajustes = v.leerAjustes(raiz);
  if (ajustes.ultima_comprobacion === hoy) return null;
  v.escribirAjustes(raiz, { ...ajustes, ultima_comprobacion: hoy });
  const nueva = consultar(v.leerMotor(raiz).repo);
  const actual = v.leerVersion(raiz);
  if (!nueva || !esMasNueva(nueva, actual)) return null;
  return `Hay una versión nueva del kit: tienes la ${actual} y está publicada la ${nueva}. Cuando quieras, pídeme "actualiza el kit".`;
}

// `--aplicar` sin `--origen` va versión a versión (nunca se salta ninguna): aplica la siguiente release y, si
// quedan más, deja seguir al actualizar.js recién instalado. Así cada paso es uno que se probó al publicar.
function aplicarSiguiente(raiz, descargarKit, { listar = listarReleases, continuar = continuarConLaNueva } = {}) {
  const repo = v.leerMotor(raiz).repo;
  const de = v.leerVersion(raiz);
  const etiquetas = listar(repo);
  if (!etiquetas) { console.log('No se pudo saber qué versiones hay publicadas (¿sin red o sin sesión de gh?). No se ha tocado nada.'); return 1; }
  const pasos = pasosPendientes(de, etiquetas);
  if (!pasos.length) { console.log(`Ya tienes la última versión (${de}).`); return 0; }
  const origen = descargarKit(repo, pasos[0]);
  try {
    const r = actualizar({ raiz, origen });
    if (!r.actualizado) {
      console.log(`No se ha actualizado: todo sigue como estaba, en la ${r.de}. Motivo: ${r.detalle || r.motivo}`);
      return 1;
    }
    const quedan = pasos.length - 1;
    console.log(`Actualizado de ${r.de} a ${r.a}.${r.migraciones.length ? ` Datos migrados: ${r.migraciones.join(', ')}.` : ''}` +
      (quedan ? ` ${quedan === 1 ? 'Queda 1 versión' : `Quedan ${quedan} versiones`}: sigo con la ${pasos[1].slice(1)}.` : ''));
  } finally {
    fs.rmSync(origen, { recursive: true, force: true, maxRetries: 3 });
  }
  return pasos.length > 1 ? continuar(raiz) : 0;
}

// `descargarKit` (y `secuencia`: listar y continuar) se inyectan para poder probar el flujo sin red.
function cli(args, raiz, descargarKit = descargar, consultar = versionPublicada, secuencia = {}) {
  if (args.includes('--comprobar')) { const aviso = comprobarNovedades(raiz, undefined, consultar); if (aviso) console.log(aviso); return 0; }
  const i = args.indexOf('--origen');
  if (i < 0 && args.includes('--aplicar')) return aplicarSiguiente(raiz, descargarKit, secuencia);
  const origen = i >= 0 ? path.resolve(args[i + 1]) : descargarKit(v.leerMotor(raiz).repo);
  try {
    const de = v.leerVersion(raiz);
    const a = v.leerVersion(origen);

    if (de === a) { console.log(`Ya tienes la última versión (${de}).`); return 0; }
    if (!args.includes('--aplicar')) {
      console.log(`Tienes la ${de}; hay una ${a}.\n\n${novedades(origen, de)}\n\nPara aplicarla: node .kit/herramientas/actualizar.js --aplicar`);
      return 0;
    }
    const r = actualizar({ raiz, origen });
    if (r.actualizado) {
      console.log(`Actualizado de ${r.de} a ${r.a}.${r.migraciones.length ? ` Datos migrados: ${r.migraciones.join(', ')}.` : ''}`);
      return 0;
    }
    console.log(`No se ha actualizado: todo sigue como estaba, en la ${r.de}. Motivo: ${r.detalle || r.motivo}`);
    return 1;
  } finally {
    // Lo descargado es temporal: no se deja una copia del kit por cada actualización.
    if (i < 0) fs.rmSync(origen, { recursive: true, force: true, maxRetries: 3 });
  }
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'actualizar.js');

module.exports = {
  actualizar, restaurar, validarMotor, novedades, comprobarNovedades, fusionarGitignore, etiquetaPublicada, versionPublicada,
  descargar, listarReleases, pasosPendientes, cli,
};
