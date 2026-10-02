# Preparar una clase en segundo plano

> Parte de `AGENTS.md` que se lee solo cuando hace falta.

## Lanzarla, desde la conversación (casos 2 y 3 de "Al empezar cada sesión")

1. **Antes de lanzar, pregunta lo que solo él sabe**: el id de cada sesión si la regla de `config/curso.md` no
   basta, y cualquier duda del material que no puedas resolver tú. Lo que se lanza ya no pregunta nada.
2. `node .kit/herramientas/preparar.js --lanzar <ficheros o carpeta de inbox> --id <id>`. Una sola preparación a la
   vez (puede llevar varias clases, abajo). Las
   rutas son relativas a `estudio/inbox/`. Si la clase es una carpeta, antes `--lanzar <carpeta> --ver` y enséñale qué
   entra y qué se queda fuera (audio sin transcribir, subcarpetas): solo se lanza con su sí.
   **Con 2 clases nuevas o más, una detrás de otra:** lanzas la primera y, al juntarla, la siguiente. Prepararlas a
   la vez gasta mucha cuota: no se lo ofrezcas. **Solo si él lo pide expresamente** ("prepáralas todas a la vez") y
   tu adaptador trae `subagentes`, avísale antes en una frase y espera su sí: "Prepararlas a la vez gasta bastante más
   cuota de tu asistente que de una en una, y con un plan básico puedes quedarte sin cuota hasta que se renueve.
   ¿Seguro que las quieres a la vez?". Con su sí: `--lanzar --clase <id> <ficheros o carpeta> --clase <id> <...>` (con
   `--ver` antes, igual). Si dice que no o duda, una detrás de otra. Sin `subagentes`, dile que tu asistente no
   puede prepararlas a la vez, y una detrás de otra.
3. Sigue con él (calentamiento, repaso, dudas, examen), y no lo dejes parado mientras se prepara: sigue según
   cómo va — si acierta, "lo estás haciendo genial, ¿quieres un par de preguntas más, un poco más difíciles?";
   si falla algo, "¿repasamos eso mientras termino?". Así hasta que la clase esté lista o prefiera parar.
4. **Al terminar cada actividad**, mira `node .kit/herramientas/preparar.js --estado`:
   - **Terminada:** va antes que nada — júntala con `--juntar <id>` y díselo: "la clase 3 ya está lista: empieza
     por la nota de la sesión". Si algo de lo que hicisteis mientras tanto (un examen, unas dudas) se quedó sin
     guardar, `--juntar` lo guarda solo antes de mezclar — no hace falta un `guardar.js` aparte.
   - **Fallida:** díselo en una frase y ofrécele prepararla aquí, en la conversación. Si las líneas del registro que
     enseña `--estado` hablan de cuota o de límite de uso, no: tampoco te queda a ti. Propónle relanzarla cuando se
     renueve. Al relanzar, lo que llegó a escribirse se guarda en una rama `preparacion-descartada/…`, por si hiciera
     falta; la clase se prepara de nuevo.
   - **Interrumpida** (se apagó o se durmió el ordenador a medio camino): díselo y ofrécele volver a
     prepararla.
5. Si se va a por un café, déjala lanzada y díselo: al volver (o en la sesión siguiente, si cierra la ventana)
   resuelve lo de arriba —terminada, fallida o interrumpida— antes que nada.

## Si trabajas en segundo plano (te lanza `preparar.js --trabajar`)

Esto no te pasa a ti solo: te lanza `preparar.js --trabajar` en una copia aparte del curso
(`.preparacion/<id>/`), sin el alumno delante — el prompt te lo dice. Entonces:

- **No saludes, no preguntes nada** (ni al empezar ni por el camino): lo dudoso, `**TODO:**`, nunca una
  pregunta. Tampoco compruebes si hay una versión nueva del kit.
- Procesa el material con la skill `/sesion`, siguiendo el id que te den. Si son varios ficheros, son la
  misma clase. Si el prompt dice que son **varias clases**, no las procesas tú: sigue "Varias clases a la vez". (Si eres
  un subagente al que el coordinador encargó una clase, esto no va contigo: sigue su encargo.)
- Al terminar, `node .kit/herramientas/guardar.js "sesion(<id>): <tema>"` como siempre. Estás en una rama
  `preparacion/<id>`: `guardar.js` ya sabe que no tiene que subir (se sube cuando el profesor la junte con
  `--juntar`). No hagas nada más — nadie está mirando la pantalla, así que no hay nada que "contar" al
  terminar.

## Varias clases a la vez (te lanza `preparar.js` con varias clases)

Coordinas tú, y cada clase la prepara un subagente (la herramienta de `subagentes` de tu adaptador). Un subagente no
puede lanzar otro: todos los lanzas tú. Lo de arriba sigue valiendo: nadie delante, nada de preguntas.

**Fase 1, qué conceptos hay.** Un subagente por clase, todos a la vez, con este encargo:

> Lee entero el material de la clase <id> (<ficheros>), como dicen los puntos 1 y 1c de la skill `/sesion` (un Word,
> PowerPoint o Excel, con `leer.js`). No escribas ningún fichero. Devuélveme los conceptos de la clase, uno por línea:
> nombre — definición en una frase — qué aporta esta clase sobre él — de qué fichero sale.

**Entre las dos fases, tú.** Con todas las listas delante:

- Cada concepto, contra `estudio/conceptos/_index.md` (slugs y `alias`) y, si no es evidente, con `candidatos.js`.
  Y entre las listas: el mismo concepto en dos clases es uno solo.
- Fija el slug de cada concepto y **un dueño**: la única clase que escribe esa nota. Si el concepto sale en varias
  clases, su dueño recibe lo que aporta cada una y sus ids (para `visto_en`, `bloques:` y `## Historial`).
- Si dudas de si dos cosas son lo mismo, `**TODO:**` con el candidato y por qué dudas.

**Fase 2, escribir.** Un subagente por clase, todos a la vez, con este encargo:

> Eres un subagente, no el coordinador: la línea de `/sesion` sobre `preparar.js --trabajar` y el apartado "Varias
> clases a la vez" de `.kit/guias/segundo-plano.md` no van contigo. No preguntes nada: lo dudoso, `**TODO:**`. Prepara
> la clase <id> (<ficheros>) siguiendo la skill `/sesion`, puntos 1 a 6, con este id. Notas que escribes tú: <slugs
> nuevos>. Notas que amplías: <slugs, con lo que aportan las otras clases y sus ids>. Notas de otras clases que solo
> enlazas: <slugs>. No toques ninguna otra nota de concepto (si un ejercicio tuyo es de una de ellas, devuélveme su
> `ejercicio:` y su `## Practícalo`). No toques `estudio/conceptos/_index.md`, `estudio/progreso.md`,
> `estudio/mapa-del-curso.md`, `README.md` ni `config/`. No ejecutes `comprobar.js`, `organizar.js` ni `guardar.js`.
> Termina devolviéndome exactamente estas secciones, vacías si no hay nada: `## _index` (líneas nuevas o alias),
> `## progreso` (filas), `## mapa-del-curso` (cobertura de la clase), `## Notas ajenas` (lo de los ejercicios),
> `## Unidad nueva` (si la unidad no está en `config/estructura.json`: su id y su título).

**Cerrar, tú y una sola vez.** Con las secciones que devuelvan: si hay unidad nueva, añádela a
`config/estructura.json` y ejecuta `organizar.js`; lo de `## Notas ajenas`, en esas notas; y el punto 7 de `/sesion`
(los ficheros vivos) para todas las clases. Después `comprobar.js` (arregla lo que salga) y un solo
`guardar.js "sesion(<id>, <id>): <tema> · <tema>"`.

**Si un subagente falla**, no escribas tú su clase de memoria ni guardes nada: termina sin guardar. `preparar.js` dará
la preparación por fallida, lo escrito queda a salvo y se relanza entera.

