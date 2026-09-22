'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Las skills son texto: nadie comprueba que lo que nombran exista. Este test sí.
const RAIZ = path.resolve(__dirname, '..', '..', '..');
const DOCS = [
  'AGENTS.md', '.kit/ESTANDARES.md', '.kit/guias/INSTALACION.md', '.kit/guias/INSTALAR-AGENTE.md',
  ...fs.readdirSync(path.join(RAIZ, '.kit', 'skills')).map(s => `.kit/skills/${s}/SKILL.md`),
];
const existe = rel => fs.existsSync(path.join(RAIZ, ...rel.split('/')));

test('toda herramienta que nombran las skills y las guías existe', () => {
  const fallos = [];
  for (const doc of DOCS) {
    const texto = fs.readFileSync(path.join(RAIZ, doc), 'utf8');
    for (const m of texto.matchAll(/\.kit\/herramientas\/([a-z-]+\.js)/g)) {
      if (!existe(`.kit/herramientas/${m[1]}`)) fallos.push(`${doc} → ${m[1]}`);
    }
  }
  assert.deepEqual([...new Set(fallos)], []);
});

test('toda plantilla, guía y fichero de config que nombran existe', () => {
  const fallos = [];
  for (const doc of DOCS) {
    const texto = fs.readFileSync(path.join(RAIZ, doc), 'utf8');
    for (const m of texto.matchAll(/`(\.kit\/(?:plantillas|guias)\/[\w./-]+|config\/[\w-]+\.(?:md|json))`/g)) {
      const rel = m[1];
      // Los que crea el curso en marcha no están en la plantilla del kit.
      if (/^config\/(ajustes\.json|estructura\.json|diario\.md|adaptacion-llm\.md|feedback-pendiente\.md)$/.test(rel)) continue;
      if (!existe(rel)) fallos.push(`${doc} → ${rel}`);
    }
  }
  assert.deepEqual([...new Set(fallos)], []);
});

test('todo permiso de .claude/settings.json apunta a una herramienta que existe, y toda herramienta tiene permiso', () => {
  const permisos = JSON.parse(fs.readFileSync(path.join(RAIZ, '.claude', 'settings.json'), 'utf8')).permissions.allow;
  const permitidas = permisos.map(p => (/herramientas\/([a-z-]+\.js)/.exec(p) || [])[1]).filter(Boolean);
  const herramientas = fs.readdirSync(path.join(RAIZ, '.kit', 'herramientas')).filter(n => n.endsWith('.js'));
  assert.deepEqual(permitidas.filter(h => !herramientas.includes(h)), [], 'permiso a herramienta inexistente');
  assert.deepEqual(herramientas.filter(h => !permitidas.includes(h)), [], 'herramienta sin permiso: el alumno vería el diálogo');
});

test('cada skill cita al menos guardar.js o remite a otra skill que lo haga (nada queda sin guardar)', () => {
  for (const s of fs.readdirSync(path.join(RAIZ, '.kit', 'skills'))) {
    const texto = fs.readFileSync(path.join(RAIZ, '.kit', 'skills', s, 'SKILL.md'), 'utf8');
    assert.ok(/guardar\.js|actualizar\.js/.test(texto), `${s}: no guarda al terminar`);
  }
});
