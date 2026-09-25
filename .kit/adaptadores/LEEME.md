# Asistentes probados y modelo recomendado

Qué asistentes de terminal tienen su configuración hecha en el kit, dónde se han probado y **qué modelo
conviene usar**. Si tu asistente deja elegir modelo, usa el recomendado: es el que se ha comprobado que hace
bien el trabajo sin gastar la cuota de más. Un asistente puede tener adaptador sin tener aún un modelo
recomendado (nadie ha comparado modelos todavía): esa fila lleva **"— (sin comparar)"**, no se inventa uno.

| Asistente (`llm`) | Probado en | Modelo recomendado | Por qué | Comprobado | Segundo plano |
|---|---|---|---|---|---|
| `claude-code` | macOS · Claude Code CLI · 2026-09-23 | Sonnet | Probado con todas las skills en un curso completo (configurar, sesión, dudas, examen y ejercicio). Opus es opcional para una clase muy densa si sobra cuota: gasta mucha más. | 2026-09-21 | sí |
| `codex` | Windows · Codex CLI 0.156.1 · 2026-09-24 | — (sin comparar) | — | — | sí |

**Segundo plano** dice si el asistente puede preparar una clase sin conversación (`preparar.js`, ver
`.kit/guias/segundo-plano.md`): "sí" si su JSON trae `segundo_plano`, "no" si no. Sin él, el
caso 2 de `AGENTS.md` se queda en primer plano.

## Matriz de soporte

Qué hay probado de verdad, por sistema. **probado**: una prueba real completa en ese sistema. **con-limitaciones**:
funciona, pero falta algo (dice qué). **experimental**: hay adaptador, pero nadie lo ha probado en ese sistema.
**no-disponible**: no funciona. Linux solo corre los tests del CI: no es un sistema soportado.

| Asistente | Sistema | Estado | Evidencia |
|---|---|---|---|
| `claude-code` | macOS | probado | prueba real completa 12/12 · corrección 6/6 · 2026-09-24 |
| `claude-code` | Windows | experimental | sin prueba en Windows con Claude Code |
| `codex` | Windows | con-limitaciones | instalación, skills, permisos de una vez y segundo plano (codex exec, sin red) probados · Codex CLI 0.156.1 · 2026-09-24 (issue #42); sin prueba real completa, y la regla que hace preguntar por python sin comprobar con Python instalado |
| `codex` | macOS | experimental | sin prueba en macOS con Codex |

**Tu asistente no está, o su recomendación ha cambiado:** tu profesor sigue `.kit/ESTANDARES.md`, lo monta y,
con tu sí, lo propone al kit con una issue `[adaptador] <llm>`, que incluye su fila de esta tabla. Si aún no
has comparado modelos con ese asistente, no hace falta que lo hagas para proponer el adaptador: deja "— (sin
comparar)" y ábrelo igual.

**Sin `gh`, no es un fallo de tu entorno ni de este adaptador (issue #50).** Un asistente en la nube (Claude
Code en claude.ai/code, por ejemplo) trae git y red, pero no la CLI `gh`: `actualizar.js` y `guardar.js` caen
solos a git y a la API pública de GitHub sin credenciales, así que el kit funciona igual. Solo se pierde el
envío de feedback al kit con `issue.js`.

**Claude Code en la nube, por verificar de verdad:** ese entorno habla con GitHub a través de un proxy local
del propio contenedor (no directo), y solo deja subir a la rama de la sesión. El kit ya reconoce ese proxy
para comprobar la privacidad del repo, pero un `push` y un `--traer` reales ahí, y trabajar en una rama
`claude/…` en vez de en `main`, no se han probado todavía en ese entorno concreto — no lo des por bueno sin
comprobarlo.

Estas tablas y los ficheros `<llm>.json` de esta carpeta dicen lo mismo: un test del kit falla si no coinciden.
