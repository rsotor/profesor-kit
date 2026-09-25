'use strict';
// Prueba pruebas/disparadores.js: las funciones puras que deciden qué skill eligió el asistente y el resumen.
// Nunca lanza claude de verdad: eso lo decide el mantenedor a mano (`npm run disparadores`).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  decidirEleccion, abrioGuia, acierta, markdownResumen, markdownGuias, datosDelCurso, reemplazarGuias,
  LIMITE_HERRAMIENTAS, LIMITE_HERRAMIENTAS_GUIA,
} = require('../../../pruebas/disparadores');
const casosGuia = require('../../../pruebas/lib/casos-guia');
const { leerPreparaciones } = require('../estado');
const { temporal, escribir } = require('./ayuda');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const usa = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });

test('decidirEleccion: la primera skill que usa es la elegida, aunque antes haya leído algo', () => {
  const lineas = [usa('Read', { file_path: 'config/curso.md' }), usa('Skill', { skill: 'dudas' }), usa('Skill', { skill: 'examen' })];
  assert.deepEqual(decidirEleccion(lineas), { decidido: true, skill: 'dudas' });
});

test('decidirEleccion: sin skill, sigue esperando hasta el límite de herramientas; entonces, ninguna', () => {
  const lectura = usa('Read', { file_path: 'x' });
  assert.deepEqual(decidirEleccion([lectura, lectura]), { decidido: false });
  assert.deepEqual(decidirEleccion(Array(LIMITE_HERRAMIENTAS).fill(lectura)), { decidido: true, skill: null, nota: `${LIMITE_HERRAMIENTAS} herramientas sin skill` });
  assert.ok(LIMITE_HERRAMIENTAS >= 10, 'AGENTS.md hace leer config/ antes: con menos se corta una skill que iba a llegar');
});

test('decidirEleccion: si termina sin usar ninguna skill (contestó en el chat), ninguna', () => {
  const fin = JSON.stringify({ type: 'result', result: 'Claro, ¿empezamos?' });
  assert.deepEqual(decidirEleccion([usa('Read', { file_path: 'x' }), fin]), { decidido: true, skill: null });
});

test('decidirEleccion: ignora líneas que no son JSON y el prefijo de un plugin en el nombre de la skill', () => {
  assert.deepEqual(decidirEleccion(['basura', usa('Skill', { skill: 'kit:repaso' })]), { decidido: true, skill: 'repaso' });
});

test('acierta: la esperada puede ser una skill, ninguna (null) o varias válidas', () => {
  assert.equal(acierta('dudas', 'dudas'), true);
  assert.equal(acierta(null, null), true);
  assert.equal(acierta('repaso', null), false);
  assert.equal(acierta(null, ['sesion', null]), true);
  assert.equal(acierta('examen', ['sesion', null]), false);
});

test('markdownResumen: aciertos por skill esperada y la lista de fallos con lo que eligió', () => {
  const md = markdownResumen({
    fecha: '2026-01-01', version: '0.25.0', modelo: 'sonnet',
    resultados: [
      { frase: 'tengo dudas', esperada: 'dudas', elegida: 'dudas' },
      { frase: '¿repasamos?', esperada: null, elegida: 'repaso' },
      { frase: 'hazme una página', esperada: 'repaso', elegida: 'repaso' },
    ],
  });
  assert.match(md, /\*\*2 de 3\*\* frases/);
  assert.match(md, /\| ninguna \| 0 \/ 1 \|/);
  assert.match(md, /"¿repasamos\?" → esperada ninguna, eligió `repaso`/);
});

test('las frases del repositorio son válidas: cada esperada es una skill que existe o ninguna', () => {
  const frases = JSON.parse(fs.readFileSync(path.join(RAIZ, 'pruebas', 'disparadores.json'), 'utf8')).frases;
  const skills = fs.readdirSync(path.join(RAIZ, '.kit', 'skills'));
  assert.ok(frases.length >= 40);
  for (const { frase, esperada } of frases) {
    assert.ok(typeof frase === 'string' && frase.trim(), 'frase vacía');
    for (const e of [].concat(esperada)) assert.ok(e === null || skills.includes(e), `${frase}: "${e}" no es una skill`);
  }
  assert.equal(new Set(frases.map(f => f.frase)).size, frases.length, 'frases repetidas');
});

test('datosDelCurso: el curso de ejemplo configurado, con el resultado de la prueba real encima', () => {
  const datos = datosDelCurso();
  for (const f of ['config/curso.md', 'config/profesor.md', 'config/estructura.json', 'estudio/progreso.md']) {
    assert.ok(fs.existsSync(path.join(datos, f)), `falta ${f}`);
  }
  const alumno = fs.readFileSync(path.join(datos, 'config', 'alumno.md'), 'utf8');
  assert.equal(alumno, fs.readFileSync(path.join(RAIZ, 'pruebas', 'curso-ejemplo', 'resultado', 'config', 'alumno.md'), 'utf8'));
  assert.doesNotMatch(fs.readFileSync(path.join(datos, 'config', 'curso.md'), 'utf8'), /estado: sin-configurar/);
  fs.rmSync(datos, { recursive: true, force: true });
});

// --- Casos de guía: "situación → debe abrir tal guía de .kit/guias/" (plan 0.26.0, tarea 1.3) --------------

test('abrioGuia: un Read de la guía esperada decide "abierta", aunque antes haya leído otra cosa', () => {
  const lineas = [usa('Read', { file_path: 'config/curso.md' }), usa('Read', { file_path: '.kit/guias/segundo-plano.md' })];
  assert.deepEqual(abrioGuia(lineas, 'segundo-plano.md'), { decidido: true, abierta: true });
});

test('abrioGuia: un Bash que cite la guía también cuenta como abierta (Read "o equivalente")', () => {
  const lineas = [usa('Bash', { command: 'cat .kit/guias/cuando-escribe-a-su-manera.md' })];
  assert.deepEqual(abrioGuia(lineas, 'cuando-escribe-a-su-manera.md'), { decidido: true, abierta: true });
});

test('abrioGuia: leer otra guía distinta no cuenta; sigue esperando', () => {
  const otra = usa('Read', { file_path: '.kit/guias/cuando-pide-a-su-manera.md' });
  assert.deepEqual(abrioGuia([otra], 'segundo-plano.md'), { decidido: false });
});

test('abrioGuia: sin abrirla, sigue esperando hasta el límite de herramientas; entonces, no abierta', () => {
  const lectura = usa('Read', { file_path: 'x' });
  assert.deepEqual(abrioGuia([lectura, lectura], 'segundo-plano.md'), { decidido: false });
  assert.deepEqual(
    abrioGuia(Array(LIMITE_HERRAMIENTAS_GUIA).fill(lectura), 'segundo-plano.md'),
    { decidido: true, abierta: false, nota: `${LIMITE_HERRAMIENTAS_GUIA} herramientas sin abrir la guía` },
  );
});

test('abrioGuia: si termina sin abrirla (contestó en el chat), no abierta', () => {
  const fin = JSON.stringify({ type: 'result', result: 'Ya está, ¿seguimos?' });
  assert.deepEqual(abrioGuia([usa('Read', { file_path: 'x' }), fin], 'segundo-plano.md'), { decidido: true, abierta: false, nota: 'terminó sin abrir la guía' });
});

test('markdownGuias: su propia tabla, con aciertos y la lista de fallos', () => {
  const l = markdownGuias([
    { frase: 'ya he estudiado la clase 1.1, ¿seguimos?', guia: 'cuando-escribe-a-su-manera.md', preparar: 'estudiada-a-su-manera', abierta: true },
    { frase: 'hola', guia: 'segundo-plano.md', preparar: 'preparacion-interrumpida', abierta: false, nota: 'terminó sin abrir la guía' },
  ]);
  const md = l.join('\n');
  assert.match(md, /## Guías/);
  assert.match(md, /\*\*1 de 2\*\* situaciones/);
  assert.match(md, /\| "ya he estudiado la clase 1\.1, ¿seguimos\?" \| estudiada-a-su-manera \| cuando-escribe-a-su-manera\.md \| ✅ \|/);
  assert.match(md, /"hola" \(preparacion-interrumpida\) → no abrió `segundo-plano\.md` \(terminó sin abrir la guía\)/);
});

test('markdownGuias: sin casos de guía, no añade nada', () => {
  assert.deepEqual(markdownGuias([]), []);
});

// --- reemplazarGuias: --solo-guias no puede pisar la tabla de frases de una ejecución completa anterior ------

test('reemplazarGuias: sustituye solo desde "## Guías" hasta el final, conserva la cabecera', () => {
  const anterior = '# Disparadores · claude-code\n\n- **Fecha:** 2026-01-01\n\n**2 de 3** frases eligen lo esperado.\n\n'
    + '## Guías\n\n**0 de 1** situaciones abren la guía esperada.\n\nVieja.\n';
  const nuevas = ['## Guías', '', '**1 de 1** situaciones abren la guía esperada.', '', 'Nueva.'];
  const resultado = reemplazarGuias(anterior, nuevas);
  assert.match(resultado, /\*\*2 de 3\*\* frases eligen lo esperado\./, 'conserva la tabla de frases de antes');
  assert.match(resultado, /\*\*1 de 1\*\* situaciones abren la guía esperada\./);
  assert.doesNotMatch(resultado, /Vieja\./);
});

test('reemplazarGuias: si no había sección "## Guías", la añade al final', () => {
  const anterior = '# Disparadores · claude-code\n\n**2 de 3** frases eligen lo esperado.\n';
  const resultado = reemplazarGuias(anterior, ['## Guías', '', 'Nueva.']);
  assert.match(resultado, /\*\*2 de 3\*\* frases eligen lo esperado\.[\s\S]*## Guías[\s\S]*Nueva\./);
});

test('reemplazarGuias: sin líneas de guías nuevas, deja la cabecera sola (sin sección "## Guías")', () => {
  const anterior = '# Disparadores · claude-code\n\n**2 de 3** frases eligen lo esperado.\n\n## Guías\n\nVieja.\n';
  assert.equal(reemplazarGuias(anterior, []), '# Disparadores · claude-code\n\n**2 de 3** frases eligen lo esperado.\n');
});

test('markdownResumen: sin frases de skills (--solo-guias), lo dice y saca solo la tabla de guías', () => {
  const md = markdownResumen({
    fecha: '2026-01-01', version: '0.26.0', modelo: 'sonnet', resultados: [],
    resultadosGuia: [{ frase: 'hola', guia: 'segundo-plano.md', preparar: 'preparacion-terminada', abierta: true }],
  });
  assert.match(md, /Sin frases de skills/);
  assert.match(md, /\*\*1 de 1\*\* situaciones/);
});

test('los casos de guía del repositorio son válidos: la guía existe y el preparador está implementado', () => {
  const casos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'pruebas', 'disparadores.json'), 'utf8')).casos_guia;
  const guias = fs.readdirSync(path.join(RAIZ, '.kit', 'guias'));
  assert.ok(casos.length >= 3);
  for (const { frase, guia, preparar } of casos) {
    assert.ok(typeof frase === 'string' && frase.trim(), 'frase vacía');
    assert.ok(guias.includes(guia), `"${guia}" no existe en .kit/guias/`);
    assert.ok(Object.prototype.hasOwnProperty.call(casosGuia.PREPARADORES, preparar), `"${preparar}" no es un preparador de casos-guia.js`);
  }
});

test('marcarEstudiadaASuManera: reescribe "estudiada" de la clase pedida al valor "a su manera"', () => {
  const destino = temporal('kit-guia-');
  escribir(destino, {
    'estudio/sesiones/01-01-01-el-dinero.md': '---\ntipo: sesion\nclases: [1.1]\nestudiada: true\n---\n# El dinero\n',
  });
  const r = casosGuia.marcarEstudiadaASuManera(destino, { clase: '1.1' });
  assert.equal(r.ok, true);
  const texto = fs.readFileSync(path.join(destino, 'estudio', 'sesiones', '01-01-01-el-dinero.md'), 'utf8');
  assert.match(texto, /^estudiada: sí$/m);
});

test('marcarEstudiadaASuManera: sin ninguna sesión de esa clase, dice por qué', () => {
  const destino = temporal('kit-guia-');
  escribir(destino, { 'estudio/sesiones/otra.md': '---\ntipo: sesion\nclases: [2.1]\nestudiada: true\n---\n# Otra\n' });
  const r = casosGuia.marcarEstudiadaASuManera(destino, { clase: '1.1' });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /1\.1/);
});

test('crearPreparacion: estado.js la lee "terminada", y "interrumpida" cuando el pid ya no está vivo', () => {
  const destino = temporal('kit-guia-');
  casosGuia.crearPreparacion(destino, { id: '02-02', resultado: 'terminada' });
  assert.deepEqual(leerPreparaciones(destino).map(p => p.resultado), ['terminada']);

  const otro = temporal('kit-guia-');
  casosGuia.crearPreparacion(otro, { id: '02-02', resultado: 'en-curso' });
  assert.deepEqual(leerPreparaciones(otro).map(p => p.resultado), ['interrumpida']);
});

// 2026-09-25: la medición se cruzó con el límite de uso de la cuenta y cada frase sin ejecutar salió como
// "ninguna" (57/76 falso). Un asistente que falla no elige nada: esa frase queda sin medir, no como fallo.
test('decidirEleccion: si el asistente falla (result con is_error), la frase queda sin medir', () => {
  const lineas = [JSON.stringify({ type: 'result', is_error: true, result: "You've hit your session limit · resets 12:40pm" })];
  const d = decidirEleccion(lineas);
  assert.equal(d.decidido, true);
  assert.equal(d.sinMedir, true);
  assert.match(d.nota, /session limit/);
  assert.equal(decidirEleccion([JSON.stringify({ type: 'result', is_error: false, result: 'hola' })]).sinMedir, undefined);
});

test('abrioGuia: si el asistente falla, el caso queda sin medir', () => {
  const d = abrioGuia([JSON.stringify({ type: 'result', is_error: true, result: 'API Error: 429' })], 'segundo-plano.md');
  assert.equal(d.sinMedir, true);
  assert.equal(d.abierta, false);
});

test('Codex: turn.failed deja la frase sin medir, con el mensaje del error', () => {
  const codex = require('../../../pruebas/lib/asistentes/codex');
  const d = decidirEleccion([JSON.stringify({ type: 'turn.failed', error: { message: 'usage limit reached' } })], codex);
  assert.equal(d.sinMedir, true);
  assert.match(d.nota, /usage limit/);
});

// Prueba real de la 0.26.0: el profesor escribió `clases: 1.1` (sin corchetes), que también es válido.
test('marcarEstudiadaASuManera: encuentra la clase con "clases: 1.1", "[1.1]" o "[\\"1.1\\"]"', () => {
  for (const clases of ['1.1', '[1.1]', '["1.1"]', '[1.0, 1.1]']) {
    const destino = temporal('kit-guia-');
    escribir(destino, { 'estudio/sesiones/01-01-01-el-dinero.md': `---\ntipo: sesion\nclases: ${clases}\nestudiada: true\n---\n# El dinero\n` });
    assert.equal(casosGuia.marcarEstudiadaASuManera(destino, { clase: '1.1' }).ok, true, clases);
  }
});
