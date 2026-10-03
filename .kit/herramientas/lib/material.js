'use strict';
// El material del alumno (`estudio/inbox/`) y lo que cada sesión dice que usó (`fuente:`). Lo comparten
// estado.js (qué material es nuevo) y comprobar.js (el aviso `fuente-inexistente`).
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// El nombre de un fichero, para compararlo con lo que dice una nota. En macOS el nombre en disco puede venir en
// Unicode NFD ("í" = "i" + su tilde) y el texto de la nota en NFC: sin normalizar, un fichero con tildes no casa
// nunca con su `fuente:` (#89).
const nombreDe = ruta => path.posix.basename(v.aPosix(String(ruta))).normalize('NFC');

// Los ficheros de estudio/inbox/, como rutas desde la carpeta del alumno.
function ficherosDeInbox(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'inbox'), n => !n.startsWith('.')).map(abs => v.aPosix(path.relative(base, abs)));
}

// Lo que cita cada sesión en su `fuente:` (una ruta o una lista): [{ sesion, fuentes }], con `sesion` desde la
// carpeta del alumno.
function fuentesDeSesiones(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const fm = v.leerFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    const fuentes = Array.isArray(fm.fuente) ? fm.fuente.map(String) : (fm.fuente ? [String(fm.fuente)] : []);
    return { sesion: v.aPosix(path.relative(base, abs)), fuentes };
  });
}

// "Material nuevo" (plan §2): un fichero de estudio/inbox/ que ninguna sesión cita en su `fuente:`.
// Se compara por nombre de fichero, no por ruta completa: `fuente:` se escribe sin `estudio/` delante
// (AGENTS.md), y comparar solo el nombre es más tolerante a cómo cada sesión lo anotó.
function materialNuevo(raiz) {
  const citados = new Set(fuentesDeSesiones(raiz).flatMap(s => s.fuentes.map(nombreDe)));
  return ficherosDeInbox(raiz).filter(rel => !citados.has(nombreDe(rel))).sort();
}

module.exports = { nombreDe, ficherosDeInbox, fuentesDeSesiones, materialNuevo };
