# Feedback al kit: cómo se abre una issue

> Parte de `AGENTS.md` ("Feedback al kit") que se lee solo cuando hay algo que escalar.

1. Escribe el cuerpo en un fichero temporal, en llano: **Esperado** · **Qué pasó** · **Propuesta** · **Arreglo
   aplicado** (si lo hubo). Sin material del curso, sin `config/alumno.md`, sin rutas con su usuario.
2. `node .kit/herramientas/issue.js --titulo "[skill o herramienta] qué pasa" --cuerpo <fichero>` → añade el
   entorno solo, busca issues parecidas y **se niega si detecta datos personales**. Te enseña la vista previa.
3. **Enséñasela al alumno y espera su sí.** Si hay una parecida, comenta ahí (`gh issue comment`) en vez de abrir otra.
4. Repite con `--enviar`. Si no hay sesión de `gh`, el texto va a `config/feedback-pendiente.md` y el alumno se
   lo pasa a quien le dio el kit.
