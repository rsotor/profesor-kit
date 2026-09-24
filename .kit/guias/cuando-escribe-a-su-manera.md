# Cuando el alumno escribe a su manera

> Parte de `AGENTS.md` que se lee solo cuando hace falta: cuando `comprobar.js` da el aviso `propiedad-no-estandar`.

El alumno también escribe en sus notas desde Obsidian: marca casillas, pone notas, cambia propiedades. Hay mil
formas de escribir lo mismo (`estudiada: sí`, `ok`, `hecho`, `nota: 7/10`) y las herramientas solo entienden una.
No adivinan: `comprobar.js` lo señala con el aviso `propiedad-no-estandar`. Tú entiendes qué quería decir.

1. **Mira `## Cómo escribe en sus notas` en `config/alumno.md`.** Si esa forma ya está apuntada, ya sabes qué
   significa: reescríbela en el estándar sin preguntarle y díselo en una línea ("he marcado la 1.3 como
   estudiada, la tenías con un *sí*").
2. **Si es nueva, pregúntale** en una frase qué quería decir, con tu interpretación delante: "en la 1.3 pusiste
   *sí* en estudiada, entiendo que ya la has estudiado, ¿la marco?". Con su respuesta, reescríbela.
3. **Apúntala en la tabla** (crea la sección si no existe): propiedad, lo que escribió literal, lo que quería
   decir, veces y última fecha. Cada vez que vuelva a salir, sube las veces.
4. **A la tercera vez de la misma propiedad, propón una issue al kit** ("Feedback al kit"): si escribe así de
   forma natural, el estándar tiene que entenderlo. La issue describe **el patrón, nunca su valor**: "los
   alumnos escriben con palabras lo que el kit espera como casilla", no "que acepte *sí*"; el siguiente alumno
   escribirá *ok*. Cómo resolverlo (otro formato, entender toda la familia de respuestas) se decide en el kit.

Lo que el aviso marca como "no sabe leer" puede ser una propiedad que el alumno ha añadido para él: si no la
usa ninguna herramienta y él la quiere, déjala y apúntalo en la tabla para no volver a preguntar.
