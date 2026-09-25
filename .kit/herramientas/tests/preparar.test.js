'use strict';
// preparar.js con un asistente de mentira (asistente-de-mentira.js): un curso de verdad (clonado del
// propio repo, con git de verdad) es la única forma honesta de probar `git worktree`, una rama nueva y un
// merge con choques — cursoTemporal() no tiene historia de git. Se lanza siempre como el profesor lo
// haría, con `node .kit/herramientas/preparar.js ...` DENTRO del curso clonado (nunca con require()
// directo del módulo de este repo): así `--trabajar` recalcula su raíz igual que en producción.
// Los escenarios están numerados y comparten un solo curso clonado (como extremo-a-extremo.test.js):
// clonar de verdad para cada uno sería mucho más lento sin añadir nada.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { temporal } = require('./ayuda');
const { ficheroResoluble, pidVivo, construirPrompt } = require('../preparar');

const KIT = path.resolve(__dirname, '..', '..', '..');
const SCRIPT_ASISTENTE = path.join(__dirname, 'asistente-de-mentira.js');
const casa = temporal('kit-preparar-');
const curso = path.join(casa, 'curso');

function ejecutar(cmd, args, cwd = curso, envExtra = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...envExtra } });
  return { codigo: r.status, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function git(args, cwd = curso) { return ejecutar('git', args, cwd); }
function herramienta(nombre, ...args) { return ejecutar(process.execPath, [path.join(curso, '.kit', 'herramientas', `${nombre}.js`), ...args]); }
function leer(rel) { return fs.readFileSync(path.join(curso, ...rel.split('/')), 'utf8'); }
function existe(rel) { return fs.existsSync(path.join(curso, ...rel.split('/'))); }
function preparaciones() { return JSON.parse(herramienta('preparar', '--estado', '--json').salida); }

// Espera activa CORTA (sin sleeps largos del harness): duerme de verdad con Atomics.wait, no gasta CPU.
function dormir(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function esperarTerminada(id) {
  const limite = Date.now() + 20000;
  for (;;) {
    const [p] = preparaciones();
    if (p && p.id === id && p.resultadoEnCaliente !== 'en-curso') return p;
    if (Date.now() > limite) throw new Error(`tiempo agotado esperando que ${id} termine`);
    dormir(50);
  }
}

// El adaptador de un asistente que trabaja en segundo plano con asistente-de-mentira.js, con el id
// grabado literal (el asistente de mentira no lee el prompt: el test ya sabe qué id le toca).
function escribirAdaptador(idParaElAsistente) {
  const llm = JSON.parse(fs.readFileSync(path.join(curso, 'config', 'ajustes.json'), 'utf8')).llm || 'claude-code';
  const adaptador = { id: llm, comando: process.execPath, skills: '.claude/skills', permisos: { fichero: '.claude/settings.json', formato: 'x' } };
  if (idParaElAsistente) adaptador.segundo_plano = [SCRIPT_ASISTENTE, idParaElAsistente, '{prompt}', '{modelo}'];
  fs.writeFileSync(path.join(curso, 'config', 'adaptador-llm.json'), JSON.stringify(adaptador, null, 2));
}
function conFichero(id) {
  fs.mkdirSync(path.join(curso, 'estudio', 'inbox'), { recursive: true });
  fs.writeFileSync(path.join(curso, 'estudio', 'inbox', `${id}.md`), 'apuntes de mentira');
  return [`${id}.md`];
}
function lanzar(id, ficheros = conFichero(id)) { return herramienta('preparar', '--lanzar', ...ficheros, '--id', id); }

// Copia el repo entero como plantilla de instalación (motor + estudio/config de partida), tal como lo
// dejaría clonar la plantilla del kit — pero desde la copia de trabajo actual, no de git: así no hace
// falta commitear nada para probar un cambio en marcha. `preparar-curso.js` (más abajo) borra lo que
// solo es del repo del kit, igual que al instalar de verdad.
function copiarPlantilla() {
  fs.mkdirSync(curso, { recursive: true });
  fs.cpSync(KIT, curso, { recursive: true, filter: src => path.relative(KIT, src).split(path.sep)[0] !== '.git' });
}

test('0. montar un curso real (motor de la copia de trabajo actual) y comprobarlo sano', () => {
  copiarPlantilla();
  git(['init', '-q', '-b', 'main']);
  for (const [k, val] of [['user.name', 'Prueba preparar.js'], ['user.email', 'preparar@example.com'], ['commit.gpgsign', 'false']]) git(['config', k, val]);
  const p = herramienta('preparar-curso', '--subir', 'no', '--nombre', 'Curso de prueba de preparar.js');
  assert.equal(p.codigo, 0, p.salida);
  git(['add', '-A']); git(['commit', '-q', '-m', 'curso preparado']);
  assert.equal(herramienta('comprobar', '--json').codigo, 0);
});

test('1. sin un adaptador con segundo_plano, --lanzar se niega (nunca lanza el `claude` real)', () => {
  escribirAdaptador(null);   // adaptador sin `segundo_plano`: pisa .kit/adaptadores/claude-code.json
  const r = lanzar('a0');
  assert.equal(r.codigo, 1);
  assert.match(r.salida, /no puede trabajar en segundo plano/);
  assert.deepEqual(preparaciones(), []);
});

test('2. --lanzar crea la copia de trabajo (worktree + rama) y el asistente de mentira la termina', () => {
  escribirAdaptador('b1');
  const r = lanzar('b1');
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /Preparando la clase b1 en segundo plano/);
  const dir = path.join(curso, '.preparacion', 'b1');
  assert.ok(fs.existsSync(path.join(dir, 'estado.json')));
  assert.equal(git(['rev-parse', '--verify', 'preparacion/b1']).codigo, 0, 'la rama existe');

  const [antes] = preparaciones();
  assert.equal(antes.id, 'b1');
  assert.ok(['en-curso', 'terminada'].includes(antes.resultadoEnCaliente), antes.resultadoEnCaliente);

  const terminada = esperarTerminada('b1');
  assert.equal(terminada.resultado, 'terminada');
  assert.ok(terminada.fin);
  assert.match(herramienta('preparar', '--estado').salida, /Terminada: b1/);
  // El asistente de mentira guardó dentro del worktree, en su propia rama: nunca en el curso principal.
  assert.ok(fs.existsSync(path.join(dir, 'estudio', 'conceptos', 'concepto-b1.md')));
  assert.ok(!existe('estudio/conceptos/concepto-b1.md'));
});

test('3. una sola preparación a la vez: --lanzar se niega mientras hay una en marcha o terminada sin juntar', () => {
  // Terminada sin juntar (sigue de 2): otro --lanzar se niega.
  const r1 = lanzar('otra');
  assert.equal(r1.codigo, 1);
  assert.match(r1.salida, /terminada sin juntar \(b1\)/);

  assert.equal(herramienta('preparar', '--juntar', 'b1').codigo, 0);   // se limpia para el siguiente paso

  // Y con una EN MARCHA (dos --lanzar seguidos, sin esperar entre medias: el segundo pid casi siempre
  // sigue vivo en ese instante), el segundo también se niega — o, si ya ha terminado, por "terminada".
  escribirAdaptador('c1');
  const primero = lanzar('c1');
  assert.equal(primero.codigo, 0, primero.salida);
  const segundo = lanzar('c1b');
  assert.equal(segundo.codigo, 1);
  assert.match(segundo.salida, /(en marcha \(c1\)|terminada sin juntar \(c1\))/);

  esperarTerminada('c1');
  assert.equal(herramienta('preparar', '--juntar', 'c1').codigo, 0);
});

test('4. juntar sin choques: mezcla, comprueba, comitea "(preparada en segundo plano)" y borra la copia', () => {
  escribirAdaptador('d1');
  assert.equal(lanzar('d1').codigo, 0);
  esperarTerminada('d1');

  const antesDeJuntar = git(['rev-parse', 'HEAD']).salida;
  const r = herramienta('preparar', '--juntar', 'd1');
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /Juntada: sesion\(d1\): .* \(preparada en segundo plano\)/);
  assert.notEqual(git(['rev-parse', 'HEAD']).salida, antesDeJuntar);
  assert.ok(existe('estudio/conceptos/concepto-d1.md'), 'el concepto de la clase llega al curso principal');
  assert.match(leer('config/diario.md'), /preparada en segundo plano/);
  assert.equal(git(['status', '--porcelain']).salida, '', 'working tree limpio');
  assert.equal(git(['rev-parse', '--verify', 'preparacion/d1']).codigo, 128, 'la rama se borra al juntar');
  assert.ok(!fs.existsSync(path.join(curso, '.preparacion', 'd1')), 'la copia de trabajo se borra al juntar');
  assert.deepEqual(preparaciones(), []);
});

test('5. juntar con diario.md y los ficheros generados en conflicto: se resuelven solos', () => {
  escribirAdaptador('e1');
  assert.equal(lanzar('e1').codigo, 0);

  // Mientras tanto, "tutoría" en primer plano: el alumno marca la clase d1 (de antes) como estudiada.
  // Esto no toca ni conceptos/_index.md ni progreso.md (esos son líneas nuevas de cada lado, y ya se
  // vio en el escenario 4 que git los junta solo): solo cambia una línea EXISTENTE de una nota, que
  // obliga a recalcular inicio.md de forma distinta a como lo hace la preparación (que no sabe nada de
  // este cambio) — el choque real que preparar.js tiene que resolver solo — y deja su propia línea en
  // config/diario.md (el otro choque previsto, con el driver union).
  const sesionD1 = path.join(curso, 'estudio', 'sesiones', 'd1-clase-de-mentira.md');
  fs.writeFileSync(sesionD1, fs.readFileSync(sesionD1, 'utf8').replace('bloque: 1', 'bloque: 1\nestudiada: true'));
  const g = herramienta('guardar', 'dudas: d1 marcada como estudiada, en paralelo');
  assert.equal(g.codigo, 0, g.salida);
  assert.match(leer('config/diario.md'), /en paralelo/);

  esperarTerminada('e1');
  const r = herramienta('preparar', '--juntar', 'e1');
  assert.equal(r.codigo, 0, r.salida);
  assert.ok(existe('estudio/conceptos/concepto-e1.md'), 'lo de la preparación llega');
  assert.match(leer('estudio/sesiones/d1-clase-de-mentira.md'), /estudiada: true/, 'lo de la tutoría en paralelo no se pierde');
  const diario = leer('config/diario.md');
  assert.match(diario, /en paralelo/);
  assert.match(diario, /sesion\(e1\).*preparada en segundo plano/);
  assert.equal(git(['status', '--porcelain']).salida, '');
});

test('6. un choque real (el mismo fichero de contenido tocado en los dos lados) aborta sin tocar nada', () => {
  // El orden importa: para que sea un choque de verdad, los dos lados tienen que partir del MISMO
  // "Uno." — la preparación se lanza (y bifurca su copia) ANTES de que la tutoría edite esa misma línea
  // en la rama principal, no al revés.
  const ficheroDisputado = 'estudio/conceptos/concepto-b1.md';
  const abs = path.join(curso, ...ficheroDisputado.split('/'));
  assert.match(fs.readFileSync(abs, 'utf8'), /Uno\./, 'de partida, los dos lados tienen "Uno."');

  escribirAdaptador('f1');
  const r = ejecutar(process.execPath, [path.join(curso, '.kit', 'herramientas', 'preparar.js'), '--lanzar', ...conFichero('f1'), '--id', 'f1'], curso, {
    PROFESOR_KIT_ASISTENTE_DE_MENTIRA_EDITA: ficheroDisputado,
  });
  assert.equal(r.codigo, 0, r.salida);

  fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace('Uno.', 'Editado desde la tutoría.'));
  assert.equal(herramienta('guardar', 'dudas: tocando concepto-b1').codigo, 0);
  const antes = git(['rev-parse', 'HEAD']).salida;

  esperarTerminada('f1');
  const j = herramienta('preparar', '--juntar', 'f1');
  assert.equal(j.codigo, 1);
  assert.match(j.salida, new RegExp(ficheroDisputado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(git(['rev-parse', 'HEAD']).salida, antes, 'el curso principal no se ha movido');
  assert.equal(git(['status', '--porcelain']).salida, '', 'sin merge a medias');
  assert.equal(git(['rev-parse', '--verify', 'preparacion/f1']).codigo, 0, 'la rama se conserva para reintentar');
  assert.ok(fs.existsSync(path.join(curso, '.preparacion', 'f1')), 'la copia se conserva');

  // Se limpia a mano para no dejar basura a los siguientes escenarios.
  git(['worktree', 'remove', '--force', path.join(curso, '.preparacion', 'f1')]);
  git(['branch', '-D', 'preparacion/f1']);
});

test('7. fallo del asistente: queda "fallida", con su registro, y --juntar se niega', () => {
  escribirAdaptador('g1');
  const r = ejecutar(process.execPath, [path.join(curso, '.kit', 'herramientas', 'preparar.js'), '--lanzar', ...conFichero('g1'), '--id', 'g1'], curso, {
    PROFESOR_KIT_ASISTENTE_DE_MENTIRA_FALLA: '1',
  });
  assert.equal(r.codigo, 0, r.salida);

  const fallida = esperarTerminada('g1');
  assert.equal(fallida.resultado, 'fallida');
  assert.match(fs.readFileSync(path.join(curso, '.preparacion', 'g1', 'registro.txt'), 'utf8'), /fallo simulado/);
  assert.match(herramienta('preparar', '--estado').salida, /Fallida: g1/);

  const j = herramienta('preparar', '--juntar', 'g1');
  assert.equal(j.codigo, 1);
  assert.match(j.salida, /falló/);
});

test('8. interrumpida (pid muerto): --estado lo dice, y el siguiente --lanzar descarta la copia sola', () => {
  // g1 sigue "fallida" de antes: --lanzar ya la descartaría igual, pero forzamos aquí el caso
  // "interrumpida" de verdad reescribiendo su estado.json con un pid que no existe y resultado
  // "en-curso" (como si el ordenador se hubiera apagado a medio camino).
  const estadoJson = path.join(curso, '.preparacion', 'g1', 'estado.json');
  const estado = JSON.parse(fs.readFileSync(estadoJson, 'utf8'));
  const pidImposible = 2 ** 30;   // no hay proceso real con este pid
  fs.writeFileSync(estadoJson, JSON.stringify({ ...estado, pid: pidImposible, resultado: 'en-curso', fin: null }));

  const [enCaliente] = preparaciones();
  assert.equal(enCaliente.resultadoEnCaliente, 'interrumpida');
  assert.match(herramienta('preparar', '--estado').salida, /Interrumpida: g1/);
  // El contrato de estado.json no cambia solo por leerlo: "en-curso" tal cual lo escribiría estado.js.
  assert.equal(JSON.parse(fs.readFileSync(estadoJson, 'utf8')).resultado, 'en-curso');

  escribirAdaptador('h1');
  const r = lanzar('h1');
  assert.equal(r.codigo, 0, r.salida);
  assert.ok(!fs.existsSync(path.join(curso, '.preparacion', 'g1')), 'la interrumpida se descarta sola');
  assert.equal(git(['rev-parse', '--verify', 'preparacion/g1']).codigo, 128, 'y su rama también');

  esperarTerminada('h1');
  assert.equal(herramienta('preparar', '--juntar', 'h1').codigo, 0);
});

test('9. sin ficheros, con un fichero que no existe en inbox, o sin id: se niega antes de tocar git', () => {
  escribirAdaptador('i1');
  assert.match(herramienta('preparar', '--lanzar', '--id', 'i1').salida, /falta al menos un fichero/);
  assert.match(herramienta('preparar', '--lanzar', 'no-existe.md', '--id', 'i1').salida, /no está en estudio\/inbox/);
  assert.match(herramienta('preparar', '--lanzar', ...conFichero('i1'), '--id', 'a/b').salida, /el id de la sesión/);
  assert.deepEqual(preparaciones(), []);
});

test('10. --estado sin ninguna preparación no revienta', () => {
  assert.match(herramienta('preparar', '--estado').salida, /No hay ninguna preparación en marcha/);
  assert.deepEqual(preparaciones(), []);
});

test('ficheroResoluble: los generados y los pies de sesión sí, el contenido de una nota no', () => {
  assert.equal(ficheroResoluble('estudio/inicio.md'), true);
  assert.equal(ficheroResoluble('estudio/pendientes.md'), true);
  assert.equal(ficheroResoluble('estudio/formulario.md'), true);
  assert.equal(ficheroResoluble('estudio/auditoria-del-material.md'), true);
  assert.equal(ficheroResoluble('estudio/ejercicios/_index.md'), true);
  assert.equal(ficheroResoluble('estudio/sesiones/01-01-intro.md'), true);
  assert.equal(ficheroResoluble('README.md'), true);
  assert.equal(ficheroResoluble('estudio/mi-perfil.md'), true);
  assert.equal(ficheroResoluble('estudio/conceptos/velocidad-media.md'), false);
  assert.equal(ficheroResoluble('config/diario.md'), false);   // ese lo resuelve el driver union, no esto
});

test('pidVivo: el propio proceso está vivo, un pid inventado no', () => {
  assert.equal(pidVivo(process.pid), true);
  assert.equal(pidVivo(2 ** 30), false);
  assert.equal(pidVivo(null), false);
});

test('construirPrompt: dice que trabaja en segundo plano, no pregunta, y lleva los ficheros y el id', () => {
  const prompt = construirPrompt(['a.md', 'b.md'], '01-02');
  assert.match(prompt, /segundo plano/);
  assert.match(prompt, /no preguntes nada/);
  assert.match(prompt, /estudio\/inbox\/a\.md y estudio\/inbox\/b\.md/);
  assert.match(prompt, /id 01-02/);
});

test('juntarPorFilas: las filas del curso principal mandan y las nuevas de la preparación van detrás de la última', () => {
  const { juntarPorFilas } = require('../preparar');
  const clave = l => (/^\|\s*\[\[([^\]|\\#]+)/.exec(l) || [])[1];
  const ours = '# Progreso\n\n| Concepto | T | A |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n| [[b]] | 🟡 | ⬜ |\n\nnota final\n';
  const theirs = '# Progreso\n\n| Concepto | T | A |\n|---|---|---|\n| [[a]] | ⬜ | ⬜ |\n| [[b]] | ⬜ | ⬜ |\n| [[c]] | ⬜ | ⬜ |\n\nnota final\n';
  assert.equal(juntarPorFilas(ours, theirs, clave),
    '# Progreso\n\n| Concepto | T | A |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n| [[b]] | 🟡 | ⬜ |\n| [[c]] | ⬜ | ⬜ |\n\nnota final\n');
  assert.equal(juntarPorFilas('sin tabla\n', theirs, clave), null, 'sin filas propias no se adivina');
});

// El caso de la prueba real de la 0.22: mientras la preparación añade su fila al final de progreso.md, la tutoría
// cambia el estado de la última fila (un examen). Quedan pegadas y git no las junta solo.
test('juntar: progreso.md tocado en los dos lados (estado cambiado y fila nueva pegados) se junta por concepto', () => {
  escribirAdaptador('p1');
  assert.equal(herramienta('preparar', '--lanzar', ...conFichero('p1'), '--id', 'p1').codigo, 0);
  const rel = 'estudio/progreso.md';
  const abs = path.join(curso, ...rel.split('/'));
  const lineas = fs.readFileSync(abs, 'utf8').split('\n');
  const ultima = lineas.map((l, i) => [l, i]).filter(([l]) => /^\|\s*\[\[/.test(l)).pop();
  assert.ok(ultima, 'hay alguna fila de concepto');
  lineas[ultima[1]] = ultima[0].replace('⬜', '✅');
  fs.writeFileSync(abs, lineas.join('\n'));
  assert.equal(herramienta('guardar', 'examen: en paralelo').codigo, 0);
  esperarTerminada('p1');
  const j = herramienta('preparar', '--juntar', 'p1');
  assert.equal(j.codigo, 0, j.salida);
  const progreso = leer(rel);
  assert.ok(progreso.includes(lineas[ultima[1]]), 'el estado que demostró el alumno se conserva');
  assert.match(progreso, /\[\[concepto-p1\]\] \| ⬜ \| ⬜ \|/, 'la fila nueva de la preparación llega');
  assert.equal(git(['status', '--porcelain']).salida, '');
});

// --- issue #39: la preparación en segundo plano, fiable (0.22.3) -------------------------------------------

function lanzarCon(id, env, ficheros = conFichero(id)) {
  return ejecutar(process.execPath, [path.join(curso, '.kit', 'herramientas', 'preparar.js'), '--lanzar', ...ficheros, '--id', id], curso, env);
}
const registroDe = id => fs.readFileSync(path.join(curso, '.preparacion', id, 'registro.txt'), 'utf8');

test('11. H05: el material recién dejado en inbox, sin guardar, llega a la copia igual; las skills también; el estado no se versiona', () => {
  assert.deepEqual(preparaciones(), []);
  escribirAdaptador('k1');
  fs.writeFileSync(path.join(curso, 'estudio', 'inbox', 'otra-clase.md'), 'no es de esta clase');
  const r = lanzar('k1');
  assert.equal(r.codigo, 0, r.salida);
  const dir = path.join(curso, '.preparacion', 'k1');
  assert.equal(git(['hash-object', 'estudio/inbox/k1.md'], dir).salida, git(['hash-object', 'estudio/inbox/k1.md']).salida, 'el mismo contenido en la copia');
  assert.match(git(['log', '-1', '--format=%s']).salida, /inbox.*k1/, 'el material de la clase se guarda antes en el curso principal');
  assert.match(git(['status', '--porcelain']).salida, /otra-clase\.md/, 'lo demás sin guardar no se toca');
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'sesion', 'SKILL.md')), 'las skills están en la copia');
  esperarTerminada('k1');
  assert.equal(git(['ls-tree', '-r', '--name-only', 'preparacion/k1', '--', 'estado.json', 'registro.txt']).salida, '', 'estado y registro fuera de git');
  fs.rmSync(path.join(curso, 'estudio', 'inbox', 'otra-clase.md'));
  assert.equal(herramienta('preparar', '--juntar', 'k1').codigo, 0);
  assert.ok(!existe('estado.json') && !existe('registro.txt'));
});

test('12. H05: un asistente que termina "bien" sin dejar la sesión queda fallida, y el registro dice por qué', () => {
  escribirAdaptador('l1');
  assert.equal(lanzarCon('l1', { PROFESOR_KIT_ASISTENTE_DE_MENTIRA_NO_HACE_NADA: '1' }).codigo, 0);
  assert.equal(esperarTerminada('l1').resultado, 'fallida');
  assert.match(registroDe('l1'), /no ha dejado la sesión l1/);
  assert.equal(herramienta('preparar', '--juntar', 'l1').codigo, 1);
});

test('13. H05: un asistente colgado se para al llegar al límite de tiempo, y queda fallida', () => {
  escribirAdaptador('m1');
  assert.equal(lanzarCon('m1', { PROFESOR_KIT_ASISTENTE_DE_MENTIRA_DUERME_MS: '8000', PROFESOR_KIT_PREPARAR_LIMITE_MS: '700' }).codigo, 0);
  assert.equal(esperarTerminada('m1').resultado, 'fallida');
  assert.match(registroDe('m1'), /límite de tiempo/);
});

test('14. H05: al descartar una preparación fallida se guarda su registro (las últimas, no todas)', () => {
  escribirAdaptador('n1');
  assert.equal(lanzar('n1').codigo, 0);   // descarta m1, que falló
  const descartadas = path.join(curso, '.preparacion', 'descartadas');
  assert.ok(fs.readdirSync(descartadas).some(n => n.startsWith('m1-') && n.endsWith('.txt')), 'el registro de m1 se conserva');
  esperarTerminada('n1');
  assert.equal(herramienta('preparar', '--juntar', 'n1').codigo, 0);
});

test('15. H05: dos lanzamientos a la vez no pueden pasar los dos (cerrojo)', () => {
  const { tomarCerrojo } = require('../preparar');
  const soltar = tomarCerrojo(curso);
  assert.ok(soltar, 'el primero lo toma');
  assert.equal(tomarCerrojo(curso), null, 'el segundo no');
  soltar();
  const otraVez = tomarCerrojo(curso);
  assert.ok(otraVez, 'soltado, se puede volver a tomar');
  otraVez();
  // Un cerrojo olvidado (un proceso que murió) caduca solo.
  const f = path.join(curso, '.preparacion', '.cerrojo');
  fs.writeFileSync(f, 'viejo');
  const hace = new Date(Date.now() - 10 * 60 * 1000);
  fs.utimesSync(f, hace, hace);
  const trasCaducar = tomarCerrojo(curso);
  assert.ok(trasCaducar);
  trasCaducar();
});

test('16. H04: el cuerpo de una sesión cambiado en los dos lados es un choque: no se pierde ninguno de los dos', () => {
  const rel = 'estudio/sesiones/d1-clase-de-mentira.md';
  escribirAdaptador('o1');
  assert.equal(lanzarCon('o1', { PROFESOR_KIT_ASISTENTE_DE_MENTIRA_EDITA: rel, PROFESOR_KIT_ASISTENTE_DE_MENTIRA_BUSCA: 'Sin discrepancias.' }).codigo, 0);
  const abs = path.join(curso, ...rel.split('/'));
  fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace('Sin discrepancias.', 'Corregido en la tutoría.'));
  assert.equal(herramienta('guardar', 'dudas: corrigiendo la auditoría de d1').codigo, 0);
  const antes = git(['rev-parse', 'HEAD']).salida;
  esperarTerminada('o1');
  const j = herramienta('preparar', '--juntar', 'o1');
  assert.equal(j.codigo, 1, j.salida);
  assert.match(j.salida, /d1-clase-de-mentira\.md/);
  assert.equal(git(['rev-parse', 'HEAD']).salida, antes);
  assert.equal(git(['status', '--porcelain']).salida, '');
  git(['worktree', 'remove', '--force', path.join(curso, '.preparacion', 'o1')]);
  git(['branch', '-D', 'preparacion/o1']);
});

test('17. H04: si solo la preparación cambia el cuerpo de una sesión, su cambio llega aunque los pies choquen', () => {
  const rel = 'estudio/sesiones/d1-clase-de-mentira.md';
  escribirAdaptador('q1');
  assert.equal(lanzarCon('q1', { PROFESOR_KIT_ASISTENTE_DE_MENTIRA_EDITA: rel, PROFESOR_KIT_ASISTENTE_DE_MENTIRA_BUSCA: 'Toda la diapositiva quedó en la nota.' }).codigo, 0);
  const abs = path.join(curso, ...rel.split('/'));
  fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace(/estudiada: true\n?/, ''));
  assert.equal(herramienta('guardar', 'dudas: d1 otra vez sin estudiar').codigo, 0);
  esperarTerminada('q1');
  const j = herramienta('preparar', '--juntar', 'q1');
  assert.equal(j.codigo, 0, j.salida);
  const texto = leer(rel);
  assert.match(texto, /Editado por el asistente de mentira/, 'el cambio de la preparación llega');
  assert.doesNotMatch(texto, /estudiada: true/, 'y el de la tutoría también');
});

// El fallo real de la 0.25.0 (3.ª prueba real): un examen del formato libre se corrige sin `guardar.js` (la
// skill no lo pedía en ese camino) y deja `estudio/progreso.md` sin guardar en el curso principal. `--juntar`
// reventaba con el error crudo de `git merge` ("local changes would be overwritten"). Ahora `--juntar` guarda
// lo pendiente solo antes de mezclar, como `actualizar.js` guarda antes de actualizar.
test('18. si el curso principal tiene algo sin guardar (una fila de progreso.md, como un examen corregido sin guardar.js), --juntar lo guarda solo antes de mezclar', () => {
  escribirAdaptador('r1');
  assert.equal(lanzar('r1').codigo, 0);
  const rel = 'estudio/progreso.md';
  const abs = path.join(curso, ...rel.split('/'));
  const lineas = fs.readFileSync(abs, 'utf8').split('\n');
  const ultima = lineas.map((l, i) => [l, i]).filter(([l]) => /^\|\s*\[\[/.test(l)).pop();
  assert.ok(ultima, 'hay alguna fila de concepto');
  lineas[ultima[1]] = ultima[0].replace('⬜', '✅');
  fs.writeFileSync(abs, lineas.join('\n'));
  assert.match(git(['status', '--porcelain']).salida, /progreso\.md/, 'queda algo sin guardar en el curso principal, sin pasar por guardar.js');

  esperarTerminada('r1');
  const j = herramienta('preparar', '--juntar', 'r1');
  assert.equal(j.codigo, 0, j.salida);
  assert.match(j.salida, /Juntada/);
  assert.match(leer('config/diario.md'), /guardado antes de juntar la preparación r1/, 'el guardado previo queda anotado en el diario');
  assert.ok(leer(rel).includes(lineas[ultima[1]]), 'lo que estaba sin guardar no se pierde');
  assert.equal(git(['status', '--porcelain']).salida, '', 'working tree limpio tras juntar');
});

// Espejo del test de actualizar.js ("si no puede guardar antes de actualizar, no toca nada"): sin identidad,
// `--juntar` tiene que devolver un motivo claro y dejar tanto el curso principal como la copia intactos.
test('19. si no se puede guardar antes de juntar (git sin identidad), no se toca nada y lo pendiente sigue ahí', () => {
  escribirAdaptador('s1');
  assert.equal(lanzar('s1').codigo, 0);
  const rel = 'estudio/progreso.md';
  const abs = path.join(curso, ...rel.split('/'));
  const lineas = fs.readFileSync(abs, 'utf8').split('\n');
  const ultima = lineas.map((l, i) => [l, i]).filter(([l]) => /^\|\s*\[\[/.test(l)).pop();
  assert.ok(ultima, 'hay alguna fila de concepto');
  const contenidoPendiente = lineas.map((l, i) => (i === ultima[1] ? l.replace('⬜', '✅') : l)).join('\n');
  fs.writeFileSync(abs, contenidoPendiente);
  esperarTerminada('s1');

  git(['config', '--unset', 'user.name']);
  git(['config', '--unset', 'user.email']);
  git(['config', 'user.useConfigOnly', 'true']);   // que git no se invente una identidad con el nombre de la máquina
  const antes = git(['rev-parse', 'HEAD']).salida;

  const j = herramienta('preparar', '--juntar', 's1');
  assert.equal(j.codigo, 1);
  assert.match(j.salida, /no se pudo guardar tu trabajo pendiente antes de juntar/);
  assert.match(j.salida, /sin-identidad/);
  assert.equal(git(['rev-parse', 'HEAD']).salida, antes, 'el curso principal no se ha movido');
  assert.equal(leer(rel), contenidoPendiente, 'lo que estaba sin guardar sigue ahí, tal cual');
  assert.equal(git(['rev-parse', '--verify', 'preparacion/s1']).codigo, 0, 'la preparación sigue disponible para reintentar');

  // Restaura la identidad para las pruebas siguientes y deja el curso limpio otra vez.
  git(['config', '--unset', 'user.useConfigOnly']);
  git(['config', 'user.name', 'Prueba preparar.js']);
  git(['config', 'user.email', 'preparar@example.com']);
  assert.equal(herramienta('preparar', '--juntar', 's1').codigo, 0);
});

test('juntarPorFilas con la versión común: una fila cambiada solo en un lado gana ese lado; cambiada en los dos, choque', () => {
  const { juntarPorFilas } = require('../preparar');
  const clave = l => (/^([a-z0-9][a-z0-9-]*) *\|/.exec(l) || [])[1];
  const base = '# Índice\n\na | Def A | B1 | 1 | alias:\nb | Def B | B1 | 1 | alias:\n';
  const ours = '# Índice\n\na | Def A | B1 | 1 | alias:\nb | Def B | B1 | 2 | alias:\n';
  const theirs = '# Índice\n\na | Def A | B1 | 1 | alias: otra-a\nb | Def B | B1 | 1 | alias:\nc | Def C | B1 | 1 | alias:\n';
  assert.equal(juntarPorFilas(ours, theirs, clave, base),
    '# Índice\n\na | Def A | B1 | 1 | alias: otra-a\nb | Def B | B1 | 2 | alias:\nc | Def C | B1 | 1 | alias:\n');
  const ambos = '# Índice\n\na | Def A cambiada | B1 | 1 | alias:\nb | Def B | B1 | 1 | alias:\n';
  assert.equal(juntarPorFilas(ambos, theirs, clave, base), null);
});
