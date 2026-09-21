'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = {
  'config/profesor.md': '---\nmarcador_dudas: "@@"\n---\n# Profesor\n',
  'config/ajustes.json': JSON.stringify({ subir_a_github: false, llm: 'claude-code', version_datos: 1 }, null, 2),
  'conceptos/_index.md': '# Índice\n\nslug | definición | bloques | dif | alias\n\n## Conceptos\n\n```\nalfa | La primera letra | B1 | 1 | alias: a, alpha\n```\n',
  'conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nUno.\n',
  'sesiones/s01-intro.md': '---\ntipo: sesion\n---\n# Intro\n\n- [[alfa]] — nuevo\n',
  'progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ⬜ | ⬜ |\n',
  'mapa-del-curso.md': '# Mapa\n\n- [[s01-intro]]\n',
  'formulario.md': '# Formulario\n',
};

function escribir(raiz, ficheros) {
  for (const [ruta, contenido] of Object.entries(ficheros)) {
    const destino = path.join(raiz, ...ruta.split('/'));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
  }
}

function cursoTemporal(ficheros = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-'));
  escribir(raiz, BASE);
  escribir(raiz, ficheros);
  return raiz;
}

function git(raiz, ...args) {
  return execFileSync('git', args, { cwd: raiz, encoding: 'utf8' }).trim();
}

function iniciarGit(raiz) {
  git(raiz, 'init', '-q', '-b', 'main');
  git(raiz, 'config', 'user.name', 'Test');
  git(raiz, 'config', 'user.email', 'test@example.com');
  git(raiz, 'config', 'commit.gpgsign', 'false');
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'inicio');
}

module.exports = { cursoTemporal, escribir, iniciarGit, git };
