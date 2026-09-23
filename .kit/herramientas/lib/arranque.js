'use strict';
// Arranque común de las herramientas: si una revienta de forma inesperada, lo dice claro y señala al kit.
// Un fallo así nunca es del curso ni del alumno: es nuestro, y tiene que llegar como issue. Excepción: un
// error del sistema operativo al ejecutar o escribir (EACCES, EPERM, EIO — típico de un entorno
// restringido/sandbox que exige autorización explícita) o un comando que no existe (ENOENT) no son "del
// kit": son del entorno donde corre el asistente, y decir "abre una issue" ahí solo confunde (issue #33).
const PERMISO = new Set(['EACCES', 'EPERM', 'EIO']);
function arrancar(cli, raiz, nombre) {
  const fallo = error => {
    if (PERMISO.has(error.code)) {
      console.error(`${nombre} no ha podido ejecutar o escribir algo: el entorno de tu asistente no lo deja (parece un entorno restringido/sandbox).`);
      console.error('Autoriza la ejecución fuera de ese entorno restringido y repite: esto no es un fallo del kit.');
      process.exit(3);
    }
    if (error.code === 'ENOENT') {
      console.error(`${nombre} no encuentra un comando o un fichero que necesita: ${error.message}`);
      console.error('Comprueba que lo que hace falta está instalado y en el PATH de esta terminal (si acabas de instalarlo, abre una ventana nueva). Esto no es un fallo del kit.');
      process.exit(3);
    }
    console.error(`Fallo inesperado en ${nombre}: ${error.message}`);
    console.error('Esto es del kit, no del curso: abre una issue con node .kit/herramientas/issue.js (ver "Feedback al kit" en AGENTS.md).');
    process.exit(3);
  };
  // El final normal fija process.exitCode en vez de llamar a process.exit: con stdout en una tubería la
  // escritura es asíncrona y process.exit la cortaría a medias (issue #35). Los fallos sí salen con
  // process.exit: lo que queda por escribir es un mensaje corto a stderr.
  try {
    const codigo = cli(process.argv.slice(2), raiz);
    if (codigo && typeof codigo.then === 'function') codigo.then(c => { process.exitCode = c; }, fallo);
    else process.exitCode = codigo;
  } catch (error) {
    fallo(error);
  }
}
module.exports = { arrancar };
