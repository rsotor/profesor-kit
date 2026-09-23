'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { leerAjustes } = require('./lib/vault');
const fs = require('node:fs');
const { comprobar } = require('./comprobar');
const { pendientes, markdownPendientes, markdownAuditoria, markdownFormulario, markdownEjercicios, actualizarEstadoReadme } = require('./lib/generados');
const { CARPETA_ALUMNO } = require('./lib/vault');
const indice = require('./lib/indice');

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
function regenerarGenerados(raiz) {
  const base = path.join(raiz, CARPETA_ALUMNO);
  const escribirSiCambia = (fichero, texto) => {
    if (!fs.existsSync(fichero) || fs.readFileSync(fichero, 'utf8') !== texto) {
      fs.mkdirSync(path.dirname(fichero), { recursive: true });
      fs.writeFileSync(fichero, texto);
    }
  };
  for (const [rel, pie] of indice.piesDeSesion(raiz)) {
    const fichero = path.join(base, ...rel.split('/'));
    escribirSiCambia(fichero, indice.ponerPie(fs.readFileSync(fichero, 'utf8'), pie));
  }
  // Antes que inicio.md: "Otras hojas" mira si formulario.md existe en disco, y tiene que verlo ya escrito
  // la primera vez que se genera (si no, la próxima vez que se guarde cambiaría solo por eso).
  escribirSiCambia(path.join(base, 'formulario.md'), markdownFormulario(raiz));
  escribirSiCambia(path.join(base, 'ejercicios', '_index.md'), markdownEjercicios(raiz));
  escribirSiCambia(path.join(base, indice.INICIO), indice.markdownInicio(raiz, { pendientes: pendientes(raiz).length }));
  escribirSiCambia(path.join(base, 'pendientes.md'), markdownPendientes(raiz));
  escribirSiCambia(path.join(base, 'auditoria-del-material.md'), markdownAuditoria(raiz));
}

// Decide si lo que hay en HEAD se sube, y lo sube si procede. Mismo criterio para un guardado que para
// un deshacer (deshacer.js la reutiliza): sin subir_a_github, con un secreto o sin remoto, se queda en local.
// Una copia de trabajo de preparar.js (rama `preparacion/<id>`) nunca sube: es una rama aparte que nadie
// más ve hasta que `--juntar` la mezcla con la principal, y esa mezcla es la que sube (con sus reglas
// normales), no cada guardado suelto de la preparación.
function subirSiProcede(raiz, informe) {
  const resultado = { subido: false };
  if (!leerAjustes(raiz).subir_a_github) resultado.motivoSubida = 'subir_a_github está desactivado';
  else if (g.ramaActual(raiz).startsWith('preparacion/')) resultado.motivoSubida = 'esto es una copia de preparación en segundo plano: se sube cuando el profesor la junte con --juntar';
  else if (informe.errores.some(e => e.regla === 'secreto')) resultado.motivoSubida = 'hay un posible secreto: no se sube hasta quitarlo';
  else if (!g.urlOrigen(raiz)) resultado.motivoSubida = 'no hay remoto configurado';
  else {
    const push = g.intentarGit(raiz, ['push', '-q', 'origin', 'HEAD']);
    if (push.ok) resultado.subido = true;
    else resultado.motivoSubida = `el push falló (el trabajo está guardado en local): ${push.salida}`;
  }
  return resultado;
}

function guardar({ raiz, mensaje, permitirErrores = false, hoy }) {
  if (!g.esRepo(raiz)) return { guardado: false, motivo: 'sin-repo', subido: false, informe: comprobar(raiz) };
  regenerarGenerados(raiz);
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
  'sin-repo': 'Esta carpeta no es un repositorio git.',
};

function cli(args, raiz) {
  const mensaje = args[0];
  if (!mensaje) { console.error('Uso: node .kit/herramientas/guardar.js "<mensaje>"'); return 2; }
  const r = guardar({ raiz, mensaje });
  if (!r.guardado) { console.log(EXPLICACION[r.motivo]); return r.motivo === 'sin-cambios' ? 0 : 1; }
  console.log(r.subido ? 'Guardado y subido a GitHub.' : `Guardado en local. No se ha subido: ${r.motivoSubida}.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'guardar.js');

module.exports = { guardar, regenerarGenerados, anotarEnDiario, subirSiProcede, cli };
