'use strict';
// Lint pedagógico de comprobar.js (AGENTS.md → "Avisos pedagógicos", §8.1 P1 de la auditoría): seis avisos
// que hacen que la calidad del material no dependa de que el modelo siga la skill al pie de la letra.
const test = require('node:test');
const assert = require('node:assert/strict');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

const avisos = (raiz, regla) => comprobar(raiz).avisos.filter(a => a.regla === regla);
const flashcard = n => `**Pregunta ${n}**\n> [!success]- Respuesta\n> corta\n`;

// --- nota-larga --------------------------------------------------------------------------------

test('nota-larga: más líneas de contenido que "longitud_nota" de config/profesor.md, aviso', () => {
  const largo = Array.from({ length: 8 }, (_, i) => `Línea ${i + 1} de contenido de verdad, no una plantilla.`).join('\n\n');
  const raiz = cursoTemporal({
    'config/profesor.md': '---\nmarcador_dudas: "@@"\nlongitud_nota: 5\n---\n# Profesor\n',
    'estudio/conceptos/alfa.md': `---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nUno.\n\n${largo}\n`,
  });
  const a = avisos(raiz, 'nota-larga');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /longitud_nota/);
});

test('nota-larga: con el límite por defecto (una pantalla), una nota corta no avisa', () => {
  assert.equal(avisos(cursoTemporal(), 'nota-larga').length, 0);
});

// --- concepto-sin-ejemplo -----------------------------------------------------------------------

test('concepto-sin-ejemplo: sin "## El ejemplo", aviso', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n## El problema\n\nx\n',
  });
  assert.equal(avisos(raiz, 'concepto-sin-ejemplo').length, 1);
});

test('concepto-sin-ejemplo: con el texto de la plantilla sin rellenar, también avisa', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\n<El caso más sencillo que enseñe el mecanismo.>\n',
  });
  assert.equal(avisos(raiz, 'concepto-sin-ejemplo').length, 1);
});

test('concepto-sin-ejemplo: con el ejemplo relleno, no avisa', () => {
  assert.equal(avisos(cursoTemporal(), 'concepto-sin-ejemplo').length, 0);
});

// --- sesion-incompleta ---------------------------------------------------------------------------

test('sesion-incompleta: falta "## Auditoría del material", aviso con esa sección en el detalle', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n# Intro\n\n[[alfa]]\n\n## Cobertura del material\n\nx\n\n## Para pensarlo despacio\n\nx\n',
  });
  const a = avisos(raiz, 'sesion-incompleta');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /Auditoría del material/);
});

test('sesion-incompleta: con las tres secciones rellenas, no avisa', () => {
  assert.equal(avisos(cursoTemporal(), 'sesion-incompleta').length, 0);
});

// --- flashcards-fuera-de-rango --------------------------------------------------------------------

test('flashcards-fuera-de-rango: 2 flashcards con el rango 3-6 por defecto, aviso', () => {
  const raiz = cursoTemporal({
    'estudio/flashcards/s01-intro.md': `---\ntipo: flashcards\nsesion: s01-intro\n---\n${flashcard(1)}\n${flashcard(2)}\n`,
  });
  const a = avisos(raiz, 'flashcards-fuera-de-rango');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /2 flashcards/);
});

test('flashcards-fuera-de-rango: 4 flashcards, dentro del rango, no avisa', () => {
  const raiz = cursoTemporal({
    'estudio/flashcards/s01-intro.md': `---\ntipo: flashcards\nsesion: s01-intro\n---\n${[1, 2, 3, 4].map(flashcard).join('\n')}\n`,
  });
  assert.equal(avisos(raiz, 'flashcards-fuera-de-rango').length, 0);
});

test('flashcards-fuera-de-rango: "flashcards_por_sesion" como número suelto exige exactamente ese número', () => {
  const raiz = cursoTemporal({
    'config/profesor.md': '---\nmarcador_dudas: "@@"\nflashcards_por_sesion: 5\n---\n# Profesor\n',
    'estudio/flashcards/s01-intro.md': `---\ntipo: flashcards\nsesion: s01-intro\n---\n${[1, 2, 3, 4].map(flashcard).join('\n')}\n`,
  });
  assert.equal(avisos(raiz, 'flashcards-fuera-de-rango').length, 1);
});

// --- requiere-vacio -------------------------------------------------------------------------------

test('requiere-vacio: dificultad 3 y "requiere:" vacío, aviso', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\ndificultad: 3\nrequiere: []\n---\n# Alfa\n\n## El ejemplo\n\nUno.\n',
  });
  assert.equal(avisos(raiz, 'requiere-vacio').length, 1);
});

test('requiere-vacio: con "requiere:" relleno no avisa; dificultad 2 sin requiere tampoco', () => {
  const raizConRequiere = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\ndificultad: 3\nrequiere: [beta]\n---\n# Alfa\n\n## El ejemplo\n\nUno.\n',
  });
  assert.equal(avisos(raizConRequiere, 'requiere-vacio').length, 0);
  assert.equal(avisos(cursoTemporal(), 'requiere-vacio').length, 0);
});

// --- pregunta-doble --------------------------------------------------------------------------------

test('pregunta-doble: dos signos de interrogación en la misma pregunta, aviso', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen.md': '---\ntipo: examen\nunidad: 01\nfecha: 2026-10-02\nnota:\n---\n# Examen\n\n1. ¿Qué es alfa? ¿Por qué importa?\n\n✍️ **Tu respuesta:**\n',
  });
  const a = avisos(raiz, 'pregunta-doble');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /2 signos/);
});

test('pregunta-doble: una sola pregunta, no avisa', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen.md': '---\ntipo: examen\nunidad: 01\nfecha: 2026-10-02\nnota:\n---\n# Examen\n\n1. ¿Qué es alfa?\n\n✍️ **Tu respuesta:**\n',
  });
  assert.equal(avisos(raiz, 'pregunta-doble').length, 0);
});

test('pregunta-doble: sin la línea "✍️ **Tu respuesta:**" no sigue el formato de la skill, y no se cuenta (heurística conservadora)', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen.md': '---\ntipo: examen\nunidad: 01\nfecha: 2026-10-02\nnota:\n---\n# Examen\n\n1. ¿Qué es alfa? ¿Por qué importa?\n',
  });
  assert.equal(avisos(raiz, 'pregunta-doble').length, 0);
});

// --- falta-info-mal-usado (plan 0.22, arreglo 5b.1) ------------------------------------------------

test('falta-info-mal-usado: FALTA INFO dentro de "## El error típico", aviso', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n'
      + '## El ejemplo\n\nUno.\n\n## El error típico\n\n⚠️ **FALTA INFO:** el material no trae ninguno.\n',
  });
  const a = avisos(raiz, 'falta-info-mal-usado');
  assert.equal(a.length, 1);
  assert.match(a[0].detalle, /El error típico/);
});

test('falta-info-mal-usado: FALTA INFO en otra sección no avisa (esa sí es del curso, no de esta regla)', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n'
      + '## El problema\n\n⚠️ **FALTA INFO:** el material no lo explica.\n\n## El ejemplo\n\nUno.\n',
  });
  assert.equal(avisos(raiz, 'falta-info-mal-usado').length, 0);
});

test('falta-info-mal-usado: sin "## El error típico" no avisa; con una ampliación tampoco', () => {
  assert.equal(avisos(cursoTemporal(), 'falta-info-mal-usado').length, 0);
  const raiz = cursoTemporal({
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nrequiere: []\n---\n# Alfa\n\n'
      + '## El ejemplo\n\nUno.\n\n## El error típico\n\n> [!info] Ampliación fuera de los apuntes\n> Confundir alfa con beta.\n',
  });
  assert.equal(avisos(raiz, 'falta-info-mal-usado').length, 0);
});
