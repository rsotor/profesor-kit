'use strict';
// Asistente de mentira para los tests de preparar.js: en vez de un LLM de verdad, escribe una nota de
// sesión y un concepto mínimos para el id que le toque y llama a guardar.js, como haría /sesion en
// segundo plano. No necesita leer el prompt: el test ya sabe qué id lanza (se lo pasa como primer
// argumento, dentro del `segundo_plano` del adaptador de prueba que escribe cada test).
//
//   node asistente-de-mentira.js <id> [prompt] [modelo]
//
// Con la variable de entorno PROFESOR_KIT_ASISTENTE_DE_MENTIRA_FALLA=1, simula un asistente que revienta
// (para probar el caso "fallo del asistente" de preparar.js).
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

if (process.env.PROFESOR_KIT_ASISTENTE_DE_MENTIRA_FALLA === '1') {
  console.error('fallo simulado del asistente de mentira');
  process.exit(1);
}

const id = process.argv[2];
const raiz = process.cwd();   // trabajar() lanza este script con cwd = la copia de trabajo (el worktree)
const slug = `concepto-${id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;

// Para el escenario "un choque real" de preparar.test.js: además de su propia nota nueva, edita la
// MISMA línea de un fichero de contenido que ya existía (no le añade una al final: dos líneas nuevas,
// cada una al final de su lado, se mezclan solas casi siempre — hace falta tocar lo mismo para que git
// no pueda resolverlo por su cuenta).
const ficheroAEditar = process.env.PROFESOR_KIT_ASISTENTE_DE_MENTIRA_EDITA;
if (ficheroAEditar) {
  const abs = path.join(raiz, ...ficheroAEditar.split('/'));
  const original = fs.readFileSync(abs, 'utf8');
  const editado = original.includes('Uno.') ? original.replace('Uno.', 'Editado por el asistente de mentira, en segundo plano.') : `${original}\nEdición del asistente de mentira, en segundo plano.\n`;
  fs.writeFileSync(abs, editado);
}

fs.appendFileSync(path.join(raiz, 'estudio', 'conceptos', '_index.md'), `${slug} | Concepto de la clase ${id} | B1 | 1 | alias:\n`);

fs.writeFileSync(path.join(raiz, 'estudio', 'conceptos', `${slug}.md`), [
  '---', 'tipo: concepto', 'alias: []', 'requiere: []', 'bloques: [1]', '---',
  `# Concepto de la clase ${id}`, '', '## El ejemplo', '', 'Uno.', '',
].join('\n'));

fs.writeFileSync(path.join(raiz, 'estudio', 'sesiones', `${id}-clase-de-mentira.md`), [
  '---', 'tipo: sesion', 'bloque: 1', '---', `# Clase de mentira ${id}`, '',
  `- [[${slug}]] — nuevo`, '',
  '## Cobertura del material', '', 'Toda la diapositiva quedó en la nota.', '',
  '## Auditoría del material', '', 'Sin discrepancias.', '',
  '## Para pensarlo despacio', '', '¿Por qué esto importa para el resto del módulo?', '',
].join('\n'));

fs.appendFileSync(path.join(raiz, 'estudio', 'progreso.md'), `| [[${slug}]] | ⬜ | ⬜ |\n`);

execFileSync(process.execPath, [path.join(raiz, '.kit', 'herramientas', 'guardar.js'), `sesion(${id}): clase de mentira`], { cwd: raiz, encoding: 'utf8' });
