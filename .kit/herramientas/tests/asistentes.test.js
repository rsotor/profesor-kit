'use strict';
// Lanzadores de asistente para las pruebas del kit (issue #45, plan-lanzadores): con Claude Code nada cambia
// (mismos args exactos, byte a byte); Codex se prueba entero con fixtures sintéticas — sin sesión instalada,
// nunca se lanza de verdad (npm run prueba-real/disparadores sin --sin-llm cuesta cuota y aquí no hay).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { temporal } = require('./ayuda');
const claudeCode = require('../../../pruebas/lib/asistentes/claude-code');
const codex = require('../../../pruebas/lib/asistentes/codex');
const { lanzadorPara } = require('../../../pruebas/lib/asistentes');
const {
  decidirEleccion, abrioGuia, markdownResumen: markdownResumenDisparadores, rutaResultado: rutaResultadoDisparadores,
  ejecutarAsistente, stdioDeEntrada,
} = require('../../../pruebas/disparadores');
const {
  modeloRecomendado, markdownResumen: markdownResumenReal, ejecutar: ejecutarPruebaReal, rutaResultado: rutaResultadoPruebaReal,
} = require('../../../pruebas/prueba-real');
const { montarCurso } = require('../../../pruebas/lib/montaje');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const EJEMPLO = path.join(RAIZ, 'pruebas', 'curso-ejemplo');
const CODEX_JSON = JSON.parse(fs.readFileSync(path.join(RAIZ, '.kit', 'adaptadores', 'codex.json'), 'utf8'));

// --- 1. Claude: argsTarea/argsSondeo, byte a byte como antes de moverlos a lib/asistentes/ ------------------

test('claude-code.argsTarea: mismos argumentos que argsClaude de siempre; el prompt va en los argumentos, no en la entrada', () => {
  const cwd = temporal('kit-asistente-claude-');
  const { args, entrada } = claudeCode.argsTarea({ prompt: 'hola', modelo: 'sonnet', cwd });
  assert.deepEqual(args, ['-p', 'hola', '--model', 'sonnet', '--permission-mode', 'acceptEdits', '--permission-prompts', 'none', '--output-format', 'json']);
  assert.equal(entrada, undefined);
});

test('claude-code.argsTarea: las reglas de .claude/settings.json del cwd van en --allowedTools, al final', () => {
  const cwd = temporal('kit-asistente-claude-');
  fs.mkdirSync(path.join(cwd, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: ['Bash(git status *)'] } }));
  const { args } = claudeCode.argsTarea({ prompt: 'x', modelo: 'm', cwd });
  assert.deepEqual(args.slice(-2), ['--allowedTools', 'Bash(git status *)']);
});

test('claude-code.argsSondeo: sin permisos de escritura, en stream, y sin entrada (el prompt va en el argumento)', () => {
  const { args, entrada } = claudeCode.argsSondeo({ prompt: 'hola', modelo: 'sonnet' });
  assert.deepEqual(args, ['-p', 'hola', '--model', 'sonnet', '--permission-mode', 'default', '--permission-prompts', 'none', '--output-format', 'stream-json', '--verbose']);
  assert.equal(entrada, undefined);
});

// --- 2. Codex: args desde el segundo_plano del adaptador, prompt por stdin ----------------------------------

test('codex.argsTarea: sale de segundo_plano del adaptador; el prompt no va en args, va en entrada; lleva --json y web_search=disabled', () => {
  const cwd = temporal('kit-asistente-codex-');
  const { args, entrada } = codex.argsTarea({ prompt: 'hola codex', modelo: null, cwd, adaptador: CODEX_JSON });
  assert.equal(entrada, 'hola codex');
  assert.ok(!args.includes('hola codex'), 'el prompt nunca va como argumento');
  assert.ok(args.includes('--json'));
  assert.ok(args.includes('web_search=disabled'));
  assert.ok(args.includes('--sandbox') && args[args.indexOf('--sandbox') + 1] === 'workspace-write');
  assert.ok(!args.includes('-m'), 'sin modelo, no hay -m');
});

test('codex.argsTarea: con modelo, añade -m <modelo>', () => {
  const cwd = temporal('kit-asistente-codex-');
  const { args } = codex.argsTarea({ prompt: 'x', modelo: 'gpt-5.1-codex', cwd, adaptador: CODEX_JSON });
  assert.equal(args[args.indexOf('-m') + 1], 'gpt-5.1-codex');
});

test('codex.argsSondeo: solo lectura (read-only), nunca workspace-write', () => {
  const cwd = temporal('kit-asistente-codex-');
  const { args } = codex.argsSondeo({ prompt: 'x', modelo: null, cwd, adaptador: CODEX_JSON });
  assert.equal(args[args.indexOf('--sandbox') + 1], 'read-only');
  assert.ok(!args.includes('workspace-write'));
});

test('codex.argsTarea/argsSondeo: sin el "-" final del prompt por stdin, con --ephemeral e --ignore-user-config', () => {
  const cwd = temporal('kit-asistente-codex-');
  const { args: argsTarea } = codex.argsTarea({ prompt: 'x', modelo: null, cwd, adaptador: CODEX_JSON });
  const { args: argsSondeo } = codex.argsSondeo({ prompt: 'x', modelo: null, cwd, adaptador: CODEX_JSON });
  for (const args of [argsTarea, argsSondeo]) {
    assert.ok(!args.includes('-'), 'el "-" (prompt por stdin) no es un argumento: el prompt va por stdin de verdad');
    assert.ok(args.includes('--ephemeral'));
    assert.ok(args.includes('--ignore-user-config'));
  }
});

// --- Confianza de la carpeta: la ruta va en el VALOR, nunca en la clave (openai/codex#35780) ------------------

test('codex.argsTarea: la confianza va en el valor de "projects" (TOML en línea), con la ruta canónica; approval_policy sin comillas', () => {
  // Una carpeta con puntos y espacios en el nombre: si la ruta fuera la CLAVE (`projects."<ruta>".trust_level`),
  // Codex la partiría por cada punto — con la ruta en el valor, da igual cuántos puntos traiga.
  const cwd = path.join(temporal('kit.codex 45.'), 'curso real');
  fs.mkdirSync(cwd, { recursive: true });
  const { args } = codex.argsTarea({ prompt: 'x', modelo: null, cwd, adaptador: CODEX_JSON });
  const i = args.indexOf('-c');
  const valores = [];
  for (let j = 0; j < args.length; j++) if (args[j] === '-c') valores.push(args[j + 1]);
  const confianza = valores.find(v => v.startsWith('projects='));
  assert.ok(confianza, 'falta la anulación de confianza');
  assert.equal(confianza, `projects={${JSON.stringify(fs.realpathSync(cwd))}={trust_level="trusted"}}`);
  assert.ok(!confianza.includes('projects.'), 'la ruta no puede ir como parte de la clave');
  assert.ok(valores.includes('approval_policy=never'), 'approval_policy sin comillas');
  assert.ok(i >= 0);
});

// --- 3. eventos de Codex: detectar la skill leída, sin confundirla con cualquier lectura ---------------------

const itemStarted = item => JSON.stringify({ type: 'item.started', item });
const itemCompleted = item => JSON.stringify({ type: 'item.completed', item });
const commandExec = (id, command) => ({ id, type: 'command_execution', command, status: 'completed' });

test('codex.eventos: un comando que lee UNA SKILL.md concreta es la skill, en cualquier forma de citarla', () => {
  const casos = [
    "sed -n '1,200p' .agents/skills/dudas/SKILL.md",
    '/curso/.agents/skills/dudas/SKILL.md',
    'bash -lc "cat .agents/skills/dudas/SKILL.md"',
    '.agents\\skills\\dudas\\SKILL.md',
  ];
  for (const command of casos) {
    assert.deepEqual(codex.eventos(itemCompleted(commandExec('i1', command))), [{ tipo: 'skill', id: 'i1', skill: 'dudas' }], command);
  }
});

test('codex.eventos: sin citar ninguna SKILL.md, o citando dos, es una herramienta cualquiera', () => {
  assert.deepEqual(codex.eventos(itemCompleted(commandExec('i2', 'ls .agents/skills'))), [{ tipo: 'herramienta', id: 'i2', nombre: 'Bash', entrada: { command: 'ls .agents/skills' } }]);
  assert.deepEqual(codex.eventos(itemCompleted(commandExec('i3', 'rg foo .agents/skills')))[0].tipo, 'herramienta');
  const dos = 'diff .agents/skills/dudas/SKILL.md .agents/skills/examen/SKILL.md';
  assert.equal(codex.eventos(itemCompleted(commandExec('i4', dos)))[0].tipo, 'herramienta');
});

test('codex.eventos: agent_message es texto; turn.completed/turn.failed son fin; "error" NO es fin (el proceso sigue)', () => {
  assert.deepEqual(codex.eventos(itemCompleted({ id: 'i5', type: 'agent_message', text: 'hola' })), [{ tipo: 'texto', texto: 'hola' }]);
  assert.deepEqual(codex.eventos(JSON.stringify({ type: 'turn.completed', usage: {} })), [{ tipo: 'fin', ok: true }]);
  assert.deepEqual(codex.eventos(JSON.stringify({ type: 'turn.failed', error: {} })), [{ tipo: 'fin', ok: false }]);
  assert.deepEqual(codex.eventos(JSON.stringify({ type: 'error', message: 'x' })), [{ tipo: 'texto', texto: 'x' }]);
});

// --- 4. decidirEleccion/abrioGuia sobre un stream sintético completo de Codex --------------------------------

test('decidirEleccion (lanzador codex): started+completed del mismo id cuentan una vez; skill tras 3 comandos', () => {
  const lineas = [
    itemStarted(commandExec('a', 'ls .agents/skills')), itemCompleted(commandExec('a', 'ls .agents/skills')),
    itemStarted(commandExec('b', 'cat config/curso.md')), itemCompleted(commandExec('b', 'cat config/curso.md')),
    itemStarted(commandExec('c', 'cat config/profesor.md')), itemCompleted(commandExec('c', 'cat config/profesor.md')),
    itemStarted(commandExec('d', 'sed -n 1,50p .agents/skills/dudas/SKILL.md')), itemCompleted(commandExec('d', 'sed -n 1,50p .agents/skills/dudas/SKILL.md')),
  ];
  assert.deepEqual(decidirEleccion(lineas, codex), { decidido: true, skill: 'dudas' });
});

test('abrioGuia (lanzador codex): abre la guía citada en un comando; termina sin abrirla si no llega', () => {
  const lineas = [
    itemStarted(commandExec('a', 'cat config/curso.md')), itemCompleted(commandExec('a', 'cat config/curso.md')),
    itemStarted(commandExec('b', 'cat .kit/guias/segundo-plano.md')), itemCompleted(commandExec('b', 'cat .kit/guias/segundo-plano.md')),
  ];
  assert.deepEqual(abrioGuia(lineas, 'segundo-plano.md', codex), { decidido: true, abierta: true });
  assert.deepEqual(abrioGuia([JSON.stringify({ type: 'turn.completed' })], 'segundo-plano.md', codex), { decidido: true, abierta: false, nota: 'terminó sin abrir la guía' });
});

test('decidirEleccion (lanzador Claude, por defecto): ids distintos en el JSON no cambian nada, cada herramienta cuenta (equivalencia estricta con HEAD)', () => {
  const conId = (nombre, id) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: nombre, input: {} }] } });
  const lineas = Array.from({ length: 12 }, (_, i) => conId('Read', `toolu_${i}`));
  const r = decidirEleccion(lineas);
  assert.equal(r.decidido, true);
  assert.equal(r.skill, null, 'con Claude, un id distinto en cada línea no las deduplica: siguen contando todas');
});

// --- 5. leerSalida de Codex: último mensaje, denegaciones, texto tal cual si no es JSONL ---------------------

test('codex.leerSalida: el último agent_message, y las denegaciones "declined" o "failed" con la salida de un permiso real', () => {
  const lineas = [
    itemCompleted({ id: 'm1', type: 'agent_message', text: 'primero' }),
    itemCompleted({ id: 'e1', type: 'command_execution', command: 'echo hola > config/curso.md', status: 'failed', aggregated_output: 'Read-only file system' }),
    itemCompleted({ id: 'e2', type: 'file_change', changes: [{ path: 'config/x.md', kind: 'update' }], status: 'declined' }),
    itemCompleted({ id: 'm2', type: 'agent_message', text: 'último' }),
  ].join('\n');
  const r = codex.leerSalida(lineas);
  assert.equal(r.texto, 'último');
  assert.deepEqual(r.denegaciones, [
    { herramienta: 'Bash', detalle: 'echo hola > config/curso.md' },
    { herramienta: 'file_change', detalle: 'config/x.md' },
  ]);
});

test('codex.leerSalida: "failed" sin la salida de un permiso real no es denegación (un `rg` sin resultados también sale failed)', () => {
  const linea = itemCompleted({ id: 'e3', type: 'command_execution', command: 'rg patron-que-no-existe', status: 'failed', aggregated_output: '' });
  assert.deepEqual(codex.leerSalida(linea).denegaciones, []);
});

test('codex.leerSalida: "completed" nunca es denegación, aunque su salida mencione "sandbox"', () => {
  const linea = itemCompleted({ id: 'e4', type: 'command_execution', command: 'cat .codex/config.toml', status: 'completed', aggregated_output: 'sandbox_mode = "workspace-write"' });
  assert.deepEqual(codex.leerSalida(linea).denegaciones, []);
});

test('codex.leerSalida: sin JSONL (codex falló antes de empezar), el texto tal cual', () => {
  assert.deepEqual(codex.leerSalida('no encuentro el binario\n'), { texto: 'no encuentro el binario', denegaciones: [] });
});

// --- 6. comprobar, con `ejecutar` inyectado: ENOENT, sin sesión, ok ------------------------------------------

test('codex.comprobar: ENOENT en `codex --version`', () => {
  const r = codex.comprobar({ ejecutar: () => ({ error: { code: 'ENOENT' }, status: null }) });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'no-encontrado');
  assert.match(r.mensaje, /No encuentro `codex`/);
});

test('codex.comprobar: instalado pero sin sesión (`codex login status` código 1, "Not logged in")', () => {
  const r = codex.comprobar({
    ejecutar: (bin, args) => (args[0] === '--version' ? { status: 0, stdout: 'codex-cli 0.156.1\n' } : { status: 1, stdout: '', stderr: 'Not logged in\n' }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'sin-sesion');
  assert.match(r.mensaje, /codex login/);
});

test('codex.comprobar: instalado y con sesión, ok', () => {
  const r = codex.comprobar({ ejecutar: (bin, args) => (args[0] === '--version' ? { status: 0 } : { status: 0 }) });
  assert.deepEqual(r, { ok: true, motivo: null, mensaje: '' });
});

test('lanzadorPara: id sin lanzador da un error claro; claude-code y codex se resuelven', () => {
  assert.equal(lanzadorPara({ id: 'claude-code' }), claudeCode);
  assert.equal(lanzadorPara({ id: 'codex' }), codex);
  assert.throws(() => lanzadorPara({ id: 'gemini' }), /gemini/);
});

// --- 7. modeloRecomendado: Codex sin recomendado → null; Claude sin nada → 'sonnet' ---------------------------

test('modeloRecomendado: Codex (sin modelo_recomendado en su adaptador) no fuerza ningún modelo', () => {
  const destino = temporal('prueba-real-codex-');
  fs.mkdirSync(path.join(destino, 'config'), { recursive: true });
  fs.mkdirSync(path.join(destino, '.kit', 'adaptadores'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'config', 'ajustes.json'), JSON.stringify({ llm: 'codex' }));
  fs.writeFileSync(path.join(destino, '.kit', 'adaptadores', 'codex.json'), JSON.stringify({ id: 'codex' }));
  assert.equal(modeloRecomendado(destino), null);
});

test('modeloRecomendado: Claude Code sin modelo_recomendado cae en "sonnet"', () => {
  const destino = temporal('prueba-real-claude-');
  fs.mkdirSync(path.join(destino, 'config'), { recursive: true });
  fs.mkdirSync(path.join(destino, '.kit', 'adaptadores'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'config', 'ajustes.json'), JSON.stringify({ llm: 'claude-code' }));
  fs.writeFileSync(path.join(destino, '.kit', 'adaptadores', 'claude-code.json'), JSON.stringify({ id: 'claude-code' }));
  assert.equal(modeloRecomendado(destino), 'sonnet');
});

// --- 8. montarCurso({ llm: 'codex' }) --------------------------------------------------------------------------

test('montarCurso({ llm: "codex" }): deja ajustes.llm en codex y las skills instaladas en .agents/skills', () => {
  const { destino } = montarCurso({ trabajo: RAIZ, datosCurso: EJEMPLO, nombre: 'curso-ejemplo', llm: 'codex' });
  const ajustes = JSON.parse(fs.readFileSync(path.join(destino, 'config', 'ajustes.json'), 'utf8'));
  assert.equal(ajustes.llm, 'codex');
  assert.ok(fs.existsSync(path.join(destino, '.agents', 'skills', 'sesion', 'SKILL.md')));
  fs.rmSync(destino, { recursive: true, force: true });
});

// --- 9. ejecutar({ sinLlm: true, asistente: 'codex' }): el RESUMEN dice qué asistente se usó -------------------

test('ejecutar({ sinLlm: true, asistente: "codex" }): el RESUMEN.md dice "Asistente: codex"', () => {
  const resultadoDir = temporal('prueba-real-resultado-codex-');
  const r = ejecutarPruebaReal({ sinLlm: true, trabajo: RAIZ, datosCurso: EJEMPLO, resultadoDir, asistente: 'codex' });
  assert.ok(r.pasos.length >= 8);
  const resumen = fs.readFileSync(path.join(resultadoDir, 'RESUMEN.md'), 'utf8');
  assert.match(resumen, /- \*\*Asistente:\*\* codex/);
});

test('markdownResumen (prueba real): con Claude, la línea "Asistente" dice claude-code (por defecto, sin cambiar lo de siempre)', () => {
  const md = markdownResumenReal({
    fecha: '2026-01-01', version: '0.26.0', modelo: 'sonnet', sinLlm: true,
    pasos: [], informe: { errores: [], avisos: [] },
    conteos: { conceptos: 0, sesiones: 0, flashcards: 0, ejercicios: 0, examenes: 0, repasos: 0, todo: 0, faltaInfo: 0, dudaPendiente: 0 },
  });
  assert.match(md, /- \*\*Asistente:\*\* claude-code/);
});

// --- 10. markdownResumen de disparadores: título y datos según el asistente -----------------------------------

test('markdownResumen (disparadores): con id "codex", el título es "# Disparadores · codex"', () => {
  const md = markdownResumenDisparadores({ fecha: '2026-01-01', version: '0.26.0', modelo: null, resultados: [], asistente: 'codex' });
  assert.match(md, /^# Disparadores · codex$/m);
});

test('markdownResumen (disparadores): sin asistente, el título sigue siendo "# Disparadores · claude-code"', () => {
  const md = markdownResumenDisparadores({ fecha: '2026-01-01', version: '0.26.0', modelo: 'sonnet', resultados: [] });
  assert.match(md, /^# Disparadores · claude-code$/m);
});

// --- rutaResultado('claude-code'): la de siempre, exacta, en los dos scripts -----------------------------------

test('rutaResultado (prueba real): con claude-code (o sin nada), la ruta de siempre; con otro id, aparte', () => {
  assert.equal(rutaResultadoPruebaReal('claude-code'), path.join(EJEMPLO, 'resultado'));
  assert.equal(rutaResultadoPruebaReal(), path.join(EJEMPLO, 'resultado'));
  assert.match(rutaResultadoPruebaReal('codex'), /resultado-codex-/);
});

test('rutaResultado (disparadores): con claude-code (o sin nada), disparadores-claude-code.md; con otro id, aparte', () => {
  const RAIZ_PRUEBAS = path.join(RAIZ, 'pruebas');
  assert.equal(rutaResultadoDisparadores('claude-code'), path.join(RAIZ_PRUEBAS, 'disparadores-claude-code.md'));
  assert.equal(rutaResultadoDisparadores(), path.join(RAIZ_PRUEBAS, 'disparadores-claude-code.md'));
  assert.equal(rutaResultadoDisparadores('codex'), path.join(RAIZ_PRUEBAS, 'disparadores-codex.md'));
});

// --- Windows: comoEjecutar pasa por comoLanzar (preparar.js); Codex, con el fallback al script npm -------------

test('claude-code.comoEjecutar: en macOS/Linux es un paso directo (identidad)', () => {
  const plan = claudeCode.argsTarea({ prompt: 'hola', modelo: 'sonnet', cwd: temporal('kit-asistente-claude-') });
  const r = claudeCode.comoEjecutar(plan, { plataforma: 'darwin' });
  assert.deepEqual(r, { ejecutable: 'claude', args: plan.args, entrada: plan.entrada });
});

test('codex.comoEjecutar: en macOS/Linux es un paso directo (identidad)', () => {
  const cwd = temporal('kit-asistente-codex-');
  const plan = codex.argsTarea({ prompt: 'hola', modelo: null, cwd, adaptador: CODEX_JSON });
  const r = codex.comoEjecutar(plan, { plataforma: 'darwin' });
  assert.deepEqual(r, { ejecutable: 'codex', args: plan.args, entrada: plan.entrada });
});

test('codex.comoEjecutar en Windows: un .cmd con el script npm al lado se lanza con node, sin cmd.exe, argumentos libres', () => {
  const cwd = temporal('kit-asistente-codex-');
  const plan = codex.argsTarea({ prompt: 'hola', modelo: null, cwd, adaptador: CODEX_JSON });
  const dir = temporal('kit-bin-windows-');
  fs.writeFileSync(path.join(dir, 'codex.cmd'), '@echo off\r\n');
  const script = path.join(dir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.writeFileSync(script, '// codex real\n');
  const entorno = { PATH: dir, PATHEXT: '.EXE;.CMD' };
  const r = codex.comoEjecutar(plan, { plataforma: 'win32', entorno });
  assert.equal(r.ejecutable, process.execPath);
  assert.deepEqual(r.args, [script, ...plan.args]);
  assert.equal(r.entrada, plan.entrada);
  assert.ok(!r.literal, 'sin cmd.exe de por medio: los argumentos van libres, no como una única cadena');
});

test('codex.comoEjecutar en Windows: un .cmd SIN el script npm al lado da un error claro', () => {
  const cwd = temporal('kit-asistente-codex-');
  const plan = codex.argsTarea({ prompt: 'hola', modelo: null, cwd, adaptador: CODEX_JSON });
  const dir = temporal('kit-bin-windows-');
  fs.writeFileSync(path.join(dir, 'codex.cmd'), '@echo off\r\n');
  const entorno = { PATH: dir, PATHEXT: '.EXE;.CMD' };
  const r = codex.comoEjecutar(plan, { plataforma: 'win32', entorno });
  assert.match(r.error, /no encuentro el script de Codex/);
});

// --- Test 11 del plan: un asistente falso que lee stdin de verdad, lanzado con ejecutarAsistente ----------------

const ASISTENTE_DE_STREAM = path.join(__dirname, 'asistente-de-stream.js');
const PROMPT_LARGO = 'Prompt de verdad, con acentos: ñ, y varias líneas.\nSegunda línea.\nTercera.';

// Lanzador falso, con la misma forma que claude-code/codex: solo lo que ejecutarAsistente necesita.
function lanzadorDeStream({ conEntrada }) {
  return {
    comando: process.execPath,
    entorno: () => process.env,
    argsSondeo: ({ prompt }) => ({ args: [], entrada: conEntrada ? prompt : undefined }),
    comoEjecutar: (plan, extra) => ({ ejecutable: process.execPath, args: [ASISTENTE_DE_STREAM, ...(extra || [])], entrada: plan.entrada }),
  };
}

test('ejecutarAsistente: con entrada, el prompt llega entero por stdin y el proceso se corta en cuanto decide', { timeout: 8000 }, async () => {
  const destino = temporal('kit-stream-');
  const eco = path.join(destino, 'eco.txt');
  const lanzador = lanzadorDeStream({ conEntrada: true });
  lanzador.comoEjecutar = plan => ({ ejecutable: process.execPath, args: [ASISTENTE_DE_STREAM, '--eco-a', eco], entrada: plan.entrada });
  const inicio = Date.now();
  const r = await ejecutarAsistente({
    lanzador, adaptador: {}, frase: PROMPT_LARGO, destino, modelo: null,
    detectar: lineas => decidirEleccion(lineas, codex),
    sinDecidir: nota => ({ decidido: true, skill: null, nota }),
  });
  assert.equal(r.skill, 'dudas');
  assert.ok(Date.now() - inicio < 5000, 'se corta al decidir: no espera el LIMITE_MS de 3 minutos');
  assert.equal(fs.readFileSync(eco, 'utf8'), PROMPT_LARGO, 'el prompt llegó entero por stdin');
});

test('ejecutarAsistente: sin entrada (como Claude Code), stdin va "ignore": no se cuelga esperando escribirle nada', { timeout: 8000 }, async () => {
  const destino = temporal('kit-stream-');
  const lanzador = lanzadorDeStream({ conEntrada: false });
  const r = await ejecutarAsistente({
    lanzador, adaptador: {}, frase: 'hola', destino, modelo: null,
    detectar: lineas => decidirEleccion(lineas, codex),
    sinDecidir: nota => ({ decidido: true, skill: null, nota }),
  });
  assert.equal(r.skill, 'dudas');
});

test('ejecutarAsistente: un comando inexistente resuelve con "no arrancó", no se cuelga hasta el tiempo agotado', { timeout: 8000 }, async () => {
  const destino = temporal('kit-stream-');
  const lanzador = {
    comando: 'no-existe-de-verdad-xyz', entorno: () => process.env,
    argsSondeo: () => ({ args: [], entrada: undefined }),
    comoEjecutar: () => ({ ejecutable: path.join(destino, 'no-existe-de-verdad-xyz'), args: [], entrada: undefined }),
  };
  const r = await ejecutarAsistente({
    lanzador, adaptador: {}, frase: 'hola', destino, modelo: null,
    detectar: () => ({ decidido: false }),
    sinDecidir: nota => ({ decidido: true, skill: null, nota }),
  });
  assert.match(r.nota, /no arrancó/);
});

test('stdioDeEntrada: "pipe" solo si hay que escribir algo; "ignore" si no', () => {
  assert.deepEqual(stdioDeEntrada(undefined), ['ignore', 'pipe', 'pipe']);
  assert.deepEqual(stdioDeEntrada('el prompt'), ['pipe', 'pipe', 'pipe']);
});
