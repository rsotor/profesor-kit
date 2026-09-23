# Plan 0.22.0 · Tutoría y preparación

Estado: **revisado con Roberto**, listo para implementar · 2026-09-23 · rama `feat/tutoria-y-preparacion` (sale de
`feat/mejoras-kit`; se rebasa sobre `main` cuando se publique la 0.21.0).

## 1. El problema

Preparar una clase (`/sesion`) tarda **entre 6 y 10 minutos** con Sonnet (observado en la primera prueba real; la cifra definitiva, en su `RESUMEN.md`). El alumno
abre su curso para estudiar y se encuentra esperando. Sobre todo al principio del curso, cuando cada clase es
material nuevo, eso quita las ganas.

## 2. La idea (decidida con Roberto)

Dos tipos de trabajo, que el profesor distingue al empezar:

- **Tutoría**, con el alumno delante: saludo, calentamiento, dudas, exámenes, ejercicios y repasos. Responde en
  segundos.
- **Preparación**, sin el alumno: procesar el material de una clase. Puede ir **en segundo plano** mientras la
  tutoría sigue.

Al abrir, el profesor mira cómo está el curso y **lo confirma con el alumno**:

| Caso | Cómo lo sabe el profesor | Qué propone |
|---|---|---|
| **1. Estudiar lo ya preparado** | No hay material nuevo en `inbox/` | Seguir por **inicio** (👉 *Sigue por aquí*), con calentamiento, repaso o examen. Nada en segundo plano |
| **2. Al día, con material nuevo** | Hay material nuevo y ha estudiado todo lo preparado | "Tengo que preparar la clase, tardo unos minutos. ¿Hacemos un repaso rápido mientras tanto (gasta más cuota) o te vas a por un café y te aviso?" |
| **3. Atrasado, con material nuevo** | Hay material nuevo y le quedan sesiones preparadas sin estudiar, o algo en 🔁 | Lo nuevo **no le hace falta hoy**, así que pregunta: "¿Voy preparando la clase nueva mientras repasamos lo pendiente (gasta más cuota), o la dejo para otro día?" Decide el alumno |

"Material nuevo" = un fichero de `estudio/inbox/` que ninguna sesión cita en su `fuente:`.

## 3. Piezas

### 3.1 `estado.js`: la foto del curso al abrir

`node .kit/herramientas/estado.js --json` devuelve lo que necesita el arranque, sin que el profesor tenga que
leer diez ficheros:

- material nuevo en `inbox/` (sin sesión que lo cite);
- siguiente sesión sin estudiar, sesiones preparadas sin estudiar y sesiones en 🔁 (reutiliza `lib/indice.js`);
- preparaciones en curso, terminadas sin juntar o fallidas (ver 3.3);
- el caso sugerido (1, 2 o 3). **Es una sugerencia**: el profesor lo confirma con el alumno.

`AGENTS.md`, "Al empezar cada sesión", se reescribe alrededor de esto.

### 3.2 P3 · Calentamiento

En los casos 1 y 3, y en el 2 si el alumno elige quedarse: **dos preguntas** de lo que ya vio y la sesión
siguiente necesita. Salen de `requiere:` de los conceptos de esa sesión y de `progreso.md` (flojo o sin
evaluar primero). Reglas de "Cuando preguntas para medir". Se puede saltar ("ahora no"). Las respuestas cuentan
como prueba y mueven `progreso.md`. Si lo salta tres veces seguidas, deja de ofrecerlo y lo apunta en
`config/alumno.md`. Vive en `AGENTS.md` (arranque) y en una línea de `/sesion`.

**Si la preparación sigue en marcha** tras las dos preguntas (caso 2 con el alumno esperando), el profesor no le
deja parado. Le dice que aún queda un poco y le ofrece seguir según cómo ha ido: si acertó, "lo estás haciendo
genial, ¿quieres un par de preguntas más, un poco más difíciles?"; si falló algo, "¿repasamos eso mientras
termino?". Así hasta que la clase esté lista o el alumno prefiera parar.

### 3.3 `preparar.js`: preparación en segundo plano

**Lanzar.** `node .kit/herramientas/preparar.js --lanzar <fichero de inbox> [más ficheros] --id <id de sesión>`

1. **Antes de lanzar, la parte que necesita al alumno se hace en la tutoría:** el id de cada sesión (si la regla
   de `config/curso.md` no basta) y cualquier duda del material que solo él pueda resolver. El trabajo en segundo
   plano nunca pregunta: lo dudoso queda como `TODO`.
2. Crea una **copia de trabajo aparte** con git (`git worktree`) en `.preparacion/<id>/`, en una rama
   `preparacion/<id>`. `.preparacion/` va al `.gitignore` del kit (se fusiona al actualizar), así que ni el
   guardado principal, ni `comprobar.js`, ni el escaneo de secretos, ni Obsidian (que abre `estudio/`) la ven.
3. Lanza el asistente **sin conversación** con el comando del adaptador (campo nuevo, ver 3.4), en esa copia, como
   proceso independiente: sigue aunque el alumno cierre la ventana. Salida a `.preparacion/<id>/registro.txt` y
   estado en `.preparacion/<id>/estado.json` (pid, ficheros, inicio, fin, resultado).
4. Si hay varios ficheros, los prepara **en orden dentro de la misma copia**. **Una preparación a la vez** por
   curso: si ya hay una, `--lanzar` se niega y lo dice.
5. El prompt dice que trabaja en segundo plano: no saluda, no pregunta, no comprueba versión, procesa con
   `/sesion`, deja lo dudoso como `TODO` y guarda. `AGENTS.md` gana una sección corta "Si trabajas en segundo
   plano".
6. En esa copia, `guardar.js` hace commit pero **no sube** (detecta la rama `preparacion/*`).

**Ver.** `preparar.js --estado`: en curso (con minutos), terminada, fallida (con las últimas líneas del registro).

**Juntar.** `preparar.js --juntar <id>`, cuando ha terminado:

1. `git merge` de la rama en el curso principal, sin commit todavía.
2. **Choques previstos y cómo se resuelven solos:**
   - `config/diario.md` (los dos lados añaden líneas al final): se juntan las dos con el driver `union` de git,
     que `preparar.js` configura en `.git/info/attributes` del curso (sin tocar el motor).
   - Ficheros generados (`inicio.md`, `pendientes.md`, `formulario.md`, `ejercicios/_index.md`,
     `auditoria-del-material.md`, pies de sesión, `Estado` del README): se toma cualquiera de los dos lados y se
     **regeneran** después, que es lo que son.
   - `estudio/progreso.md`: la preparación añade filas de conceptos nuevos y la tutoría cambia estados de filas
     existentes; son líneas distintas y git las junta solo.
3. **Cualquier otro choque** (raro: los dos lados tocaron el mismo concepto): se aborta el merge, el curso
   principal queda como estaba, la rama se conserva, y `--juntar` lista los ficheros. El profesor lo resuelve con
   el alumno o vuelve a preparar esa clase.
4. Después: `regenerarGenerados`, `comprobar.js` (errores = no se junta, se explica), commit
   `sesion(<id>): <tema> (preparada en segundo plano)`, subida si procede, y se borra la copia y la rama.

**Avisar al alumno.** Un proceso aparte no puede interrumpir la conversación. El profesor mira `--estado`
**al terminar cada actividad** con el alumno (una pregunta, un ejercicio, un examen) y, en cuanto esté, lo junta
y se lo dice: "la clase 3 ya está lista: empieza por la nota de la sesión". Si el alumno se fue a por un café y
cerró la ventana, el arranque de la sesión siguiente la encuentra terminada y la junta primero.

### 3.4 Adaptador: `segundo_plano`

Campo nuevo en `.kit/adaptadores/<llm>.json` y en `ESTANDARES.md`: el comando para trabajar sin conversación,
con huecos (`{prompt}`, `{modelo}`). Para Claude, el que ya usa la prueba real:
`claude -p {prompt} --model {modelo} --permission-mode acceptEdits --permission-prompts none`. Sin este campo, no
hay segundo plano: el caso 2 se reduce a "tardo unos minutos, ¿me esperas o vuelves luego?" y se prepara como
hoy. Windows: lanzar un `.cmd` necesita `shell: true` y comillas cuidadas; se prueba en el CI.

### 3.5 Lo que ve el alumno

- La hoja *Cómo usar tu profesor* explica los tres casos en llano y lo de la cuota.
- CHANGELOG con "Si ya tenías tu curso" (no hace falta migración: no cambia el formato de los datos).

## 4. Pruebas

- **Unitarias** de `estado.js` (los tres casos) y de `preparar.js` con un **asistente de mentira** (un script de
  Node que escribe una nota y llama a `guardar.js`): lanzar, una sola a la vez, estado, juntar sin choques,
  juntar con diario y generados en conflicto, choque real que aborta sin tocar nada, fallo del asistente, no sube
  desde la rama. En Mac y Windows (CI), con `temporal()`.
- **Prueba real**: un paso nuevo que lanza la preparación de la clase 3 en segundo plano **mientras** hace el
  examen del módulo 1 en primer plano, y luego junta. Es el caso de verdad con choques posibles.
- **Prueba de actualización**: sin cambios (no hay migración).

## 5. Decisiones de Roberto (2026-09-23)

1. **Una preparación a la vez** por curso: **sí**.
2. **Si cierra la conversación o la terminal, la preparación sigue**: aceptado, con la explicación. La hace otro
   programa (el asistente sin conversación) lanzado aparte, no el profesor con el que habla; cerrar la ventana no
   lo para. Si se apaga o se duerme el ordenador, sí se para: el arranque siguiente lo detecta (proceso muerto sin
   fin anotado → "interrumpida"), descarta la copia (el curso principal no se tocó) y ofrece volver a prepararla.
   Se prueba en Mac y en Windows.
3. **El aviso llega entre actividades**, no al instante: **ok**.
4. **La prueba real incluye el caso en paralelo**: **ok**.
5. **Carpeta de las copias `.preparacion/`**: **ok**.

## 6. Fuera de esta versión

- Varias preparaciones en paralelo.
- Aviso instantáneo (notificación del sistema): no es portable entre asistentes ni sistemas.
- Preparar en segundo plano con asistentes sin modo "sin conversación": se queda en primer plano.

## 7. Orden de trabajo

1. `estado.js` + arranque en `AGENTS.md` + P3 (sin segundo plano todavía): ya da valor en los casos 1 y 3.
2. `preparar.js` (lanzar, estado, juntar) + campo del adaptador + `guardar.js` que no sube desde `preparacion/*`.
3. Hoja del alumno, CHANGELOG, `docs/arquitectura.md`, `CONTRIBUTING.md`.
4. Prueba real con el paso en paralelo, en el Mac de Roberto. PR cuando todo esté en verde.
