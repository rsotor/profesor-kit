'use strict';
// Un solo sitio para lanzar un proceso externo (git, gh, node, powershell) y para explicarle al alumno
// por qué falló. `spawnSync` no distingue nada por sí solo: si el proceso ni llega a arrancar, `status`
// viene `null` y `stdout`/`stderr` vienen vacíos — sin mirar `error.code`, el mensaje que le llega al
// alumno se queda en blanco, o peor, imprime literalmente "null"/"undefined" si algo concatena esos
// campos sin protegerlos. Eso es justo lo que vio la issue #33 en un entorno restringido (sandbox) de Codex.
const { spawnSync } = require('node:child_process');

// Motivos estables, no el texto final (cada sitio lo traduce a su idioma): 'ok' si salió bien; 'permiso'
// si el sistema operativo impidió lanzarlo o escribir (EACCES, EPERM, EIO: típico de un entorno
// restringido que exige autorización explícita); 'no-existe' si el comando no está instalado o no está en
// el PATH de esta terminal (ENOENT); 'fallo' para cualquier otra cosa (el proceso arrancó y devolvió un
// código de salida distinto de 0: ahí `stdout`/`stderr` sí traen el motivo real, por ejemplo sin sesión de
// `gh` o sin red).
function motivoDe(r) {
  if (!r.error) return r.status === 0 ? 'ok' : 'fallo';
  if (r.error.code === 'ENOENT') return 'no-existe';
  if (['EACCES', 'EPERM', 'EIO'].includes(r.error.code)) return 'permiso';
  return 'fallo';
}

// Mismo resultado { ok, salida } que ya devolvían git.js, actualizar.js, crear-atajo.js, diagnostico.js
// e issue.js (nadie que ya lea esas dos claves se rompe), con tres añadidos: `motivo` (clasificado
// arriba), `stdout` sin mezclar (para quien necesita parsear JSON de verdad, como comprobar.js --json) y
// una `salida` que nunca se queda vacía cuando el proceso ni arrancó: ahí solo `error.message` explica
// qué pasó, así que se añade siempre que exista.
function ejecutar(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { encoding: 'utf8', ...opciones });
  const motivo = motivoDe(r);
  const stdout = r.stdout || '';
  const salida = (stdout + (r.stderr || '') + (r.error ? `\n${r.error.message}` : '')).trim();
  return { ok: motivo === 'ok', salida, stdout, motivo, comando };
}

// El texto para quien no es técnico, a partir de lo que devuelve ejecutar(). Nunca manda a abrir una
// issue del kit: si el proceso no pudo arrancar, no es un fallo de nuestro código, es el entorno de quien
// lo ejecuta (permisos del sistema, o que el programa no está instalado).
function explicar(r) {
  if (r.motivo === 'permiso') {
    return `el entorno de tu asistente no deja ejecutar "${r.comando}" aquí (parece un entorno restringido/sandbox); autoriza la ejecución fuera de ese entorno restringido y repite`;
  }
  if (r.motivo === 'no-existe') {
    return `no encuentro el comando "${r.comando}": comprueba que está instalado y en el PATH de esta terminal (si acabas de instalarlo, cierra esta ventana y abre una nueva)`;
  }
  return r.salida || `"${r.comando}" ha fallado sin más detalle`;
}

module.exports = { ejecutar, motivoDe, explicar };
