# Exámenes de antes de la versión tipo test

> Parte de la skill `/examen` que se lee solo cuando hace falta.

Un examen sin `tipo_examen` en el frontmatter y con huecos `✍️ **Tu respuesta:**` en vez de casillas es del
formato libre de antes: se sigue registrando igual que siempre, con tu propio juicio pregunta a pregunta. Escribe
la corrección en `correccion-examen.json`, **en la raíz del curso** (nunca en `/tmp` ni fuera del curso: se
deniega), y regístrala; `examen.js` la borra al terminar:

    node .kit/herramientas/examen.js --registrar <examen.md> --correccion correccion-examen.json

(`nota`, `veredicto` y `preguntas` con `resultado` empezando por `✅ Correcta` · `⚠️ Le falta: <qué>` ·
`❌ Incorrecta`, como antes). No lo migres a tipo test tú mismo: si el alumno quiere repetirlo, ofrécele
mejor un examen nuevo, de test, sobre el mismo alcance.

Después, igual que en el apartado 5 de `/examen`: da el veredicto en el chat y **guarda**:

    node .kit/herramientas/guardar.js "examen: <alcance>"
