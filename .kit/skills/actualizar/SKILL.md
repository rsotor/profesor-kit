---
name: actualizar
description: Use when the student wants the latest version of the kit or asks whether there are improvements. Triggers on "/actualizar", "actualiza el kit", "¿hay versión nueva?", "quiero las mejoras".
---

# Actualizar el kit

El kit se actualiza **sin tocar nada del alumno**. Si algo sale mal, la herramienta lo deja todo
exactamente como estaba. Tu trabajo es contarlo en lenguaje llano.

## 1. Ver qué hay

    node .kit/herramientas/actualizar.js --ver

- "Ya tienes la última versión" → díselo y termina.
- Hay versión nueva → resume las novedades en **2-4 frases, desde lo que él va a notar**. No le
  leas el CHANGELOG ni le hables de ficheros.

## 2. Aplicar

No hace falta pedir permiso por cada cosa: la herramienta guarda antes lo que hubiera sin guardar (un commit),
y si algo falla vuelve exactamente a ese punto.

    node .kit/herramientas/actualizar.js --aplicar

Si su curso va varias versiones atrás, la herramienta pasa por todas en orden, una a una, y dice cada paso. Si
una falla, para ahí: su curso se queda sano en la última que funcionó. Díselo así, sin más detalle.

## 3. Complementos de Obsidian

Ejecuta `node .kit/herramientas/obsidian.js` (descarga los complementos que falten; los ajustes ya los añadió la
migración). Si el alumno tenía Obsidian abierto durante la actualización, que lo cierre y lo abra.

## 4. Tras migrar (solo si `--aplicar` migró datos)

Una migración de datos deja tareas que ella no puede hacer sola porque necesitan al alumno delante.
Hazlas ahora, con él, antes de seguir con lo que estuvierais haciendo:

1. **Completa `config/estructura.json`** con **todas** las unidades del temario de `config/curso.md`
   (tengan material o no) y su `titulo` (con tildes) — como hace `/configurar`.
2. **Pon `orden:`** en las sesiones que `node .kit/herramientas/comprobar.js` señale con `orden-ambiguo`.
3. **Adapta los exámenes antiguos** al formato nuevo: `unidad:` (el prefijo de la unidad), `nota:` como
   número sobre 10 (nunca `2/10`), `fecha:`, `intentos:`, y un `✍️ **Tu respuesta:**` vacío bajo cada
   pregunta (ver `.kit/skills/examen/SKILL.md`, sección Formato).
4. **Reescribe `estudio/como-usar-tu-profesor.md`** desde `.kit/plantillas/guia-de-uso.md`, con los
   mismos huecos que usó `/configurar` (nombre del curso, atajo, marcador de dudas…).
5. Dile al alumno, en una frase: "abre **inicio** en Obsidian y fija su pestaña".

Termina con `node .kit/herramientas/comprobar.js` y guarda con
`node .kit/herramientas/guardar.js "config: índice del curso"`.

## 5. Contar el resultado

- **"Actualizado de X a Y"** → díselo en una frase. Si migró datos, añade: "he adaptado tus notas
  al formato nuevo; no se ha perdido nada".
- **"No se ha actualizado: todo sigue como estaba"** → tranquilízale primero: **no ha perdido nada
  y puede seguir estudiando igual.** Después propón abrir una issue con el motivo que ha dado la
  herramienta (sección "Feedback al kit" de `AGENTS.md`). No reintentes en bucle ni arregles el
  motor a mano.
- **Motivo: un posible secreto** → no es un fallo del kit, no abras issue. Enséñale el fichero que dice la
  herramienta (nunca el secreto) y ayúdale a quitarlo como dice la regla 5 de `AGENTS.md`; después, repite.
- **No se pudo descargar** → casi siempre es la sesión de GitHub: `gh auth status`, y si hace
  falta, `gh auth login` por navegador. Nunca pidas un token.

## 6. Ponerle al día con lo que su curso no recibe solo

Hay mejoras que viven donde un curso ya configurado no vuelve a pasar (la sesión 0, una plantilla que solo se
copia al configurar). Esas llegan como ofertas: en las novedades que leíste en el paso 1, busca las líneas
`**Si ya tenías tu curso:**`. Por cada una, **de una en una**:

1. Ofrécesela en una frase, desde lo que gana: "hay tres preguntas nuevas sobre ti que me ayudan a
   ponerte ejemplos de tu mundo; ¿te las hago ahora?". Puede decir que no, o que otro día.
2. Si dice que sí, hazlo tal como lo hace la skill o la plantilla de donde sale (por ejemplo, las preguntas de
   `/configurar` o la hoja desde `.kit/plantillas/guia-de-uso.md`, con los mismos huecos que usó `/configurar`).
   Mira antes qué tiene ya: no repitas lo que su curso ya tiene hecho. Lo que apuntes en `config/` cita
   **de dónde sale de verdad**: "al actualizar a la <versión>, respuesta del alumno", no "sesión 0".
3. Si dice que no, dile en una frase cómo pedirlo más tarde.

Guarda al terminar con `node .kit/herramientas/guardar.js "config: al día con la <versión>"`.

Si tras actualizar el curso ya tiene sesiones pero no `config/estructura.json`, propón al alumno la estructura
(ver `AGENTS.md`, "El material se organiza como el curso") antes de la siguiente clase.

Al terminar, cierra con una línea `Del kit: nada` o `Del kit: <qué>` (si algo de la actualización no fue como
dice esta skill; si no es "nada", sigue "Feedback al kit" de `AGENTS.md`). Las skills no hace falta reinstalarlas:
`actualizar.js` ya lo hace con el destino de tu adaptador.
