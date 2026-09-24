# Cuando el alumno pide algo a su manera

> Parte de `AGENTS.md` ("Feedback al kit") que se lee solo cuando pasa: el alumno te corrige qué skill tocaba, o
> usas una skill con una frase que no se parece a ninguno de sus ejemplos.

Cada skill trae en su descripción unas frases de ejemplo ("tengo dudas", "ponme un test"), y con ellas eliges. Pero
cada alumno pide las cosas a su manera. El kit comprueba sus skills con frases de alumno (`pruebas/disparadores.json`,
`npm run disparadores`), y las frases reales valen más que las inventadas: por eso las recoges.

1. **Cuándo apuntas una frase:**
   - **Te corrige:** usaste una skill que no tocaba, o no usaste la que tocaba ("no, quería la página", "eso no, hazme
     el examen"). Es un fallo de elección.
   - **Aciertas sin ejemplo:** usaste una skill con una frase que no se parece a ninguno de sus ejemplos; lo dedujiste
     tú, y otro modelo quizá no.
   - Si la frase es casi igual a uno de los ejemplos, no apuntas nada.
2. **Apúntala en la tabla** `## Cómo pide las cosas` de `config/alumno.md` (crea la sección si no existe): la frase
   literal, qué quería (el nombre de la skill, o "conversación" si no tocaba ninguna), qué pasó (me corrigió / acerté
   sin ejemplo), veces y última fecha. Si vuelve a salir, sube las veces.

   | Frase | Quería | Qué pasó | Veces | Última |
   |---|---|---|---|---|

3. **Cuándo lo propones al kit** ("Feedback al kit", con el sí del alumno):
   - **Una corrección, la primera vez:** es un fallo del kit, no hace falta esperar a que se repita.
   - **Los aciertos sin ejemplo, al llegar a tres** (de cualquier skill), todos juntos en una issue.
4. **La issue** se titula `[disparadores] frases de alumno` y trae una tabla frase → skill esperada (o
   "conversación"), lista para añadir a `pruebas/disparadores.json`. **Sin material del curso:** cambia el concepto
   por uno genérico ("tengo una duda de X", no "tengo una duda del interés compuesto"). Cómo se abre:
   `.kit/guias/feedback-al-kit.md`.
5. Al enviarla, pon `enviada <fecha>` en la columna "Qué pasó" de esas filas: así no se vuelven a proponer.

Tienes un límite: no ves las frases con las que debiste usar una skill y no la usaste, salvo que el alumno te corrija.
Por eso la corrección es la señal que más vale.
