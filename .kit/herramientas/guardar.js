'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { leerAjustes, leerMotor } = require('./lib/vault');
const { escanearSalientes } = require('./lib/secretos');
const { ejecutar } = require('./lib/proceso');
const fs = require('node:fs');
const { comprobar } = require('./comprobar');
const { pendientes, markdownPendientes, markdownAuditoria, markdownFormulario, markdownEjercicios, actualizarEstadoReadme } = require('./lib/generados');
const { CARPETA_ALUMNO } = require('./lib/vault');
const indice = require('./lib/indice');
const perfil = require('./lib/perfil');
const repaso = require('./lib/repaso');

const DIARIO_CABECERA = `# Diario del curso

> Una línea por cada vez que tu profesor guarda. La escribe él (\`guardar.js\`) y la lee al abrir para saber por
> dónde ibais. Si una línea dice **en curso** y no hay otra después que lo cierre, algo se quedó a medias.

`;

// Anota en config/diario.md qué se guarda. Va antes del commit para que forme parte de él.
function anotarEnDiario(raiz, mensaje, hoy = new Date().toISOString().slice(0, 10)) {
  const f = path.join(raiz, 'config', 'diario.md');
  const previo = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : DIARIO_CABECERA;
  // Respeta el fin de línea que ya tenga el fichero: en Windows (\r\n), mezclar los dos lo estropea y git lo da
  // entero por cambiado en cada guardado.
  const eol = previo.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(f, previo.replace(/(\r?\n)*$/, eol) + `- ${hoy} · ${mensaje}${eol}`);
}

// Lo que se escribe solo en cada guardado. Va ANTES de comprobar: así un curso al que aún le falta inicio.md no se
// queda sin poder guardar, y lo generado se comprueba en el mismo guardado. Solo se escribe lo que cambia: si no,
// un curso quieto parecería tener cambios.
function regenerarGenerados(raiz, hoy = new Date().toISOString().slice(0, 10)) {
  const base = path.join(raiz, CARPETA_ALUMNO);
  const escribirSiCambia = (fichero, texto) => {
    if (!fs.existsSync(fichero) || fs.readFileSync(fichero, 'utf8') !== texto) {
      fs.mkdirSync(path.dirname(fichero), { recursive: true });
      fs.writeFileSync(fichero, texto);
    }
  };
  // E1: las tarjetas se mueven de caja en el curso, nunca en una copia de preparación en segundo plano: chocaría con
  // el curso al juntar, y lo que la copia trae (una clase nueva) aún no está estudiado. Se hace al juntar.
  const rama = g.intentarGit(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!(rama.ok && rama.salida.trim().startsWith('preparacion/'))) {
    repaso.procesar(raiz, { hoy, estudiadas: new Set(indice.leerSesiones(raiz).filter(s => s.estudiada).map(s => s.id)) });
  }
  for (const [rel, pie] of indice.piesDeSesion(raiz)) {
    const fichero = path.join(base, ...rel.split('/'));
    escribirSiCambia(fichero, indice.ponerPie(fs.readFileSync(fichero, 'utf8'), pie));
  }
  // Antes que inicio.md: "Otras hojas" mira si formulario.md y mi-perfil.md existen en disco, y tiene que verlos ya escritos
  // la primera vez que se genera (si no, la próxima vez que se guarde cambiaría solo por eso).
  escribirSiCambia(path.join(base, 'formulario.md'), markdownFormulario(raiz));
  escribirSiCambia(path.join(base, perfil.PERFIL), perfil.markdownPerfil(raiz));
  escribirSiCambia(path.join(base, 'ejercicios', '_index.md'), markdownEjercicios(raiz));
  escribirSiCambia(path.join(base, indice.INICIO), indice.markdownInicio(raiz, { pendientes: pendientes(raiz).length, hoy }));
  escribirSiCambia(path.join(base, 'pendientes.md'), markdownPendientes(raiz));
  escribirSiCambia(path.join(base, 'auditoria-del-material.md'), markdownAuditoria(raiz));
}

// ¿Es seguro subir a este remoto? (issue #39, H07). Una carpeta del disco no sale del ordenador. En GitHub, solo
// un repositorio privado que no sea el del kit; si no se puede comprobar (sin red, sin sesión de gh), no se
// sube: el trabajo ya está guardado en local y sube en el siguiente guardado. Otro servidor: el kit no sabe
// comprobarlo, así que tampoco.
function destinoSeguro(url, repoKit, ejecutarGh = (args) => ejecutar('gh', args)) {
  const esLocal = !/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && !/^[^@/\\]+@[^:]+:/.test(url);
  if (esLocal || /^file:\/\//i.test(url)) return { ok: true };
  const m = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/i.exec(url);
  if (!m) return { ok: false, motivo: 'el remoto no está en GitHub y el kit no sabe comprobar si es privado' };
  if (repoKit && m[1].toLowerCase() === repoKit.toLowerCase()) return { ok: false, motivo: 'el remoto es el repositorio del kit, no el tuyo' };
  const r = ejecutarGh(['repo', 'view', m[1], '--json', 'visibility', '--jq', '.visibility']);
  if (!r.ok) return { ok: false, motivo: 'no se ha podido comprobar que tu repositorio de GitHub sea privado (¿sin red o sin sesión de gh?)' };
  if (r.salida.trim() !== 'PRIVATE') return { ok: false, motivo: 'tu repositorio de GitHub no es privado: ponlo privado con gh repo edit --visibility private --accept-visibility-change-consequences' };
  return { ok: true };
}

// El repositorio del kit, para no subir nunca a él. Un curso a medio reparar puede no tener motor.json.
function repoDelKit(raiz) {
  try { return leerMotor(raiz).repo; } catch { return null; }
}

// Decide si lo que hay en HEAD se sube, y lo sube si procede. Mismo criterio para un guardado que para
// un deshacer (deshacer.js la reutiliza): sin subir_a_github, con un secreto o sin remoto, se queda en local.
// Una copia de trabajo de preparar.js (rama `preparacion/<id>`) nunca sube: es una rama aparte que nadie
// más ve hasta que `--juntar` la mezcla con la principal, y esa mezcla es la que sube (con sus reglas
// normales), no cada guardado suelto de la preparación. Solo un `true` de verdad sube: "false" en texto, o
// no tener el ajuste, se queda en local (issue #39, H07).
function subirSiProcede(raiz, informe, { ejecutarGh } = {}) {
  const resultado = { subido: false };
  const subir = leerAjustes(raiz).subir_a_github;
  const url = g.urlOrigen(raiz);
  let salientes;
  let destino;
  if (subir !== true) {
    resultado.motivoSubida = subir === false ? 'subir_a_github está desactivado'
      : 'subir_a_github en config/ajustes.json no es true ni false: no se sube hasta arreglarlo';
  } else if (g.ramaActual(raiz).startsWith('preparacion/')) resultado.motivoSubida = 'esto es una copia de preparación en segundo plano: se sube cuando el profesor la junte con --juntar';
  else if (informe.errores.some(e => e.regla === 'secreto')) resultado.motivoSubida = 'hay un posible secreto: no se sube hasta quitarlo';
  else if (!url) resultado.motivoSubida = 'no hay remoto configurado';
  else if ((salientes = escanearSalientes(raiz)).length) {
    const s = salientes[0];
    resultado.motivoSubida = `hay un posible secreto (${s.tipo}) en un guardado que aún no se ha subido (${s.commit}, ${s.fichero}): ` +
      'aunque ya no esté en los ficheros, subiría con la historia. No se sube; el trabajo sigue guardado en local';
  } else if (!(destino = destinoSeguro(url, repoDelKit(raiz), ejecutarGh)).ok) resultado.motivoSubida = `${destino.motivo}. El trabajo está guardado en local`;
  else {
    const push = g.intentarGit(raiz, ['push', '-q', 'origin', 'HEAD']);
    if (push.ok) resultado.subido = true;
    else resultado.motivoSubida = `el push falló (el trabajo está guardado en local): ${push.salida}`;
  }
  return resultado;
}

function guardar({ raiz, mensaje, permitirErrores = false, hoy }) {
  if (!g.esRepo(raiz)) return { guardado: false, motivo: 'sin-repo', subido: false, informe: comprobar(raiz) };
  regenerarGenerados(raiz, hoy);
  const informe = comprobar(raiz);
  if (informe.errores.length && !permitirErrores) return { guardado: false, motivo: 'errores', subido: false, informe };
  // La portada solo cambia de fecha si hay algo más que guardar: si no, un curso quieto parecería tener cambios.
  if (g.hayCambios(raiz)) actualizarEstadoReadme(raiz, hoy);
  if (!g.hayCambios(raiz)) return { guardado: false, motivo: 'sin-cambios', subido: false, informe };
  if (!g.tieneIdentidad(raiz)) return { guardado: false, motivo: 'sin-identidad', subido: false, informe };

  anotarEnDiario(raiz, mensaje, hoy);
  g.git(raiz, ['add', '-A']);
  g.git(raiz, ['commit', '-q', '-m', mensaje]);

  return { guardado: true, informe, ...subirSiProcede(raiz, informe) };
}

const EXPLICACION = {
  'errores': 'No se ha guardado: hay errores que arreglar primero (ejecuta comprobar.js para verlos).',
  'sin-cambios': 'No había nada nuevo que guardar.',
  'sin-identidad': 'Git no sabe quién eres todavía. Hay que configurar user.name y user.email (ver INSTALAR-AGENTE.md, paso de identidad).',
  'sin-repo': 'La carpeta del curso no es la raíz de su propio repositorio git (no tiene uno, o está dentro de otro): no se toca nada. Ejecuta node .kit/herramientas/diagnostico.js para ver cómo arreglarlo.',
};

// `--empezar "<qué>"`: la línea "en curso" del diario, antes de algo de varios pasos. Sin commit: se guarda con el
// trabajo. La escribe la herramienta y no el profesor a mano: con `echo >>` pide permiso, y sin nadie delante (la
// prueba real, el segundo plano) se deniega y el paso se queda sin hacer.
function cli(args, raiz) {
  if (args[0] === '--empezar') {
    const que = (args[1] || '').trim();
    if (!que) { console.error('Uso: node .kit/herramientas/guardar.js --empezar "<qué vas a hacer>"'); return 2; }
    anotarEnDiario(raiz, `en curso: ${que}`);
    console.log(`Anotado en el diario: en curso: ${que}.`);
    return 0;
  }
  const mensaje = args[0];
  if (!mensaje) { console.error('Uso: node .kit/herramientas/guardar.js "<mensaje>"  ·  --empezar "<qué>"'); return 2; }
  const r = guardar({ raiz, mensaje });
  if (!r.guardado) { console.log(EXPLICACION[r.motivo]); return r.motivo === 'sin-cambios' ? 0 : 1; }
  console.log(r.subido ? 'Guardado y subido a GitHub.' : `Guardado en local. No se ha subido: ${r.motivoSubida}.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'guardar.js');

module.exports = { guardar, regenerarGenerados, anotarEnDiario, subirSiProcede, destinoSeguro, cli };
