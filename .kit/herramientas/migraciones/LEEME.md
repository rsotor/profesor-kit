# Migraciones de datos

Una migración por cada cambio de formato de los datos del alumno. Sin migración, el cambio no se publica
(lo vigila `tests/coherencia.test.js`).

- Nombre: `NNN-descripcion.js`, donde `NNN` es la `version_datos` a la que lleva (`002-…` lleva de 1 a 2).
- Exporta `{ descripcion, migrar(raiz) }`.
- Determinista e idempotente: ejecutarla dos veces da lo mismo.
- **Transforma, nunca borra** contenido del alumno.
- Al añadirla: sube `version_datos` en `.kit/motor.json` y escribe un test con un curso en el formato viejo.
