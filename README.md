# profesor-kit

Un kit que convierte un LLM de terminal en tu **profesor personal para un curso concreto**: procesa
el material de clase, genera notas de estudio, ejercicios y exámenes, y se adapta a ti según
aprende de cómo estudias. Sirve para cualquier curso: todo lo específico sale de la sesión de
configuración.

- **¿Vas a usarlo?** Empieza por [`INSTALACION.md`](INSTALACION.md). No hace falta perfil técnico.
- **Probado** en Claude Code y en Mac. Con otros LLMs de terminal y en Windows es compatible pero
  está sin probar: si algo falla, tu profesor te ayudará a contarlo con una issue en este repo.
- **¿Vas a desarrollarlo?** El diseño y el plan están en `docs/superpowers/`. Tests:
  `node --test ".kit/herramientas/tests/*.test.js"`.

Este fichero, `docs/` y `.github/` son del repo del kit: desaparecen al crear un curso.
