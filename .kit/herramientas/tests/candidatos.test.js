'use strict';
// candidatos.js (P5, 0.26.0): antes de crear una nota nueva, ¿ya existe algo parecido con otro nombre? El caso
// real: "fondo de reserva" y `colchon-financiero` son la misma idea, y un `grep` del slug no lo encuentra.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { candidatos, partir, palabras, cli } = require('../candidatos');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

// Un curso pequeño con los conceptos del módulo 1 y 2 del curso de ejemplo (dinero y presupuesto, interés): lo
// justo para que un caso pueda confundirse con varios y solo uno gane con claridad.
const INDICE = [
  'colchon-financiero | Dinero líquido guardado aparte para cubrir gastos si un mes se factura poco o pasa un imprevisto, y que se mide en meses de gastos cubiertos. | modulo-01 | 2 | alias: fondo de emergencia, colchón',
  'presupuesto-personal | Apuntar lo que entra y lo que sale cada mes para saber cuánto te queda. | modulo-01 | 1 | alias: presupuesto, ingreso medio',
  'tasa-de-ahorro | Qué parte de lo que ingresas te queda al final del mes, en porcentaje. | modulo-01 | 2 | alias: porcentaje de ahorro',
  'gastos-fijos-y-variables | Un gasto es fijo si se repite cada mes con la misma cifra, y variable si su cifra la decides tú cada mes. | modulo-01 | 2 | alias: gasto fijo, gasto variable',
  'interes-simple | Los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten. | modulo-02 | 2 | alias: interés simple',
  'interes-compuesto | Los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también. | modulo-02 | 3 | alias: interés compuesto, interés sobre interés',
].join('\n');

const nota = (titulo, bloque, alias) => `---\ntipo: concepto\nbloques: [${bloque}]\nrequiere: []\nalias: [${alias.join(', ')}]\n---\n# ${titulo}\n\n## El ejemplo\n\nUno.\n`;

function cursoDeEjemplo(extra = {}) {
  return cursoTemporal({
    'estudio/conceptos/_index.md': `# Índice\n\n## Conceptos\n\n\`\`\`\n${INDICE}\n\`\`\`\n`,
    'estudio/conceptos/colchon-financiero.md': nota('Colchón financiero', 'modulo-01', ['fondo de emergencia', 'colchón']),
    'estudio/conceptos/presupuesto-personal.md': nota('Presupuesto personal', 'modulo-01', ['presupuesto', 'ingreso medio']),
    'estudio/conceptos/tasa-de-ahorro.md': nota('Tasa de ahorro', 'modulo-01', ['porcentaje de ahorro']),
    'estudio/conceptos/gastos-fijos-y-variables.md': nota('Gastos fijos y variables', 'modulo-01', ['gasto fijo', 'gasto variable']),
    'estudio/conceptos/interes-simple.md': nota('Interés simple', 'modulo-02', ['interés simple']),
    'estudio/conceptos/interes-compuesto.md': nota('Interés compuesto', 'modulo-02', ['interés compuesto', 'interés sobre interés']),
    'estudio/progreso.md': '| Concepto | Teoría | Aplicación |\n|---|---|---|\n'
      + ['colchon-financiero', 'presupuesto-personal', 'tasa-de-ahorro', 'gastos-fijos-y-variables', 'interes-simple', 'interes-compuesto']
        .map(s => `| [[${s}]] | ⬜ | ⬜ |`).join('\n') + '\n',
    ...extra,
  });
}

test('partir: separa "nombre — definición"; sin guion, todo cuenta como las dos cosas', () => {
  assert.deepEqual(partir('fondo de reserva — dinero apartado para imprevistos'), { nombre: 'fondo de reserva', definicion: 'dinero apartado para imprevistos' });
  assert.deepEqual(partir('interés compuesto'), { nombre: 'interés compuesto', definicion: 'interés compuesto' });
});

test('el caso real: "fondo de reserva" sale como colchon-financiero, primero y con claridad', () => {
  const raiz = cursoDeEjemplo();
  const r = candidatos(raiz, 'fondo de reserva — dinero apartado para imprevistos, unos 3-6 meses de gastos');
  assert.ok(r.candidatos.length > 0);
  assert.equal(r.candidatos[0].slug, 'colchon-financiero');
  assert.ok(r.candidatos[0].puntuacion > (r.candidatos[1] ? r.candidatos[1].puntuacion : 0), 'gana con claridad, no por los pelos');
  assert.match(r.candidatos[0].senales.join(' '), /definición/);
});

test('interés compuesto: interes-simple sale como candidato, pero comprobar.js no avisa de duplicado entre los dos', () => {
  const raiz = cursoDeEjemplo();
  const r = candidatos(raiz, 'interés compuesto — los intereses de cada periodo se calculan sobre el capital y se reinvierten');
  assert.ok(r.candidatos.some(c => c.slug === 'interes-simple'), 'interes-simple tiene que aparecer entre los candidatos');

  const avisos = comprobar(raiz).avisos.filter(a => /duplicado/.test(a.regla));
  const deLosDos = avisos.filter(a => /interes-simple/.test(a.fichero) || /interes-compuesto/.test(a.detalle || ''));
  assert.equal(deLosDos.length, 0, 'no hay aviso permanente de duplicado por significado: sería ruido (interés simple/compuesto es un caso legítimo)');
});

test('sin nada parecido, dice que ninguno lo es (no fuerza un candidato de relleno)', () => {
  const raiz = cursoDeEjemplo();
  const r = candidatos(raiz, 'fotosíntesis — proceso por el que las plantas producen su propio alimento con luz solar');
  assert.deepEqual(r.candidatos, []);
});

test('solo lee: no escribe ni borra nada en el curso', () => {
  const raiz = cursoDeEjemplo();
  const antes = fs.readdirSync(path.join(raiz, 'estudio', 'conceptos')).sort();
  const contenidoAntes = antes.map(n => fs.readFileSync(path.join(raiz, 'estudio', 'conceptos', n), 'utf8'));

  const escribir = fs.writeFileSync;
  const crear = fs.mkdirSync;
  const borrar = fs.rmSync;
  fs.writeFileSync = () => { throw new Error('candidatos.js no debería escribir nada'); };
  fs.mkdirSync = () => { throw new Error('candidatos.js no debería crear nada'); };
  fs.rmSync = () => { throw new Error('candidatos.js no debería borrar nada'); };
  try {
    candidatos(raiz, 'fondo de reserva — dinero apartado para imprevistos');
    cli(['fondo de reserva — dinero apartado para imprevistos', '--json'], raiz);
  } finally {
    fs.writeFileSync = escribir;
    fs.mkdirSync = crear;
    fs.rmSync = borrar;
  }

  const despues = fs.readdirSync(path.join(raiz, 'estudio', 'conceptos')).sort();
  assert.deepEqual(despues, antes);
  despues.forEach((n, i) => assert.equal(fs.readFileSync(path.join(raiz, 'estudio', 'conceptos', n), 'utf8'), contenidoAntes[i]));
});

test('--json saca la consulta y los candidatos', () => {
  const raiz = cursoDeEjemplo();
  const r = candidatos(raiz, 'fondo de reserva — dinero apartado para imprevistos, unos 3-6 meses de gastos');
  assert.equal(r.consulta.nombre, 'fondo de reserva');
  assert.ok(r.candidatos[0].definicion.includes('imprevisto'));
});

test('palabras: el singular y el plural acaban en la misma raíz, también con tilde ("interés", "intereses")', () => {
  assert.deepEqual(palabras('interés intereses'), palabras('interes interes'));
  assert.equal(new Set(palabras('interés intereses')).size, 1);
});
