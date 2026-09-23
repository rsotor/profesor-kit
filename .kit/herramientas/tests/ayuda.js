'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Los tests trabajan en repos temporales. Si el proceso hereda GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE… (git las
// pone dentro de un hook), cada git de un test escribiría en el repo que las fijó, no en el temporal. Se quitan
// para este proceso y para todo lo que lance. Ver .githooks/pre-push.
for (const variable of execFileSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)) {
  delete process.env[variable];
}

const BASE = {
  'config/profesor.md': '---\nmarcador_dudas: "@@"\n---\n# Profesor\n',
  'config/ajustes.json': JSON.stringify({ subir_a_github: false, llm: 'claude-code', version_datos: 1 }, null, 2),
  'estudio/conceptos/_index.md': '# Índice\n\nslug | definición | bloques | dif | alias\n\n## Conceptos\n\n```\nalfa | La primera letra | B1 | 1 | alias: a, alpha\n```\n',
  'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: [a, alpha]\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nUno.\n',
  // Las tres secciones son las que exige `sesion-incompleta` (lint pedagógico): esta base es "una sesión
  // completa", no solo un mapa mínimo, para que el curso de pruebas siga saliendo sano por defecto.
  'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n# Intro\n\n- [[alfa]] — nuevo\n\n'
    + '## Cobertura del material\n\nToda la diapositiva quedó en [[alfa]].\n\n'
    + '## Auditoría del material\n\nSin discrepancias.\n\n'
    + '## Para pensarlo despacio\n\n¿Por qué alfa es la primera letra y no la última?\n',
  'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ⬜ | ⬜ |\n',
  'estudio/mapa-del-curso.md': '# Mapa\n\n- [[s01-intro]]\n',
  'README.md': '# Curso de prueba\n',
  'estudio/inbox/.gitkeep': '', 'estudio/ejercicios/.gitkeep': '', 'estudio/examenes/.gitkeep': '',
  'estudio/flashcards/.gitkeep': '', 'estudio/repasos/.gitkeep': '',
};

// Toda carpeta temporal de los tests nace aquí y se borra al terminar el proceso (cada fichero de tests es un
// proceso): los cursos de prueba son de usar y tirar, y antes se quedaban para siempre en la carpeta temporal.
const TEMPORALES = [];
function temporal(prefijo = 'kit-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
  TEMPORALES.push(dir);
  return dir;
}
// También se borra lo que un test renombró a partir de ella (`<carpeta>-movido`): si no, se escaparía.
process.on('exit', () => {
  const hermanas = TEMPORALES.length ? fs.readdirSync(os.tmpdir()) : [];
  for (const dir of TEMPORALES) {
    const base = path.basename(dir);
    for (const n of [base, ...hermanas.filter(h => h.startsWith(`${base}-`))]) {
      try { fs.rmSync(path.join(os.tmpdir(), n), { recursive: true, force: true, maxRetries: 3 }); } catch { /* Windows: fichero abierto */ }
    }
  }
});

function escribir(raiz, ficheros) {
  for (const [ruta, contenido] of Object.entries(ficheros)) {
    const destino = path.join(raiz, ...ruta.split('/'));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
  }
}

function cursoTemporal(ficheros = {}) {
  const raiz = temporal('kit-');
  escribir(raiz, BASE);
  require('../guardar').regenerarGenerados(raiz);   // como la dejaría un guardado: inicio, pies, pendientes
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

module.exports = { cursoTemporal, escribir, iniciarGit, git, temporal };
