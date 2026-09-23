# Qué necesita el kit de un LLM

El kit está probado en **Claude Code**. Con cualquier otro LLM de terminal es compatible, pero no hay
todavía un adaptador hecho para él: este fichero te dice qué necesita el kit para que construyas el
tuyo, en dos pasos, y cómo devolverlo para que el siguiente alumno con tu mismo LLM no tenga que
repetirlo.

## El adaptador: un JSON, cinco campos

Toda herramienta que necesita saber algo de ti (dónde buscas las skills, qué comando te abre, cómo se
te da un permiso) lo lee de un fichero con esta forma:

| Campo | Qué es | `null` cuando… | Ejemplo (Claude Code) |
|---|---|---|---|
| `comando` | Lo que escribe el atajo para abrirte en la carpeta del curso | nunca | `"claude"` |
| `skills` | Carpeta donde buscas tus skills, relativa a la raíz del curso | nunca | `".claude/skills"` |
| `puente` | Fichero que lees por defecto si no lees `AGENTS.md` directamente | lees `AGENTS.md` nativo | `"CLAUDE.md"` |
| `permisos` | `{ "fichero": …, "formato": … }`: dónde y cómo se expresa "puede ejecutar `node .kit/herramientas/*` sin preguntar" | no tienes lista de permisos | `{ "fichero": ".claude/settings.json", "formato": "…" }` |
| `probado` | En qué sistema y cuándo lo comprobaste de verdad (no basta con leer tu documentación) | nunca | `"macOS · Claude Code CLI · 2026-09-23"` |
| `modelo_recomendado` | `{ modelo, por_que, comprobado }`: el modelo con el que el kit hace bien el trabajo sin gastar cuota de más, por qué, y cuándo se comprobó. Va también como fila en `.kit/adaptadores/LEEME.md` (un test exige que coincidan) | si aún no lo sabes: lo dices en la issue | `{ "modelo": "Sonnet", … }` |

**Campo opcional, solo si tu asistente puede trabajar sin conversación** (lo usa `preparar.js` para
preparar una clase en segundo plano, ver `AGENTS.md`, "Si trabajas en segundo plano"): `segundo_plano`,
una lista de argumentos (sin `comando`, que ya lo pone delante) con los huecos `{prompt}` y `{modelo}`,
por ejemplo `["-p", "{prompt}", "--model", "{modelo}", "--permission-mode", "acceptEdits",
"--permission-prompts", "none"]`. Compruébalo de verdad antes de escribirlo: lánzalo tú a mano una vez y
mira que termina sin preguntar nada. Sin este campo, `preparar.js --lanzar` se niega y el kit se queda
en primer plano para todo. Añade también una columna en `.kit/adaptadores/LEEME.md` ("Segundo plano":
sí/no).

Vive en dos sitios posibles, y las herramientas del kit (`instalar-skills.js`, `crear-atajo.js`,
`diagnostico.js`) miran primero el segundo:

- **`.kit/adaptadores/<id>.json`** — lo trae el kit y viaja con `/actualizar` (es motor). `<id>` es el
  valor de `llm` en `config/ajustes.json`; `claude-code` es el único que existe hoy. Solo lo escribimos
  nosotros, tras validar una issue con datos reales.
- **`config/adaptador-llm.json`** — lo escribes **tú**, en este curso, cuando tu LLM no tenga el de
  arriba (o cuando encontraste algo distinto de lo que dice). Vive en `config/`, así que
  `/actualizar` nunca lo toca ni te lo pisa una versión nueva del kit. Si existe, **manda** sobre el de
  `.kit/adaptadores/`: es lo último que se comprobó de verdad en este curso concreto.

No inventes rutas: si tu documentación oficial no aclara dónde buscas skills o cómo se dan permisos,
pregunta al alumno o déjalo anotado como `**TODO:**` pendiente.

## Qué haces tú

1. Averigua en **tu documentación oficial** en qué carpeta buscas skills, cómo se te dan permisos (si
   puedes tenerlos) y qué fichero lees por defecto si no es `AGENTS.md`. Compruébalo de verdad, no te
   fíes solo de la documentación: ejecuta algo y mira si funciona.
2. Escribe `config/adaptador-llm.json` con los cinco campos de arriba. Añade tu carpeta de skills a
   `.gitignore` si no está ya (`.claude/skills/`, `.agents/skills/`, `.codex/skills/` ya lo están: si la
   tuya es distinta, añade su línea).
3. `node .kit/herramientas/instalar-skills.js` (toma el destino de tu adaptador sin que se lo digas). Si
   no lees `AGENTS.md` por defecto, crea tu fichero puente: una línea que remita a él (`CLAUDE.md` es el
   ejemplo). Si tienes lista de comandos permitidos, añade ahí `node .kit/herramientas/*`.
4. `node .kit/herramientas/crear-atajo.js --nombre <palabra>` (toma el comando de tu adaptador) y
   `node .kit/herramientas/diagnostico.js` hasta que la línea de skills salga en verde y el resto
   también.
5. **Propón al alumno devolver el adaptador al kit**, con su sí (sección "Feedback al kit" de
   `AGENTS.md`):

       node .kit/herramientas/issue.js --titulo "[adaptador] <id>" --cuerpo <fichero>

   El cuerpo lleva: el JSON completo de tu `config/adaptador-llm.json`, tu versión exacta y el sistema
   operativo, qué tuviste que hacer a mano y qué te confundió de esta guía. Si ya existía un adaptador
   para tu LLM y encontraste una mejora o un cambio (tu LLM movió su carpeta de skills, por ejemplo), la
   misma issue, con el JSON nuevo y qué cambió. La vía por defecto es la issue: el alumno no tiene
   permisos de escritura en el repo del kit y normalmente no es técnico. Si sabe de pull requests y
   prefiere abrir uno él mismo, también vale, pero no se lo propongas tú de entrada.

Mientras no tengas adaptador (ni el del kit ni el tuyo propio), `diagnostico.js` marca las skills como
"no se puede verificar": es un aviso, no un bloqueo, y dice exactamente esto mismo.
