'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('../lib/vault');

// Formato v3: cada nota de sesión tiene la propiedad `estudiada`, que Obsidian dibuja como casilla y alimenta
// estudio/inicio.md. Los cursos creados antes no la tienen. inicio.md y los pies los escribe el guardado final.
module.exports = {
  descripcion: 'Cada sesión gana la casilla "estudiada" para la página de inicio del curso',
  migrar(raiz) {
    const dir = path.join(v.baseAlumno(raiz), 'sesiones');
    for (const abs of v.recorrer(dir, n => n.endsWith('.md') && !n.startsWith('_'))) {
      const texto = fs.readFileSync(abs, 'utf8');
      const eol = texto.includes('\r\n') ? '\r\n' : '\n';
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
      if (!m) { fs.writeFileSync(abs, `---${eol}estudiada: false${eol}---${eol}${texto}`); continue; }
      if (/^estudiada:/m.test(m[1])) continue;
      const cierre = m.index + m[0].length - 3;   // donde empieza el --- de cierre
      fs.writeFileSync(abs, texto.slice(0, cierre) + `estudiada: false${eol}` + texto.slice(cierre));
    }
  },
};
