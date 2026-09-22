'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Formato v2: el curso tiene portada (README.md en la raíz). Los cursos creados antes no la tienen.
module.exports = {
  descripcion: 'El curso gana su portada README.md, que se ve en GitHub',
  migrar(raiz) {
    const readme = path.join(raiz, 'README.md');
    if (fs.existsSync(readme)) return;
    const ajustes = JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8'));
    const plantilla = fs.readFileSync(path.join(raiz, '.kit', 'plantillas', 'readme-del-curso.md'), 'utf8');
    fs.writeFileSync(readme, plantilla
      .replace('{{NOMBRE_DEL_CURSO}}', ajustes.nombre_curso || 'Mi curso')
      .replace('{{DE_QUE_VA}}', '_Pendiente: mi profesor lo rellena en la próxima sesión._')
      .replace('{{TEMARIO}}', '_Pendiente._')
      .replace('{{ESTADO}}', '_Pendiente: mi profesor lo actualiza en la próxima sesión._')
      .replace('{{ATAJO}}', ajustes.atajo || '<mi palabra>'));
  },
};
