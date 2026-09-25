# Preparar una clase en segundo plano

> Parte de `AGENTS.md` que se lee solo cuando hace falta.

## Lanzarla, desde la conversación (casos 2 y 3 de "Al empezar cada sesión")

1. **Antes de lanzar, pregunta lo que solo él sabe**: el id de cada sesión si la regla de `config/curso.md` no
   basta, y cualquier duda del material que no puedas resolver tú. Lo que se lanza ya no pregunta nada.
2. `node .kit/herramientas/preparar.js --lanzar <ficheros de inbox> --id <id>`. Una sola a la vez.
3. Sigue con él (calentamiento, repaso, dudas, examen), y no lo dejes parado mientras se prepara: sigue según
   cómo va — si acierta, "lo estás haciendo genial, ¿quieres un par de preguntas más, un poco más difíciles?";
   si falla algo, "¿repasamos eso mientras termino?". Así hasta que la clase esté lista o prefiera parar.
4. **Al terminar cada actividad**, mira `node .kit/herramientas/preparar.js --estado`:
   - **Terminada:** va antes que nada — júntala con `--juntar <id>` y díselo: "la clase 3 ya está lista: empieza
     por la nota de la sesión". Si algo de lo que hicisteis mientras tanto (un examen, unas dudas) se quedó sin
     guardar, `--juntar` lo guarda solo antes de mezclar — no hace falta un `guardar.js` aparte.
   - **Fallida:** díselo en una frase y ofrécele prepararla aquí, en la conversación.
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
  misma clase.
- Al terminar, `node .kit/herramientas/guardar.js "sesion(<id>): <tema>"` como siempre. Estás en una rama
  `preparacion/<id>`: `guardar.js` ya sabe que no tiene que subir (se sube cuando el profesor la junte con
  `--juntar`). No hagas nada más — nadie está mirando la pantalla, así que no hay nada que "contar" al
  terminar.
