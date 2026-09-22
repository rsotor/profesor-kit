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

## 3. Contar el resultado

- **"Actualizado de X a Y"** → díselo en una frase. Si migró datos, añade: "he adaptado tus notas
  al formato nuevo; no se ha perdido nada".
- **"No se ha actualizado: todo sigue como estaba"** → tranquilízale primero: **no ha perdido nada
  y puede seguir estudiando igual.** Después propón abrir una issue con el motivo que ha dado la
  herramienta (sección "Feedback al kit" de `AGENTS.md`). No reintentes en bucle ni arregles el
  motor a mano.
- **No se pudo descargar** → casi siempre es la sesión de GitHub: `gh auth status`, y si hace
  falta, `gh auth login` por navegador. Nunca pidas un token.

Si tras actualizar el curso ya tiene sesiones pero no `config/estructura.json`, propón al alumno la estructura
(ver `AGENTS.md`, "El material se organiza como el curso") antes de la siguiente clase.

Si no eres Claude Code, después de actualizar vuelve a ejecutar `instalar-skills.js` con tu
`--destino` (ver `.kit/ESTANDARES.md`).
