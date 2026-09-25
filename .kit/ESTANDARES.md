# Qué necesita el kit de un LLM

El kit está probado en **Claude Code** y en **Codex CLI**. Con cualquier otro LLM de terminal es
compatible, pero no hay todavía un adaptador hecho para él: este fichero te dice qué necesita el kit
para que construyas el tuyo, en dos pasos, y cómo devolverlo para que el siguiente alumno con tu mismo
LLM no tenga que repetirlo.

## El adaptador: un JSON, cinco campos obligatorios y hasta dos opcionales

Toda herramienta que necesita saber algo de ti (dónde buscas las skills, qué comando te abre, cómo se
te da un permiso) lo lee de un fichero con esta forma. Los cinco primeros siempre van; los dos últimos
solo cuando aplican — no los inventes si no los tienes comprobados.

| Campo | Obligatorio | Qué es | `null` cuando… | Ejemplo (Claude Code) |
|---|---|---|---|---|
| `schema_version` | sí | Versión del formato de este fichero. Hoy, `1` | nunca | `1` |
| `id` | sí | El asistente al que pertenece: el mismo `llm` de `config/ajustes.json`. Un `config/adaptador-llm.json` **solo se usa si su `id` es el `llm` del curso**: si el alumno cambia de asistente, el del anterior deja de aplicarse | nunca | `"claude-code"` |
| `comando` | sí | Lo que escribe el atajo para abrirte en la carpeta del curso | nunca | `"claude"` |
| `skills` | sí | Carpeta donde buscas tus skills, relativa a la raíz del curso | nunca | `".claude/skills"` |
| `puente` | sí | Fichero que lees por defecto si no lees `AGENTS.md` directamente | lees `AGENTS.md` nativo | `"CLAUDE.md"` |
| `permisos` | sí | `{ "fichero": …, "formato": … }`: dónde y cómo se expresa "puede ejecutar `node .kit/herramientas/*` sin preguntar" | no tienes lista de permisos | `{ "fichero": ".claude/settings.json", "formato": "…" }` |
| `aceptar_una_vez` | no | Cómo deja `permisos.js` que el alumno acepte una vez (editar dentro del curso y las herramientas del kit, sin preguntar a cada paso): `{ "tipo": … }` con un tipo que `permisos.js` sabe escribir (hoy, `claude-code`), o `{ "pendiente": "<issue>" }` si aún no se sabe. Qué se permite lo decide el kit; aquí solo va dónde y cómo. Compruébalo de verdad, desde la terminal y desde Obsidian | se omite: `permisos.js` dice que no sabe hacerlo y no toca nada | `{ "tipo": "claude-code" }` |
| `soporte` | sí | Qué hay probado de verdad, por sistema: `[{ "sistema", "estado", "evidencia" }]`, con estado `probado` (una prueba real completa en ese sistema, con fecha), `con-limitaciones` (dice qué falta), `experimental` (nadie lo ha probado ahí) o `no-disponible`. Va también en la matriz de `.kit/adaptadores/LEEME.md` (un test exige que coincidan). Linux solo corre el CI: no es un sistema soportado | nunca: si no lo has probado, `experimental` | `[{ "sistema": "macOS", "estado": "probado", "evidencia": "prueba real 12/12 · 2026-09-24" }]` |
| `probado` | sí | En qué sistema y cuándo lo comprobaste de verdad (no basta con leer tu documentación) | nunca | `"macOS · Claude Code CLI · 2026-09-23"` |
| `modelo_recomendado` | no | `{ modelo, id, por_que, comprobado }` (`modelo`, el nombre que lee el alumno; `id`, el que entiende tu asistente, tal cual, que es el que va en `{modelo}` de `segundo_plano`; sin él, `segundo_plano` se lanza sin `--model {modelo}` y usas tu modelo por defecto): el modelo con el que el kit hace bien el trabajo sin gastar cuota de más, por qué, y cuándo se comprobó. Va también como fila en `.kit/adaptadores/LEEME.md` (un test exige que coincidan). **Si aún no has comparado modelos con este asistente, no pongas este campo**: `.kit/adaptadores/LEEME.md` lleva "— (sin comparar)" en su lugar, y el adaptador se propone igual — comparar modelos no es requisito para tener un adaptador | se omite el campo entero | `{ "modelo": "Sonnet", … }` |
| `segundo_plano` | no | Solo si tu asistente puede trabajar sin conversación (lo usa `preparar.js` para preparar una clase en segundo plano, ver `.kit/guias/segundo-plano.md`): una lista de argumentos (sin `comando`, que ya lo pone delante) con el hueco `{modelo}`. **El prompt va por la entrada estándar**: añade `"prompt_por_stdin": true` y no pongas `{prompt}` en la lista (así el prompt, que lleva nombres de ficheros del alumno, nunca pasa por una shell; en Windows, un comando `.cmd` solo se puede lanzar así). Si tu asistente no lee el prompt de la entrada estándar, usa el hueco `{prompt}` sin `prompt_por_stdin`: funciona en Mac y con un `.exe` en Windows, pero no con un `.cmd`. Compruébalo de verdad antes de escribirlo: lánzalo tú a mano una vez y mira que termina sin preguntar nada. Sin este campo, `preparar.js --lanzar` se niega y el kit se queda en primer plano para todo. Añade también una columna en `.kit/adaptadores/LEEME.md` ("Segundo plano": sí/no) | se omite el campo entero | `["-p", "--model", "{modelo}", "--permission-mode", "acceptEdits", "--permission-prompts", "none"]` con `"prompt_por_stdin": true` |

### `permisos`: no todos los asistentes tienen comodín

Claude Code acepta un patrón con comodín (`Bash(node .kit/herramientas/<nombre>.js *)`) en un único
fichero de proyecto. **No des por hecho que tu asistente hace lo mismo.** Codex CLI, por ejemplo:

- Lee las reglas del fichero **de usuario** (`~/.codex/rules/default.rules`) y, si la carpeta del curso es de
  confianza, también las del proyecto, en `.codex/rules/` (comprobado con Codex CLI 0.156.1, issue #42). Así las
  escribe `permisos.js --aplicar`, dentro del curso.
- No entiende un comodín para "todo lo que empiece por `node .kit/herramientas/`": cada herramienta
  necesita su propia línea, con el patrón exacto:

      prefix_rule(pattern=["node", ".kit/herramientas/comprobar.js"], decision="allow")
      prefix_rule(pattern=["node", ".kit/herramientas/guardar.js"], decision="allow")
      prefix_rule(pattern=["node", ".kit/herramientas/instalar-skills.js"], decision="allow")
      …

  Repite por cada `.js` de `.kit/herramientas/` (sin `lib/` ni `tests/`), como hace `permisos.js`. Compruébalo de verdad: una
  regla que no está ahí pide confirmación en cada llamada.
- **Aun con las reglas puestas, el entorno del asistente puede seguir pidiendo aprobaciones.** Un
  entorno restringido (sandbox) puede negarse a ejecutar o a escribir fuera de lo explícitamente
  autorizado, aunque el alumno ya haya dicho que confía en la carpeta del curso: eso no es un fallo del
  kit ni de tu adaptador — es una capa aparte, y quien esté delante tiene que autorizar la ejecución
  fuera de ese entorno restringido cuando lo pida (`lib/arranque.js` y las herramientas que lanzan `git`
  o `gh` ya distinguen este caso de un fallo real: no dicen "abre una issue").
- **Tu entorno puede no traer `gh` (issue #50).** Un asistente en la nube (por ejemplo, Claude Code en
  claude.ai/code) llega con git y con red, pero sin la CLI `gh`, y no es cosa tuya ni del alumno instalarla
  ahí. No es un fallo del kit ni de tu adaptador: `actualizar.js` y `guardar.js` ya caen solos a git y a la
  API pública de GitHub sin credenciales cuando `gh` falta o falla, y `diagnostico.js` lo trata como un
  aviso, no como algo que bloquee la instalación. Lo único que se pierde sin `gh` es enviar feedback al kit
  con `issue.js` (`prepararIssue`/`enviarIssue` ya lo dicen y dejan el texto listo para pegarlo a mano).
  **Por verificar en la nube de verdad:** Claude Code en claude.ai/code no habla con GitHub directo, sino con
  un proxy local del propio contenedor (`origin` con pinta de `http://usuario@127.0.0.1:<puerto>/git/<owner>/
  <repo>`), que solo deja subir a la rama de esa sesión. `lib/git.js` reconoce ese formato para la comprobación
  de privacidad (la API pública se consulta igual, con el `owner/repo` de la ruta) y `lib/red.js` pasa
  `NODE_USE_ENV_PROXY` al proceso que hace la petición HTTP, para que respete el proxy si el entorno lo exige.
  Lo que no se ha probado de verdad ahí (nadie lo ha corrido en ese entorno todavía): que un `push`/`--traer`
  reales pasen por ese proxy sin más ajuste, y qué pasa si el curso se trabaja en una rama `claude/…` en vez de
  en `main`. Compruébalo antes de darlo por bueno, y dilo en la issue del adaptador si algo no encaja.

Vive en dos sitios posibles, y las herramientas del kit (`instalar-skills.js`, `crear-atajo.js`,
`diagnostico.js`) miran primero el segundo:

- **`.kit/adaptadores/<id>.json`** — lo trae el kit y viaja con `/actualizar` (es motor). `<id>` es el
  valor de `llm` en `config/ajustes.json`; hoy existen `claude-code` y `codex` (el ejecutable de Codex
  CLI se anuncia como `codex-cli`, pero el adaptador vive como `codex`: `codex-cli` sigue funcionando
  como alias, para los cursos que ya tenían ese `llm`). Solo los escribimos nosotros, tras validar una
  issue con datos reales.
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
2. Escribe `config/adaptador-llm.json` con los cinco campos obligatorios de arriba (y los opcionales que
   te apliquen). Añade tu carpeta de skills a
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
