# Feedback al kit: cómo se abre una issue

> Parte de `AGENTS.md` ("Feedback al kit") que se lee solo cuando hay algo que escalar.

La issue la abre `kit-issue.js`, de base-kit, **sin pedirle el sí al alumno**: la nota no lleva nada suyo, y la
herramienta sustituye lo que se le escape (una clave → `<clave>`, una ruta con su usuario → `<ruta>`, un correo →
`<correo>`). Lo que viaja es el kit y su versión (`**Kit:** profesor-kit X.Y.Z`), el sistema y el asistente: nunca
el nombre del curso ni el del alumno.

1. Escribe la nota en **`.git/base-kit/feedback-note.md`** (fuera del curso: `guardar.js` no la sube), en llano:
   **Esperado** · **Qué pasó** · **Propuesta** · **Arreglo aplicado** (si lo hubo). Sin material del curso, sin
   `config/alumno.md`, sin nombres.
2. `node .base-kit/hooks/kit-issue.js --title "[skill o herramienta] qué pasa" --body-file .git/base-kit/feedback-note.md`.
   Si ya hay una issue abierta con el mismo título, se suma a ella (un comentario al día como mucho) en vez de abrir
   otra; `--list` enseña las abiertas, y `--issue N` apunta a una concreta. Si no tienes nada nuevo que contar y la
   issue ya existe, `--me-too` en vez de `--body-file`.
3. Lee lo que responde y ponlo en la línea `Del kit:` del cierre. Si responde **not sent** (sin `gh`, sin sesión o
   sin red), la nota se queda en local (`.git/base-kit/feedback-pending.md` apunta el título y el motivo; el texto
   sigue en `feedback-note.md`): díselo al alumno en una frase, para que lo pase él a quien le dio el kit.

Lo que **no** es del kit no se escala: errores del material, del temario o del centro, y lo que es de este alumno.
