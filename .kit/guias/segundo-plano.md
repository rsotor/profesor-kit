# Preparar una clase en segundo plano

> Parte de `AGENTS.md` que se lee solo cuando hace falta.

## Lanzarla, desde la conversación (casos 2 y 3 de "Al empezar cada sesión")

1. **Antes de lanzar, pregunta lo que solo él sabe**: el id de cada sesión si la regla de `config/curso.md` no
   basta, y cualquier duda del material que no puedas resolver tú. Lo que se lanza ya no pregunta nada.
2. `node .kit/herramientas/preparar.js --lanzar <ficheros de inbox> --id <id>`. Una sola a la vez.
3. Sigue con él (calentamiento, repaso, dudas, examen). **Al terminar cada actividad**, mira
   `node .kit/herramientas/preparar.js --estado`. En cuanto esté **terminada**, júntala con `--juntar <id>` y
   díselo: "la clase 3 ya está lista: empieza por la nota de la sesión". Si **falla**, díselo en una frase y
   ofrécele prepararla aquí, en la conversación.
4. Si se va a por un café, déjala lanzada y díselo: al volver (o en la sesión siguiente, si cierra la ventana)
   la juntas antes que nada. Si apaga o duerme el ordenador, se para: `estado.js` la verá **interrumpida**.

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
