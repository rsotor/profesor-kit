'use strict';
// Prueba pruebas/prueba-real.js desde aquí (mismo patrón que release-notas.test.js con un script fuera
// de .kit/): el montaje real (sin LLM, nunca con claude de verdad: eso lo decide el mantenedor a mano)
// y las funciones puras de formateo. No toca `pruebas/curso-ejemplo/resultado/`: el resultado de la
// prueba se escribe en una carpeta temporal, no en el del repo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { temporal } = require('./ayuda');
const { ejecutar, markdownResumen, agruparPorRegla, modeloRecomendado } = require('../../../pruebas/prueba-real');
const p = require('../../../pruebas/lib/pasos');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const EJEMPLO = path.join(RAIZ, 'pruebas', 'curso-ejemplo');

test('agruparPorRegla: agrupa y ordena de más a menos frecuente', () => {
  const grupos = agruparPorRegla([{ regla: 'a' }, { regla: 'b' }, { regla: 'a' }, { regla: 'a' }]);
  assert.deepEqual(grupos.map(([regla, items]) => [regla, items.length]), [['a', 3], ['b', 1]]);
});

test('markdownResumen: incluye el aviso de --sin-llm y las secciones fijas', () => {
  const md = markdownResumen({
    fecha: '2026-01-01', version: '0.21.0', modelo: 'sonnet', sinLlm: true,
    pasos: [{ paso: '/sesion 01-01', ok: null, duracionMs: 10, detalle: 'omitido (--sin-llm)' }],
    informe: { errores: [], avisos: [] },
    conteos: { conceptos: 0, sesiones: 0, flashcards: 0, ejercicios: 0, examenes: 0, repasos: 0, todo: 0, faltaInfo: 0, dudaPendiente: 0 },
  });
  assert.match(md, /Modo `--sin-llm`/);
  assert.match(md, /\*\*Versión del kit:\*\* 0\.21\.0/);
  assert.match(md, /\/sesion 01-01/);
  assert.match(md, /Conceptos: \*\*0\*\*/);
});

test('markdownResumen: agrupa errores y avisos por regla, con atención a no-se-vera-bien y pedagógicos', () => {
  const md = markdownResumen({
    fecha: '2026-01-01', version: '0.21.0', modelo: 'sonnet', sinLlm: false,
    pasos: [],
    informe: {
      errores: [{ regla: 'enlace-roto', fichero: 'sesiones/a.md', detalle: 'x' }],
      avisos: [{ regla: 'no-se-vera-bien', fichero: 'conceptos/a.md', detalle: 'y' }, { regla: 'concepto-sin-ejemplo', fichero: 'conceptos/b.md', detalle: 'z' }],
    },
    conteos: { conceptos: 2, sesiones: 1, flashcards: 1, ejercicios: 0, examenes: 0, repasos: 0, todo: 1, faltaInfo: 0, dudaPendiente: 0 },
  });
  assert.match(md, /enlace-roto/);
  assert.match(md, /no-se-vera-bien\*\* \(1\)/);
  assert.match(md, /pedagógicos\*\* \(1\)/);
});

test('modeloRecomendado: lee el modelo del adaptador del curso montado', () => {
  const destino = temporal('prueba-real-');
  fs.mkdirSync(path.join(destino, 'config'), { recursive: true });
  fs.mkdirSync(path.join(destino, '.kit', 'adaptadores'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'config', 'ajustes.json'), JSON.stringify({ llm: 'claude-code' }));
  fs.writeFileSync(path.join(destino, '.kit', 'adaptadores', 'claude-code.json'), JSON.stringify({ modelo_recomendado: { modelo: 'Sonnet' } }));
  assert.equal(modeloRecomendado(destino), 'Sonnet');
});

test('modeloRecomendado: si no hay adaptador, cae en "sonnet" por defecto', () => {
  const destino = temporal('prueba-real-');
  fs.mkdirSync(path.join(destino, 'config'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'config', 'ajustes.json'), JSON.stringify({ llm: 'algo-inventado' }));
  assert.equal(modeloRecomendado(destino), 'sonnet');
});

// Extremo a extremo, sin LLM: monta el curso de ejemplo de verdad (motor de esta copia de trabajo +
// pruebas/curso-ejemplo/), no llama a `claude`, y comprueba que el resultado se escribe donde se le
// diga (nunca en pruebas/curso-ejemplo/resultado/ real: eso solo lo toca quien ejecuta la prueba a
// mano). Es justo lo que hace `npm run prueba-real -- --sin-llm`, con el resultado redirigido.
test('ejecutar({ sinLlm: true }): monta, no llama a claude, y escribe un resultado coherente', () => {
  const resultadoDir = temporal('prueba-real-resultado-');
  const r = ejecutar({ sinLlm: true, trabajo: RAIZ, datosCurso: EJEMPLO, resultadoDir });

  assert.ok(r.pasos.length >= 8);
  assert.ok(r.pasos.every(paso => paso.ok === null));
  assert.deepEqual(r.informe.errores, []);

  const resumen = fs.readFileSync(path.join(resultadoDir, 'RESUMEN.md'), 'utf8');
  assert.match(resumen, /Modo `--sin-llm`/);
  assert.ok(fs.existsSync(path.join(resultadoDir, 'estudio', 'conceptos', '_index.md')));
  assert.ok(!fs.existsSync(path.join(resultadoDir, 'estudio', 'inbox')));
  assert.ok(!fs.existsSync(path.join(resultadoDir, 'estudio', '.obsidian')));
  assert.ok(fs.existsSync(path.join(resultadoDir, 'config', 'alumno.md')));
});

test('ejecutar: sustituye el resultado anterior entero, no lo mezcla', () => {
  const resultadoDir = temporal('prueba-real-resultado-');
  fs.mkdirSync(resultadoDir, { recursive: true });
  fs.writeFileSync(path.join(resultadoDir, 'sobrante-de-antes.txt'), 'x');
  ejecutar({ sinLlm: true, trabajo: RAIZ, datosCurso: EJEMPLO, resultadoDir });
  assert.ok(!fs.existsSync(path.join(resultadoDir, 'sobrante-de-antes.txt')));
});

const EXAMEN = [
  '---', 'tipo: examen', '---', '# Examen', '', '## Uno', '', '**1.** ¿Qué es A?', '', '✍️ **Tu respuesta:**', '',
  '**2.** ¿Y B?', '', '✍️ **Tu respuesta:**', '',
  '> [!success]- Soluciones', '> 1. A es la primera.', '> 2. B es la segunda.', '',
  '## Histórico de intentos', '', '| Intento | Fecha | Nota |', '|---|---|---|', '| 1 | 2026-10-01 | 5 |',
].join('\n');

test('examenSinSoluciones: quita callouts y el histórico, deja las preguntas', () => {
  const limpio = p.examenSinSoluciones(EXAMEN);
  assert.match(limpio, /¿Qué es A\?/);
  assert.doesNotMatch(limpio, /primera|Soluciones|Histórico/);
  assert.equal(p.contarHuecos(limpio), 2);
});

test('leerRespuestas: saca el JSON aunque venga con texto alrededor; si no hay, null', () => {
  assert.deepEqual(p.leerRespuestas('Aquí van:\n{"respuestas": ["A es la primera", ""]}\nListo.'), ['A es la primera', '']);
  assert.equal(p.leerRespuestas('no sé'), null);
  assert.equal(p.leerRespuestas('{"otra": 1}'), null);
});

test('ponerRespuestas: escribe cada una tras su hueco; si no cuadran, no toca nada', () => {
  const dir = temporal('alumno-simulado-');
  const f = path.join(dir, 'examen.md');
  fs.writeFileSync(f, EXAMEN);
  assert.deepEqual(p.ponerRespuestas(f, ['solo una']), { ok: false, huecos: 2, respuestas: 1 });
  assert.equal(fs.readFileSync(f, 'utf8'), EXAMEN);
  assert.deepEqual(p.ponerRespuestas(f, ['A es la primera', '']), { ok: true, huecos: 2, enBlanco: 1 });
  assert.match(fs.readFileSync(f, 'utf8'), /✍️ \*\*Tu respuesta:\*\* A es la primera\n/);
});

test('promptAlumnoSimulado: lleva el perfil, el examen y el número exacto de respuestas', () => {
  const prompt = p.promptAlumnoSimulado('PERFIL-X', 'EXAMEN-Y', 7);
  assert.match(prompt, /PERFIL-X/);
  assert.match(prompt, /EXAMEN-Y/);
  assert.match(prompt, /exactamente 7/);
});

test('markdownResumen: sección Mi perfil con secciones y señales', () => {
  const md = markdownResumen({ fecha: '2026-10-01', version: '0.23.0', modelo: 'sonnet', sinLlm: false, pasos: [],
    informe: { errores: [], avisos: [] }, conteos: {}, perfil: { existe: true, conContenido: 4, total: 5, senales: ['concepto-rojo: alfa'] } });
  assert.match(md, /## Mi perfil[\s\S]*4 de 5 secciones con contenido[\s\S]*concepto-rojo: alfa/);
});
