'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const v = require('../lib/vault');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const PROHIBIDO = /roberto|inversi[oó]n|multimercado|financ|€|\beuros?\b|lente de producto|lente po\b|motor-financiero|visual business|campus/i;
const SKILLS = ['sesion', 'dudas', 'ejercicio', 'examen', 'repaso', 'configurar', 'actualizar'];

function ficherosDelMotor() {
  const sueltos = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'INSTALACION.md', 'INSTALAR-AGENTE.md'].map(f => path.join(RAIZ, f)).filter(fs.existsSync);
  const kit = v.recorrer(path.join(RAIZ, '.kit'), n => /\.(md|js|html|css|json)$/.test(n), new Set(['tests']));
  return [...sueltos, ...kit];
}

test('el motor no contiene nada de ningún curso concreto', () => {
  const fallos = [];
  for (const f of ficherosDelMotor()) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((linea, i) => {
      // "rsotor/profesor-kit" es el repo del kit, no contenido de curso
      if (PROHIBIDO.test(linea.replace(/rsotor\/profesor-kit/g, ''))) fallos.push(`${path.relative(RAIZ, f)}:${i + 1}`);
    });
  }
  assert.deepEqual(fallos, []);
});

test('están las siete skills, con name y description', () => {
  for (const nombre of SKILLS) {
    const fichero = path.join(RAIZ, '.kit', 'skills', nombre, 'SKILL.md');
    assert.ok(fs.existsSync(fichero), nombre);
    const fm = v.leerFrontmatter(fs.readFileSync(fichero, 'utf8'));
    assert.equal(fm.name, nombre);
    assert.ok(fm.description.length > 40, `${nombre}: description demasiado corta`);
  }
});

test('ninguna skill hace git a mano ni llama a check.sh', () => {
  for (const nombre of SKILLS) {
    const texto = fs.readFileSync(path.join(RAIZ, '.kit', 'skills', nombre, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(texto, /check\.sh|git add|git commit|git push/, nombre);
  }
});
