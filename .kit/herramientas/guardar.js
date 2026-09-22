'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { leerAjustes } = require('./lib/vault');
const fs = require('node:fs');
const { comprobar, markdownPendientes } = require('./comprobar');
const { CARPETA_ALUMNO } = require('./lib/vault');

const DIARIO_CABECERA = `# Diario del curso

> Una línea por cada vez que tu profesor guarda. La escribe él (\`guardar.js\`) y la lee al abrir para saber por
> dónde ibais. Si una línea dice **en curso** y no hay otra después que lo cierre, algo se quedó a medias.

`;

// Anota en config/diario.md qué se guarda. Va antes del commit para que forme parte de él.
function anotarEnDiario(raiz, mensaje, hoy = new Date().toISOString().slice(0, 10)) {
  const f = path.join(raiz, 'config', 'diario.md');
  const previo = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : DIARIO_CABECERA;
  fs.writeFileSync(f, previo.replace(/\n*$/, '\n') + `- ${hoy} · ${mensaje}\n`);
}

function guardar({ raiz, mensaje, permitirErrores = false, hoy }) {
  const informe = comprobar(raiz);
  if (!g.esRepo(raiz)) return { guardado: false, motivo: 'sin-repo', subido: false, informe };
  if (informe.errores.length && !permitirErrores) return { guardado: false, motivo: 'errores', subido: false, informe };
  // Solo se reescribe si cambia: si no, un curso sin novedades parecería tener cambios.
  const pendientes = path.join(raiz, CARPETA_ALUMNO, 'pendientes.md');
  const texto = markdownPendientes(raiz);
  if (!fs.existsSync(pendientes) || fs.readFileSync(pendientes, 'utf8') !== texto) fs.writeFileSync(pendientes, texto);
  if (!g.hayCambios(raiz)) return { guardado: false, motivo: 'sin-cambios', subido: false, informe };
  if (!g.tieneIdentidad(raiz)) return { guardado: false, motivo: 'sin-identidad', subido: false, informe };

  anotarEnDiario(raiz, mensaje, hoy);
  g.git(raiz, ['add', '-A']);
  g.git(raiz, ['commit', '-q', '-m', mensaje]);

  const resultado = { guardado: true, subido: false, informe };
  if (!leerAjustes(raiz).subir_a_github) resultado.motivoSubida = 'subir_a_github está desactivado';
  else if (informe.errores.some(e => e.regla === 'secreto')) resultado.motivoSubida = 'hay un posible secreto: no se sube hasta quitarlo';
  else if (!g.urlOrigen(raiz)) resultado.motivoSubida = 'no hay remoto configurado';
  else {
    const push = g.intentarGit(raiz, ['push', '-q', 'origin', 'HEAD']);
    if (push.ok) resultado.subido = true;
    else resultado.motivoSubida = `el push falló (el trabajo está guardado en local): ${push.salida}`;
  }
  return resultado;
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

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { guardar, anotarEnDiario, cli };
