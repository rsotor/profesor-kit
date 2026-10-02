'use strict';
// La cola nocturna de issues (plan vivo, «mantenimiento nocturno», puntos 3 y 4). Decide sin LLM qué issues
// trabaja Claude esta noche, en qué orden y con qué presupuesto; y prepara el contexto de cada uno, que es lo
// único que Claude lee del issue: el título, el cuerpo y los comentarios de Roberto. Lo que escriben otros en un
// issue de un repo público no le llega nunca (prompt injection).
//
//   node .github/cola-nocturna.js --cola [--tope 6]        # JSON con los issues de esta noche (para la matriz)
//   node .github/cola-nocturna.js --contexto <n> <fichero>  # escribe el contexto del issue n
//   node .github/cola-nocturna.js --informe [noche.json] [--sin-aviso]  # actualiza el informe fijado
//
// Necesita `gh` con GH_TOKEN y GITHUB_REPOSITORY (los pone el workflow `nocturno`).
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const DUENO = 'rsotor';
const PLANTILLAS = ['feedback', 'instalación', 'mejora'];
const PUNTOS = { 't:s': 1, 't:m': 3 };
const PUNTOS_SIN_TAMANO = 3;   // sin clasificar: Claude lo clasifica y, si es S o M, lo hace en la misma pasada
const PUNTOS_PROPUESTA = 1;
const PUNTOS_IMPLEMENTAR_L = 5;
const TOPE_POR_DEFECTO = 6;

const tiene = (issue, etiqueta) => issue.etiquetas.includes(etiqueta);
const esDelBot = login => /\[bot\]$/.test(login || '');

// Pura: qué hacer con un issue esta noche. null = no entra (y `motivo` dice por qué, para el informe).
function clasificar(issue) {
  const fuera = motivo => ({ numero: issue.numero, entra: false, motivo });
  if (!PLANTILLAS.some(p => tiene(issue, p))) return fuera('sin etiqueta de plantilla');
  const autorizado = issue.autor === DUENO || issue.goPor === DUENO || tiene(issue, 'claude:aprobado');
  if (!autorizado) return fuera(`claude:go no la puso ${DUENO}`);
  if (issue.tienePR) return fuera('ya tiene PR abierto');
  const base = { numero: issue.numero, entra: true };
  if (tiene(issue, 'claude:aprobado')) return { ...base, modo: 'implementar-propuesta', puntos: PUNTOS_IMPLEMENTAR_L, grupo: 0 };
  if (tiene(issue, 'claude:propuesta')) return fuera('propuesta esperando a Roberto');
  const grupo = tiene(issue, 'mejora') ? 2 : 1;
  if (tiene(issue, 'claude:bloqueado')) {
    const respondido = issue.ultimoDueno && (!issue.ultimoBot || issue.ultimoDueno > issue.ultimoBot);
    if (!respondido) return fuera('bloqueado, sin respuesta de Roberto');
    return { ...base, modo: 'continuar', puntos: puntosPorTamano(issue), grupo: 0 };
  }
  if (tiene(issue, 't:l')) return { ...base, modo: 'proponer', puntos: PUNTOS_PROPUESTA, grupo };
  return { ...base, modo: tamano(issue) ? 'implementar' : 'clasificar', puntos: puntosPorTamano(issue), grupo };
}

const tamano = issue => ['t:s', 't:m', 't:l'].find(t => tiene(issue, t)) || null;
function puntosPorTamano(issue) {
  const t = tamano(issue);
  if (t === 't:l') return PUNTOS_IMPLEMENTAR_L;
  return PUNTOS[t] || PUNTOS_SIN_TAMANO;
}
const prioridad = issue => (tiene(issue, 'p:alta') ? 0 : tiene(issue, 'p:baja') ? 2 : 1);

// Pura: la cola de la noche. Ordena (desbloqueados → fallos → mejoras; prioridad; antigüedad) y llena el tope:
// lo que no cabe se salta, pero se sigue mirando por si cabe algo más pequeño detrás.
function cola(issues, tope = TOPE_POR_DEFECTO) {
  const decisiones = issues.map(i => ({ ...clasificar(i), prioridad: prioridad(i), creado: i.creado }));
  const candidatos = decisiones.filter(d => d.entra)
    .sort((a, b) => a.grupo - b.grupo || a.prioridad - b.prioridad || a.creado.localeCompare(b.creado));
  const elegidos = [];
  let gastado = 0;
  for (const c of candidatos) {
    if (gastado + c.puntos > tope) continue;
    gastado += c.puntos;
    elegidos.push({ numero: c.numero, modo: c.modo, puntos: c.puntos });
  }
  const fuera = decisiones.filter(d => !d.entra).map(d => ({ numero: d.numero, motivo: d.motivo }));
  const sinSitio = candidatos.filter(c => !elegidos.some(e => e.numero === c.numero)).map(c => c.numero);
  return { elegidos, gastado, tope, fuera, sinSitio };
}

// Pura: el contexto que lee Claude. Solo el título, el cuerpo (Roberto lo leyó al poner claude:go) y lo que
// escribió Roberto: los comentarios de cualquier otro, que pueden llegar después de su visto bueno, no.
function contexto(issue, comentarios) {
  const l = [`# Issue #${issue.numero}: ${issue.titulo}`, '', `Etiquetas: ${issue.etiquetas.join(', ') || '(ninguna)'}`, '',
    '## Cuerpo', '', issue.cuerpo || '(vacío)'];
  const deRoberto = comentarios.filter(c => c.autor === DUENO);
  if (deRoberto.length) {
    l.push('', `## Comentarios de ${DUENO}`);
    for (const c of deRoberto) l.push('', `### ${c.fecha}`, '', c.cuerpo);
  }
  return l.join('\n') + '\n';
}

// Pura: valida el resultado-issue.json que deja Claude. Lo que no cuadra no se publica.
const ACCIONES = ['pr', 'propuesta', 'pregunta', 'nada'];
function validarResultado(r) {
  const errores = [];
  if (!r || typeof r !== 'object') return { ok: false, errores: ['no es un objeto JSON'] };
  if (!ACCIONES.includes(r.accion)) errores.push(`accion "${r.accion}" no es ${ACCIONES.join('|')}`);
  if (!['t:s', 't:m', 't:l'].includes(r.tamano)) errores.push(`tamano "${r.tamano}" no es t:s|t:m|t:l`);
  if (![null, undefined, 'p:alta', 'p:baja'].includes(r.prioridad)) errores.push(`prioridad "${r.prioridad}" no vale`);
  if (r.accion === 'pr') {
    if (!/^(arreglo|mejora|docs|test|chore)(\([^)]+\))?: \S/.test(r.titulo_pr || '')) errores.push('titulo_pr sin el formato «tipo: qué cambia»');
    if (!r.cuerpo_pr) errores.push('falta cuerpo_pr');
  } else if (!r.comentario) errores.push('falta comentario');
  return { ok: errores.length === 0, errores };
}

// Pura: qué ficheros cambiados impiden abrir el PR (la App tampoco puede tocar workflows: doble barrera).
const PROHIBIDO_EN_PR = /^\.github\//;
const prohibidos = ficheros => ficheros.filter(f => PROHIBIDO_EN_PR.test(f));

// El informe: un issue fijado por mes («Informe de mantenimiento 2026-10»). Arriba, lo que espera a Roberto (se
// rehace siempre); debajo, una línea por noche, la más reciente primero. Al cambiar de mes se cierra el anterior:
// en un año quedan doce issues pequeños, no uno que crece sin fin.
const TITULO_INFORME = 'Informe de mantenimiento';
const HISTORIAL = '## Historial del mes';
const tituloDelMes = fechaIso => `${TITULO_INFORME} ${fechaIso.slice(0, 7)}`;

// Pura: la línea de una noche. `noche` = la salida de cola(); null = no corrió (interruptor apagado o fallo).
function lineaNoche(dia, noche) {
  if (!noche) return `- ${dia}: no corrió (interruptor apagado o fallo antes de elegir)`;
  const hechos = noche.elegidos.length ? noche.elegidos.map(e => `#${e.numero} ${e.modo} (${e.puntos} pt)`).join(', ') : 'cola vacía';
  const sinSitio = noche.sinSitio.length ? ` · sin sitio: ${noche.sinSitio.map(x => `#${x}`).join(', ')}` : '';
  return `- ${dia}: ${hechos} · ${noche.gastado}/${noche.tope}${sinSitio}`;
}

// Pura: las líneas del historial de un informe ya escrito.
function historialDe(cuerpo) {
  const i = (cuerpo || '').indexOf(HISTORIAL);
  if (i < 0) return [];
  return cuerpo.slice(i + HISTORIAL.length).split('\n').filter(l => l.startsWith('- '));
}

// Pura: añade la noche arriba del historial; si ya había una línea de ese día (una pasada a mano), la sustituye.
function anotarNoche(historial, linea) {
  const dia = linea.slice(2, linea.indexOf(':'));
  return [linea, ...historial.filter(l => !l.startsWith(`- ${dia}:`))];
}

// Pura: el cuerpo del informe.
function informe({ fecha, interruptor, propuestas, bloqueados, prs, historial }) {
  const enlaces = xs => (xs.length ? xs.map(x => `- #${x.numero} ${x.titulo}`).join('\n') : '- Nada');
  const l = [`Actualizado: ${fecha}. Interruptor \`CLAUDE_NOCTURNO\`: **${interruptor}**.`, ''];
  l.push('## Esperan tu decisión', '', '**Propuestas** (`claude:propuesta`: aprueba con `claude:aprobado`)', '', enlaces(propuestas), '',
    '**Preguntas** (`claude:bloqueado`: responde en el issue)', '', enlaces(bloqueados), '',
    '**PRs del bot para revisar**', '', enlaces(prs), '');
  l.push(HISTORIAL, '', ...(historial.length ? historial : ['- Todavía ninguna noche este mes']));
  return l.join('\n') + '\n';
}

// Pura: el comentario que avisa a Roberto por email. null los días en que nada le espera.
const AVISO = `@${DUENO} Te esperan:`;
function avisoDeLaManana({ propuestas, bloqueados, prs }) {
  const partes = [[propuestas.length, 'propuesta', 'propuestas'], [bloqueados.length, 'pregunta', 'preguntas'], [prs.length, 'PR para revisar', 'PRs para revisar']]
    .filter(([n]) => n > 0).map(([n, uno, varios]) => `${n} ${n === 1 ? uno : varios}`);
  if (!partes.length) return null;
  return `${AVISO} ${partes.join(', ')}. El detalle, arriba en el informe.`;
}

// --- Lo que habla con GitHub ---------------------------------------------------------------------------------
function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh ${args.join(' ')}: ${r.stderr}`);
  return JSON.parse(r.stdout || 'null');
}

function leerIssue(repo, n, ramasConPR) {
  const i = gh(['api', `repos/${repo}/issues/${n}`]);
  const eventos = gh(['api', '--paginate', '--slurp', `repos/${repo}/issues/${n}/events`]).flat();
  const comentarios = gh(['api', '--paginate', '--slurp', `repos/${repo}/issues/${n}/comments`]).flat()
    .map(c => ({ autor: c.user.login, fecha: c.created_at, cuerpo: c.body || '' }));
  const go = eventos.filter(e => e.event === 'labeled' && e.label && e.label.name === 'claude:go').pop();
  const ultimo = filtro => comentarios.filter(filtro).map(c => c.fecha).pop() || null;
  return {
    issue: {
      numero: i.number, titulo: i.title, cuerpo: i.body || '', autor: i.user.login, creado: i.created_at,
      etiquetas: i.labels.map(e => e.name), goPor: go ? go.actor.login : null,
      tienePR: ramasConPR.has(`claude/issue-${i.number}`),
      ultimoDueno: ultimo(c => c.autor === DUENO), ultimoBot: ultimo(c => esDelBot(c.autor)),
    },
    comentarios,
  };
}

function ramasConPRAbierto(repo) {
  return new Set(gh(['pr', 'list', '-R', repo, '--state', 'open', '--limit', '200', '--json', 'headRefName']).map(p => p.headRefName));
}

function cli(args, entorno = process.env) {
  const repo = entorno.GITHUB_REPOSITORY;
  if (!repo) { console.error('Falta GITHUB_REPOSITORY'); return 2; }
  if (args[0] === '--cola') {
    const i = args.indexOf('--tope');
    const tope = i >= 0 ? Number(args[i + 1]) : TOPE_POR_DEFECTO;
    const ramas = ramasConPRAbierto(repo);
    const numeros = new Set();
    for (const etiqueta of ['claude:go', 'claude:aprobado']) {
      for (const x of gh(['issue', 'list', '-R', repo, '--state', 'open', '--label', etiqueta, '--limit', '200', '--json', 'number'])) numeros.add(x.number);
    }
    const issues = [...numeros].map(n => leerIssue(repo, n, ramas).issue);
    console.log(JSON.stringify(cola(issues, tope)));
    return 0;
  }
  if (args[0] === '--contexto' && args[1] && args[2]) {
    const { issue, comentarios } = leerIssue(repo, Number(args[1]), new Set());
    fs.writeFileSync(args[2], contexto(issue, comentarios));
    return 0;
  }
  if (args[0] === '--aplicar' && args[1] && args[2]) return aplicar(repo, Number(args[1]), args[2], args[3]);
  if (args[0] === '--informe') return rehacerInforme(repo, args, entorno);
  console.error('Uso: cola-nocturna.js --cola [--tope N] | --contexto <n> <fichero> | --aplicar <n> <resultado.json> <modo> | --informe [noche.json] [--sin-aviso]');
  return 2;
}

// Rehace el informe del mes. Con `--sin-aviso` (fuera de la noche) no anota noche ni avisa.
function rehacerInforme(repo, args, entorno) {
  const deNoche = !args.includes('--sin-aviso');
  const ruta = args[1] && !args[1].startsWith('--') ? args[1] : null;
  const noche = ruta && fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8') || 'null') : null;
  const ahora = new Date().toISOString();
  const titulo = tituloDelMes(ahora);
  const conEtiqueta = e => gh(['issue', 'list', '-R', repo, '--state', 'open', '--label', e, '--json', 'number,title'])
    .map(x => ({ numero: x.number, titulo: x.title }));
  const prs = gh(['pr', 'list', '-R', repo, '--state', 'open', '--json', 'number,title,headRefName'])
    .filter(p => p.headRefName.startsWith('claude/issue-')).map(x => ({ numero: x.number, titulo: x.title }));
  const pendiente = { propuestas: conEtiqueta('claude:propuesta'), bloqueados: conEtiqueta('claude:bloqueado'), prs };

  const abiertos = gh(['issue', 'list', '-R', repo, '--state', 'open', '--search', `"${TITULO_INFORME}" in:title`, '--json', 'number,title,body'])
    .filter(x => x.title.startsWith(TITULO_INFORME));
  const actual = abiertos.find(x => x.title === titulo);
  for (const viejo of abiertos.filter(x => x !== actual)) {   // el del mes pasado (o el primero, sin mes)
    spawnSync('gh', ['issue', 'unpin', String(viejo.number), '-R', repo], { stdio: 'inherit' });
    spawnSync('gh', ['issue', 'close', String(viejo.number), '-R', repo, '--comment', `Cerrado: sigue en «${titulo}».`], { stdio: 'inherit' });
  }
  let historial = historialDe(actual && actual.body);
  if (deNoche) historial = anotarNoche(historial, lineaNoche(ahora.slice(5, 10), noche));
  const cuerpo = informe({
    fecha: ahora.slice(0, 16).replace('T', ' ') + ' UTC', interruptor: entorno.CLAUDE_NOCTURNO || 'sin definir', ...pendiente, historial,
  });
  let num = actual && String(actual.number);
  if (num) spawnSync('gh', ['issue', 'edit', num, '-R', repo, '--body', cuerpo], { stdio: 'inherit' });
  else {
    const r = spawnSync('gh', ['issue', 'create', '-R', repo, '--title', titulo, '--body', cuerpo], { encoding: 'utf8' });
    num = (r.stdout.match(/\/issues\/(\d+)/) || [])[1];
    if (num) spawnSync('gh', ['issue', 'pin', num, '-R', repo], { stdio: 'inherit' });
  }
  if (!num || !deNoche) return 0;
  // Editar el informe no manda email; el aviso sí. Solo uno vivo: antes de escribirlo se borra el anterior.
  const comentarios = gh(['api', '--paginate', '--slurp', `repos/${repo}/issues/${num}/comments`]).flat();
  for (const c of comentarios.filter(c => esDelBot(c.user.login) && (c.body || '').startsWith(AVISO))) {
    spawnSync('gh', ['api', '-X', 'DELETE', `repos/${repo}/issues/comments/${c.id}`], { stdio: 'inherit' });
  }
  const aviso = avisoDeLaManana(pendiente);
  if (aviso) spawnSync('gh', ['issue', 'comment', num, '-R', repo, '--body', aviso], { stdio: 'inherit' });
  return 0;
}

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

// Publica lo que decidió Claude: etiquetas, comentario y, si hay cambios, la rama y el PR (como el bot).
function aplicar(repo, n, fichero, modo) {
  let r;
  try { r = JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch { r = null; }
  const v = validarResultado(r);
  if (!v.ok) {
    spawnSync('gh', ['issue', 'comment', String(n), '-R', repo, '--body',
      `@${DUENO} La pasada de esta noche no dejó un resultado válido (${v.errores.join('; ')}). No he publicado nada.`]);
    spawnSync('gh', ['issue', 'edit', String(n), '-R', repo, '--add-label', 'claude:bloqueado']);
    return 1;
  }
  const quitar = ['claude:bloqueado'];
  const poner = [r.tamano, r.prioridad].filter(Boolean);
  const cambiados = git(['status', '--porcelain']).split('\n').filter(Boolean).map(l => l.slice(3));
  if (r.accion === 'pr') {
    const malos = prohibidos(cambiados);
    if (!cambiados.length || malos.length) {
      const motivo = malos.length ? `toca ${malos.join(', ')}, que no puede cambiar de noche` : 'no cambió ningún fichero';
      spawnSync('gh', ['issue', 'comment', String(n), '-R', repo, '--body', `@${DUENO} Iba a abrir un PR, pero ${motivo}. Lo dejo para ti.`]);
      spawnSync('gh', ['issue', 'edit', String(n), '-R', repo, '--add-label', 'claude:bloqueado']);
      return 1;
    }
    const rama = `claude/issue-${n}`;
    git(['switch', '-c', rama]);
    git(['add', '-A']);
    git(['commit', '-m', `${r.titulo_pr}\n\nIssue #${n}.`]);
    git(['push', '--force', 'origin', rama]);
    const aviso = modo === 'implementar-propuesta' ? '\n\nPropuesta aprobada: este PR lo mergea Roberto.' : '';
    spawnSync('gh', ['pr', 'create', '-R', repo, '--base', 'main', '--head', rama, '--title', r.titulo_pr,
      '--body', `${r.cuerpo_pr}${aviso}\n\n🤖 Hecho de noche por Claude (issue #${n}).`], { stdio: 'inherit' });
  } else {
    const mencion = r.accion === 'nada' ? '' : `@${DUENO} `;
    spawnSync('gh', ['issue', 'comment', String(n), '-R', repo, '--body', `${mencion}${r.comentario}`], { stdio: 'inherit' });
    if (r.accion === 'propuesta') poner.push('claude:propuesta');
    if (r.accion === 'pregunta') { poner.push('claude:bloqueado'); quitar.length = 0; }
  }
  const editar = ['issue', 'edit', String(n), '-R', repo];
  for (const e of poner) editar.push('--add-label', e);
  for (const e of quitar) editar.push('--remove-label', e);
  spawnSync('gh', editar, { stdio: 'inherit' });
  return 0;
}

if (require.main === module) process.exitCode = cli(process.argv.slice(2));

module.exports = {
  clasificar, cola, contexto, validarResultado, prohibidos, informe, avisoDeLaManana, lineaNoche, historialDe, anotarNoche, tituloDelMes,
  cli, DUENO, TOPE_POR_DEFECTO,
};
