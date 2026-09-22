'use strict';
// Arranque común de las herramientas: si una revienta de forma inesperada, lo dice claro y señala al kit.
// Un fallo así nunca es del curso ni del alumno: es nuestro, y tiene que llegar como issue.
function arrancar(cli, raiz, nombre) {
  const fallo = error => {
    console.error(`Fallo inesperado en ${nombre}: ${error.message}`);
    console.error('Esto es del kit, no del curso: abre una issue con node .kit/herramientas/issue.js (ver "Feedback al kit" en AGENTS.md).');
    process.exit(3);
  };
  try {
    const codigo = cli(process.argv.slice(2), raiz);
    if (codigo && typeof codigo.then === 'function') codigo.then(c => process.exit(c), fallo);
    else process.exit(codigo);
  } catch (error) {
    fallo(error);
  }
}
module.exports = { arrancar };
