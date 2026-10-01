# Revisar un examen antes de ofrecérselo

> Parte de `/examen` que se lee cuando toca revisar un examen.

Quien escribe un examen no puede revisarlo: sabe qué quería preguntar y cuál es la respuesta, y ve lo que pensaba
escribir, no lo que escribió. Por eso, antes de ofrecerle al alumno un examen nuevo, lo resuelve **a ciegas** alguien
sin tu contexto: sin la clave, sin las notas y sin la conversación en la que lo escribiste. Si su respuesta no coincide
con la clave, o acierta una pregunta sin saber la materia, hay algo que arreglar antes de que llegue al alumno.

## Quién lo revisa, por orden

1. **Un subagente**, si tu adaptador trae `subagentes` con `herramienta`. Lánzalo con esa herramienta y este encargo,
   cambiando las dos rutas:

   > Eres el revisor independiente de un examen que ha escrito otro profesor. Sigue
   > `.kit/guias/revisor-de-examenes.md`, apartado "Si eres el revisor". El examen es `estudio/examenes/<ruta>.md`. Tu
   > revisión va en `config/revisiones/<ruta>.json`, con `"revisor": "subagente"`. No abras `config/claves/` ni
   > `estudio/conceptos/`: lo resuelves a ciegas.

2. **Un proceso en segundo plano**, si no hay subagentes pero tu adaptador trae `segundo_plano`:

       node .kit/herramientas/examen.js --revisar <examen.md>

   Sigue con el alumno. Al terminar cada actividad, mira si ya está: `examen.js --revision <examen.md>`.

3. **El profesor de la sesión siguiente**, si no hay ninguna de las dos cosas o la revisión no llega. Al empezar,
   `estado.js` lo trae en `examenesSinRevisar`. Ese profesor no escribió el examen: lo revisa como revisor (apartado de
   abajo, con `"revisor": "otra-sesion"`), antes que nada y en silencio, y después hace lo de "Cuando llega la revisión".

**Nunca te revisas tú en la misma sesión en que lo escribiste.** Mientras el examen está pendiente, no se lo ofreces ni
le dices que existe. Si te lo pide: "lo estoy terminando de preparar", o, si queda para la sesión siguiente, "lo tienes
listo la próxima vez que abras el curso". No le hables de la revisión: es trabajo tuyo, no suyo.

## Si eres el revisor

- **Lee solo el examen.** Nunca `config/claves/`, `estudio/conceptos/`, `estudio/progreso.md` ni otros exámenes: lo
  resuelves como un alumno que sabe la materia, sin pistas.
- **Pregunta a pregunta, en orden:**
  1. Elige tu respuesta y piensa por qué, antes de mirar nada más.
  2. Di lo seguro que estás: `alta`, `media` o `baja`.
  3. Busca a propósito estos problemas:
     - **se acierta sin saber:** una pista en el enunciado, una palabra del enunciado repetida en una sola opción, la
       opción más larga o la única matizada, un descarte trivial;
     - **ambigua:** hay más de una opción defendible;
     - **pregunta doble:** pide dos cosas a la vez.
- **Escribe tu revisión** en el JSON que te han dicho, con tu herramienta de ficheros (nunca con un comando de shell):

      {
        "revisor": "subagente",
        "fecha": "AAAA-MM-DD",
        "preguntas": [
          { "numero": 1, "respuesta": ["b"], "seguridad": "alta", "problemas": [] },
          { "numero": 2, "respuesta": ["a", "c"], "seguridad": "media",
            "problemas": ["se acierta sin saber: la c es la única opción con un matiz"] }
        ]
      }

  Una entrada por pregunta, todas. `respuesta`, la letra o letras que marcarías. `problemas`, vacío si no ves ninguno.
  No escribas `resolucion`: es del profesor.
- **No toques** ni el examen ni la clave, y no le cuentes nada al alumno.

## Cuando llega la revisión (el profesor que le ofrecerá el examen)

    node .kit/herramientas/examen.js --revision <examen.md>

Lista lo pendiente, pregunta a pregunta. Para cada una:

- **El revisor contesta otra cosa que la clave:** mira quién tiene razón. Si la clave está mal, corrígela. Si la
  pregunta admite las dos lecturas, reescríbela. Si el revisor se equivocó y la pregunta está bien, déjala.
- **Señala un problema:** arregla la pregunta. Si se acierta sin saber, rehaz las opciones, para que todas se parezcan.
- **Escribe en su `resolucion` qué hiciste**, o por qué no hacía falta. Nunca cambies ni borres lo que escribió el
  revisor.

Cuando `--revision` diga que está resuelta, guarda (`guardar.js "examen: <alcance>"`) y ofréceselo al alumno, como dice
el apartado "Cómo lo contesta: lo elige él" de `/examen`.

`examen.js --corregir` no corrige la primera vez un examen sin la revisión resuelta, para no poner una nota con una
clave que nadie ha comprobado. `--sin-revision` lo corrige igual y deja el intento marcado: úsalo solo si de verdad no
se puede revisar, y díselo al alumno.
