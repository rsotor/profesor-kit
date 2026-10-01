'use strict';
// Antes de gastar cuota: ¿la copia local que se va a probar es la de GitHub? (2026-10-01: dos veces en el mismo día se
// lanzó la prueba real sobre una copia del Mac atrasada o separada de la rama del PR, y probó el código de antes.)
// Trae la rama de su remoto y compara. Atrasada o separada: no se prueba. Sin red o sin rama remota: se avisa y se sigue.
const { spawnSync } = require('node:child_process');

function comprobarRama(raiz) {
  const git = args => spawnSync('git', args, { cwd: raiz, encoding: 'utf8', timeout: 60000 });
  const salida = args => { const r = git(args); return r.status === 0 ? r.stdout.trim() : null; };
  const rama = salida(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = salida(['rev-parse', '--short', 'HEAD']);
  const avisos = [];
  const cambiado = salida(['status', '--porcelain', '--', '.kit/skills', '.kit/plantillas', 'AGENTS.md']);
  if (cambiado) avisos.push(`hay cambios sin guardar en skills, plantillas o AGENTS.md: se prueban, pero el resumen dirá commit ${commit}`);
  const upstream = salida(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (!upstream) return { ok: true, rama, commit, avisos: [...avisos, `la rama ${rama} no sigue a ninguna rama remota: se prueba ${commit} tal cual`] };
  const [remoto, ...resto] = upstream.split('/');
  if (git(['fetch', '--quiet', remoto, resto.join('/')]).status !== 0) avisos.push(`no se ha podido traer ${upstream} (¿sin red?): se compara con lo último que se trajo`);
  const [delante, detras] = (salida(['rev-list', '--left-right', '--count', `HEAD...${upstream}`]) || '0 0').split(/\s+/).map(Number);
  if (!detras) return { ok: true, rama, commit, upstream, avisos };
  const mensaje = delante
    ? `Tu copia de ${rama} (${commit}) se ha separado de ${upstream}: ${delante} commit(s) solo aquí y ${detras} solo allí. `
      + `Probarías otro código que el del PR. Mira qué es cada cosa (git log --oneline -3 y git log --oneline -3 ${upstream}); `
      + `si lo de aquí sobra: git checkout -B ${rama} ${upstream}`
    : `Tu copia de ${rama} (${commit}) va ${detras} commit(s) por detrás de ${upstream}: probarías el código de antes. Ponla al día: git pull`;
  return { ok: false, rama, commit, upstream, delante, detras, avisos, mensaje };
}

module.exports = { comprobarRama };
