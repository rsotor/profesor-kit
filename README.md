# profesor-kit

Un kit que convierte un LLM de terminal en tu **profesor personal para un curso concreto**: procesa
el material de clase, genera notas de estudio, ejercicios y exámenes, y se adapta a ti según
aprende de cómo estudias. Sirve para cualquier curso: todo lo específico sale de la sesión de
configuración.

- **¿Vas a usarlo?** Empieza por [`INSTALACION.md`](.kit/guias/INSTALACION.md). No hace falta perfil técnico.
- **¿Ya lo tienes y hay versión nueva?** Dile a tu profesor "actualiza el kit". Él lo hace todo; tú no tocas nada.
- **Probado** en Mac (con Claude Code) y en Windows (con Codex). Con otros LLMs de terminal es compatible
  pero está sin probar. **Linux no está soportado**: las herramientas funcionan (el CI corre ahí), pero no hay
  guía de instalación; si alguien lo necesita, se hace entonces. Si algo falla, tu profesor te ayudará a
  contarlo con una issue en este repo.
- **¿Vas a desarrollarlo?** Lee [`CONTRIBUTING.md`](CONTRIBUTING.md). Tests: `npm test`. `main` solo recibe
  cambios por PR, y el CI exige todos los tests en verde en Linux y Windows y una **cobertura mínima del
  80 %** de las herramientas (check obligatorio: `tests-ok`). Cada merge que sube `.kit/VERSION` publica su
  release, que es lo que los cursos descargan al actualizar. La última auditoría completa está en `docs/auditoria/`.
- **Versiones:** todo cambio que note el alumno lleva su línea en `.kit/CHANGELOG.md`. El kit está
  en `0.x` hasta que sustituya al curso con el que nació; entonces, `1.0.0`.

Este fichero, `docs/`, `.github/`, `.githooks/`, `CONTRIBUTING.md` y `package.json` son del repo del kit: desaparecen al crear un curso.
