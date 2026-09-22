# Qué necesita el kit de un LLM

El kit está probado en **Claude Code**. Con cualquier otro LLM de terminal es compatible pero está
sin probar: este fichero te dice qué necesita el kit para que generes tus equivalentes.

| Necesidad | Estándar del kit | Ya resuelto para Claude Code |
|---|---|---|
| Reglas del profesor | `AGENTS.md` en la raíz. Si tú lees otro nombre, crea un fichero puente de una línea que remita a él | `CLAUDE.md` |
| Skills | Formato `SKILL.md` (frontmatter `name` + `description`) en `.kit/skills/<nombre>/`. Se copian a la carpeta donde tú las buscas | `node .kit/herramientas/instalar-skills.js` → `.claude/skills/` |
| Invocación | Por nombre o en lenguaje natural ("procesa la sesión"). La sintaxis corta es la tuya | `/sesion` |
| Permisos | Poder ejecutar sin preguntar `node .kit/herramientas/*` (y leer issues con `gh issue list/view`) | `.claude/settings.json` |
| Atajo | El lanzador lo crea `crear-atajo.js` con el comando que diga `config/ajustes.json` → `llm` | `claude` |
| Verificación | `diagnostico.js` acepta otro LLM si existe `config/adaptacion-llm.md` | — |

## Qué haces tú

1. Averigua en **tu documentación oficial** en qué carpeta buscas skills y ejecuta
   `node .kit/herramientas/instalar-skills.js --destino <esa carpeta, relativa a la raíz>`.
   Añade esa carpeta a `.gitignore` si no está.
2. Si no lees `AGENTS.md` por defecto, crea tu fichero puente.
3. Si tienes lista de comandos permitidos, añade `node .kit/herramientas/*`.
4. Apunta en `config/adaptacion-llm.md`: qué LLM y versión eres, qué ficheros has creado, dónde,
   y cómo se invoca una skill contigo. Díselo al alumno en una frase.
5. Propón al alumno abrir una issue con el contenido de ese fichero (sección "Feedback al kit" de
   `AGENTS.md`): así el siguiente alumno con tu mismo LLM ya lo tiene resuelto.

No inventes rutas: si tu documentación no lo aclara, pregunta al alumno o déjalo anotado como pendiente.
