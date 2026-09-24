'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '..', '..', 'adaptadores');
const adaptadores = fs.readdirSync(DIR).filter(n => n.endsWith('.json')).map(n => [n.slice(0, -5), JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'))]);
const filas = fs.readFileSync(path.join(DIR, 'LEEME.md'), 'utf8').split(/\r?\n/)
  .map(l => /^\| `([\w-]+)` \|(.*)\|\s*$/.exec(l)).filter(Boolean).map(m => [m[1], m[2].split('|').map(c => c.trim())])
  .filter(([, celdas]) => celdas.length === 5);   // la tabla de modelos; la matriz de soporte tiene otras columnas

// modelo_recomendado es opcional: un adaptador puede existir sin que nadie haya comparado modelos todavía
// (issue #33). Cuando existe, tiene que venir completo; cuando no, la tabla lo dice con "— (sin comparar)".
test('cada adaptador del kit tiene los campos obligatorios; el modelo recomendado, si existe, viene completo', () => {
  assert.ok(adaptadores.length > 0);
  for (const [id, a] of adaptadores) {
    for (const campo of ['comando', 'skills', 'probado']) assert.ok(a[campo], `${id} sin ${campo}`);
    if (a.modelo_recomendado) {
      const m = a.modelo_recomendado;
      assert.ok(m.modelo && m.por_que && /^\d{4}-\d{2}-\d{2}$/.test(m.comprobado), `${id}: modelo_recomendado incompleto`);
    }
  }
});

test('la tabla de .kit/adaptadores/LEEME.md dice lo mismo que los adaptadores (ni sobra ni falta ninguno)', () => {
  assert.deepEqual(filas.map(f => f[0]).sort(), adaptadores.map(a => a[0]).sort());
  for (const [id, [probado, modelo, porQue, comprobado, segundoPlano]] of filas) {
    const a = Object.fromEntries(adaptadores)[id];
    assert.equal(probado, a.probado, `${id}: "Probado en"`);
    if (a.modelo_recomendado) {
      assert.equal(modelo, a.modelo_recomendado.modelo, `${id}: modelo`);
      assert.equal(porQue, a.modelo_recomendado.por_que, `${id}: por qué`);
      assert.equal(comprobado, a.modelo_recomendado.comprobado, `${id}: comprobado`);
    } else {
      assert.equal(modelo, '— (sin comparar)', `${id}: sin modelo_recomendado, la tabla tiene que decir "— (sin comparar)"`);
    }
    assert.equal(segundoPlano, a.segundo_plano ? 'sí' : 'no', `${id}: "Segundo plano"`);
  }
});

// issue #39, H11: el segundo plano trabaja sin nadie delante con material que puede traer órdenes escondidas.
// Sin red: nada de lo que lea puede salir del ordenador ni traer instrucciones de fuera.
test('el segundo plano de Claude Code va sin red (WebFetch y WebSearch denegados)', () => {
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'adaptadores', 'claude-code.json'), 'utf8'));
  const i = a.segundo_plano.indexOf('--disallowedTools');
  assert.ok(i >= 0);
  assert.deepEqual(a.segundo_plano.slice(i + 1), ['WebFetch', 'WebSearch'], 'al final: la lista se come lo que venga detrás');
});

// issue #39, H09: contrato versionado, con su id, el id exacto del modelo y qué hay probado de verdad en cada sistema.
test('cada adaptador del kit: schema_version, id igual a su nombre, id del modelo, y su matriz de soporte con evidencia', () => {
  const ESTADOS = ['probado', 'con-limitaciones', 'experimental', 'no-disponible'];
  for (const [id, a] of adaptadores) {
    assert.equal(a.schema_version, 1, `${id}: schema_version`);
    assert.equal(a.id, id, `${id}: el id es el nombre del fichero`);
    if (a.modelo_recomendado) assert.match(a.modelo_recomendado.id || '', /^[\w.:-]+$/, `${id}: modelo_recomendado.id, el que entiende el asistente`);
    assert.ok(Array.isArray(a.soporte) && a.soporte.length, `${id}: soporte`);
    for (const s of a.soporte) {
      assert.ok(ESTADOS.includes(s.estado), `${id}/${s.sistema}: estado "${s.estado}"`);
      assert.ok(s.evidencia && s.evidencia.length > 10, `${id}/${s.sistema}: evidencia`);
      if (s.estado === 'probado') assert.match(s.evidencia, /\d{4}-\d{2}-\d{2}/, `${id}/${s.sistema}: "probado" lleva fecha`);
    }
  }
});

test('la matriz de soporte de LEEME.md dice lo mismo que los adaptadores', () => {
  const texto = fs.readFileSync(path.join(DIR, 'LEEME.md'), 'utf8');
  const matriz = [...texto.matchAll(/^\| `([\w-]+)` \| (\w+) \| ([\w-]+) \| (.+) \|$/gm)].map(m => [m[1], m[2], m[3], m[4]]);
  const esperada = adaptadores.flatMap(([id, a]) => a.soporte.map(s => [id, s.sistema, s.estado, s.evidencia]));
  assert.deepEqual(matriz.sort(), esperada.sort());
});
