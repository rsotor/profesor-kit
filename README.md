# profesor-kit

Un kit que convierte un LLM de terminal en tu **profesor personal para un curso concreto**: procesa
el material de clase, genera notas de estudio, ejercicios y exámenes, y se adapta a ti según
aprende de cómo estudias. Sirve para cualquier curso: todo lo específico sale de la sesión de
configuración.

- **¿Vas a usarlo?** Empieza por [`INSTALACION.md`](.kit/guias/INSTALACION.md). No hace falta perfil técnico.
- **¿Ya lo tienes y hay versión nueva?** Dile a tu profesor "actualiza el kit". Él lo hace todo; tú no tocas nada.
- **Probado** en Claude Code y en Mac. Con otros LLMs de terminal y en Windows es compatible pero
  está sin probar: si algo falla, tu profesor te ayudará a contarlo con una issue en este repo.
- **¿Vas a desarrollarlo?** El diseño y el plan están en `docs/superpowers/`. Tests:
  `node --test ".kit/herramientas/tests/*.test.js"`. `main` solo recibe cambios por PR, y el CI
  exige todos los tests en verde en Mac, Windows y Linux y una **cobertura mínima del 80 %** de
  las herramientas (check obligatorio: `tests-ok`).
- **Versiones:** todo cambio que note el alumno lleva su línea en `.kit/CHANGELOG.md`. El kit está
  en `0.x` hasta que sustituya al curso con el que nació; entonces, `1.0.0`.

Este fichero, `docs/` y `.github/` son del repo del kit: desaparecen al crear un curso.
