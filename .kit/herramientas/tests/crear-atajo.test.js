'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearAtajo, cli } = require('../crear-atajo');
const { cursoTemporal, temporal } = require('./ayuda');

const bin = () => temporal('kit-bin-');
const entornoCon = dir => ({ PATH: [dir, os.tmpdir()].join(path.delimiter) });

test('en Mac y Linux crea un lanzador ejecutable que entra en el curso y abre el LLM', () => {
  const raiz = cursoTemporal();
  const carpetaBin = bin();
  const r = crearAtajo({ raiz, nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
  assert.deepEqual([r.creado, r.enPath], [true, true]);
  const texto = fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8');
  assert.match(texto, /^#!\/bin\/sh\n/);
  assert.ok(texto.includes(`cd "${raiz}"`));
  assert.match(texto, /exec claude "\$@"/);
  if (process.platform !== 'win32') assert.ok(fs.statSync(path.join(carpetaBin, 'historia')).mode & 0o100, 'tiene que ser ejecutable');
  assert.equal(JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8')).atajo, 'historia');
});

test('en Windows crea un .cmd con finales de línea de Windows', () => {
  const raiz = cursoTemporal();
  const carpetaBin = bin();
  const r = crearAtajo({ raiz, nombre: 'historia', carpetaBin, plataforma: 'win32', entorno: { Path: carpetaBin, PATHEXT: '.COM;.EXE;.BAT;.CMD' } });
  assert.equal(r.creado, true);
  const texto = fs.readFileSync(path.join(carpetaBin, 'historia.cmd'), 'utf8');
  assert.match(texto, /^@echo off\r\n/);
  assert.ok(texto.includes(`cd /d "${raiz}"`));
  assert.match(texto, /\r\nclaude %\*\r\n$/);
});

test('usa el comando del LLM que diga ajustes.json', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ llm: 'codex-cli' }) });
  const carpetaBin = bin();
  crearAtajo({ raiz, nombre: 'derecho', carpetaBin, plataforma: 'linux', entorno: entornoCon(carpetaBin) });
  assert.match(fs.readFileSync(path.join(carpetaBin, 'derecho'), 'utf8'), /exec codex "\$@"/);
});

test('es idempotente para el mismo curso, y otro curso no puede quedarse con el mismo atajo', () => {
  const carpetaBin = bin();
  const opciones = { nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) };
  const curso1 = cursoTemporal();
  assert.equal(crearAtajo({ raiz: curso1, ...opciones }).creado, true);
  assert.equal(crearAtajo({ raiz: curso1, ...opciones }).creado, true);
  assert.equal(crearAtajo({ raiz: cursoTemporal(), ...opciones }).motivo, 'atajo-de-otro-curso');
  assert.ok(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8').includes(curso1));
});

test('nunca pisa un fichero que no es del kit', () => {
  const carpetaBin = bin();
  fs.writeFileSync(path.join(carpetaBin, 'historia'), '#!/bin/sh\necho soy de otro\n');
  const r = crearAtajo({ raiz: cursoTemporal(), nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
  assert.equal(r.motivo, 'fichero-ajeno');
  assert.match(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /soy de otro/);
});

test('se niega si la palabra ya es un programa del ordenador, y si no es una palabra válida', () => {
  const carpetaBin = bin();
  const otra = bin();
  fs.writeFileSync(path.join(otra, 'git'), '');
  const entorno = { PATH: [carpetaBin, otra].join(path.delimiter) };
  assert.equal(crearAtajo({ raiz: cursoTemporal(), nombre: 'git', carpetaBin, plataforma: 'darwin', entorno }).motivo, 'comando-existente');
  for (const malo of ['', 'Historia', 'mi curso', 'ñu', 'a', '1curso', undefined]) {
    assert.equal(crearAtajo({ raiz: cursoTemporal(), nombre: malo, carpetaBin, plataforma: 'darwin', entorno }).motivo, 'nombre-no-valido', String(malo));
  }
});

test('cli: lo cuenta en llano, añade la carpeta al PATH si hace falta y sale con 1 si no puede', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const carpetaBin = bin();
  const raiz = cursoTemporal();
  const casa = temporal('kit-casa-');
  assert.equal(cli(['--nombre', 'historia'], raiz, { carpetaBin, casa, plataforma: 'darwin', entorno: { PATH: '/usr/bin', SHELL: '/bin/zsh' } }), 0);
  assert.match(lineas.join('\n'), /escribir "historia" en la terminal abre este curso/);
  assert.match(lineas.join('\n'), /cierra esta ventana de terminal y abre una nueva/);
  assert.match(lineas.join('\n'), /He añadido la carpeta de los atajos/);
  assert.equal(cli(['--nombre', 'Mal Nombre'], raiz, { carpetaBin }), 1);
  assert.match(lineas.join('\n'), /una sola palabra corta/);
  assert.equal(cli([], raiz, { carpetaBin }), 1);
});

test('--actualizar re-apunta el atajo de un curso que se ha movido, y nunca se lo quita a uno que sigue en su sitio', () => {
  const carpetaBin = bin();
  const opciones = { nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) };
  const viejo = cursoTemporal();
  crearAtajo({ raiz: viejo, ...opciones });

  const otroCurso = cursoTemporal();                     // el viejo sigue existiendo: no se toca
  assert.equal(crearAtajo({ raiz: otroCurso, actualizar: true, ...opciones }).motivo, 'atajo-de-otro-curso');

  const nuevo = viejo + '-movido';
  fs.renameSync(viejo, nuevo);                           // el alumno arrastra su curso a otra carpeta
  assert.equal(crearAtajo({ raiz: nuevo, ...opciones }).motivo, 'atajo-de-otro-curso', 'sin --actualizar no se re-apunta');
  assert.equal(crearAtajo({ raiz: nuevo, actualizar: true, ...opciones }).creado, true);
  assert.ok(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8').includes(`cd "${nuevo}"`));
});

test('si la carpeta del curso ya no está, el lanzador lo dice en llano', () => {
  const carpetaBin = bin();
  crearAtajo({ raiz: cursoTemporal(), nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
  assert.match(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /Si la has movido, díselo a quien te lo instaló/);
});

test('cli: acepta --actualizar', t => {
  t.mock.method(console, 'log', () => {});
  const carpetaBin = bin();
  const viejo = cursoTemporal();
  const opciones = { carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) };
  assert.equal(cli(['--nombre', 'historia'], viejo, opciones), 0);
  fs.renameSync(viejo, viejo + '-movido');
  assert.equal(cli(['--nombre', 'historia'], viejo + '-movido', opciones), 1);
  assert.equal(cli(['--nombre', 'historia', '--actualizar'], viejo + '-movido', opciones), 0);
});

test('cambiar de asistente: con otro llm en ajustes.json, volver a crear el atajo cambia el comando sin tocar nada más', () => {
  const carpetaBin = bin();
  const raiz = cursoTemporal();
  const opciones = { nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) };
  crearAtajo({ raiz, ...opciones });
  assert.match(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /exec claude/);
  const ajustes = JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8'));
  fs.writeFileSync(path.join(raiz, 'config', 'ajustes.json'), JSON.stringify({ ...ajustes, llm: 'codex-cli' }));
  assert.equal(crearAtajo({ raiz, ...opciones }).creado, true);
  assert.match(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /exec codex "\$@"/);
  assert.doesNotMatch(fs.readFileSync(path.join(carpetaBin, 'historia'), 'utf8'), /claude/);
});

test('una carpeta de curso con comillas, $ o % no cabe en el lanzador: se rechaza y se explica', t => {
  const carpetaBin = bin();
  for (const mala of ['cursos"raros', 'cursos$2026', 'cursos%x', 'cursos`x']) {
    const raiz = path.join(os.tmpdir(), mala);
    const r = crearAtajo({ raiz, nombre: 'historia', carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) });
    assert.deepEqual([r.creado, r.motivo], [false, 'ruta-no-valida'], mala);
  }
  assert.ok(!fs.existsSync(path.join(carpetaBin, 'historia')));
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  assert.equal(cli(['--nombre', 'historia'], path.join(os.tmpdir(), 'cursos$x'), { carpetaBin, plataforma: 'darwin', entorno: entornoCon(carpetaBin) }), 1);
  assert.match(lineas.join('\n'), /carácter que el atajo no puede llevar/);
});

test('PATH en Mac y Linux: una línea marcada al final del perfil de su shell, una sola vez, sin tocar lo que había', () => {
  const { anadirAlPath, pathGuardado, perfilDeShell } = require('../crear-atajo');
  const casa = temporal('kit-casa-');
  const carpetaBin = path.join(casa, '.local', 'bin');
  const entorno = { SHELL: '/bin/zsh' };
  fs.writeFileSync(path.join(casa, '.zshrc'), 'alias ll="ls -l"');   // sin salto de línea final
  assert.deepEqual(anadirAlPath({ carpetaBin, plataforma: 'darwin', entorno, casa }), { anadido: true, donde: path.join(casa, '.zshrc') });
  const texto = fs.readFileSync(path.join(casa, '.zshrc'), 'utf8');
  assert.ok(texto.startsWith('alias ll="ls -l"\n'));
  assert.ok(texto.endsWith(`export PATH="${carpetaBin}:$PATH"\n`));
  assert.ok(pathGuardado({ carpetaBin, plataforma: 'darwin', entorno, casa }));
  assert.deepEqual(anadirAlPath({ carpetaBin, plataforma: 'darwin', entorno, casa }), { anadido: false, yaEstaba: true });
  assert.equal(fs.readFileSync(path.join(casa, '.zshrc'), 'utf8'), texto, 'la segunda vez no toca nada');
  assert.equal(perfilDeShell({ plataforma: 'darwin', entorno: { SHELL: '/bin/bash' }, casa }), path.join(casa, '.bash_profile'));
  assert.equal(perfilDeShell({ plataforma: 'linux', entorno: { SHELL: '/bin/bash' }, casa }), path.join(casa, '.bashrc'));
  assert.equal(perfilDeShell({ plataforma: 'darwin', entorno: {}, casa }), path.join(casa, '.zshrc'), 'Mac sin SHELL: zsh');
  assert.equal(perfilDeShell({ plataforma: 'linux', entorno: { SHELL: '/usr/bin/fish' }, casa }), path.join(casa, '.profile'));
});

test('PATH en Windows: se añade a la variable Path del usuario, con PowerShell, y solo si falta', () => {
  const { anadirAlPath } = require('../crear-atajo');
  const carpetaBin = 'C:\\Users\\ana\\.local\\bin';
  const guiones = [];
  let pathUsuario = 'C:\\Programas\\git';
  const ps = script => {
    guiones.push(script);
    if (script.startsWith('[Environment]::GetEnvironmentVariable')) return { ok: true, salida: pathUsuario };
    pathUsuario += `;${carpetaBin}`;
    return { ok: true, salida: '' };
  };
  assert.equal(anadirAlPath({ carpetaBin, plataforma: 'win32', entorno: {}, casa: 'C:\\Users\\ana', ejecutarPs: ps }).anadido, true);
  assert.match(guiones[1], /SetEnvironmentVariable\('Path'.*'User'\)/);
  assert.ok(guiones[1].includes(`'${carpetaBin}'`));
  assert.deepEqual(anadirAlPath({ carpetaBin, plataforma: 'win32', entorno: {}, casa: 'C:\\Users\\ana', ejecutarPs: ps }), { anadido: false, yaEstaba: true });
  const falla = s => s.startsWith('[Environment]::Get') ? { ok: true, salida: '' } : { ok: false, salida: 'acceso denegado' };
  assert.deepEqual(anadirAlPath({ carpetaBin, plataforma: 'win32', entorno: {}, casa: 'C:\\', ejecutarPs: falla }), { anadido: false, fallo: 'acceso denegado' });
});

test('cli: si no puede añadir la carpeta al PATH, lo dice claro', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const carpetaBin = bin();
  const falla = s => s.startsWith('[Environment]::Get') ? { ok: true, salida: '' } : { ok: false, salida: 'acceso denegado' };
  assert.equal(cli(['--nombre', 'historia'], cursoTemporal(), { carpetaBin, plataforma: 'win32', entorno: { Path: 'C:\\x' }, ejecutarPs: falla }), 0);
  assert.match(lineas.join('\n'), /no he podido añadir la carpeta.*acceso denegado/);
});
