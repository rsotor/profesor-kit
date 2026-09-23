# Asistentes probados y modelo recomendado

Qué asistentes de terminal tienen su configuración hecha en el kit, dónde se han probado y **qué modelo
conviene usar**. Si tu asistente deja elegir modelo, usa el recomendado: es el que se ha comprobado que hace
bien el trabajo sin gastar la cuota de más. Un asistente puede tener adaptador sin tener aún un modelo
recomendado (nadie ha comparado modelos todavía): esa fila lleva **"— (sin comparar)"**, no se inventa uno.

| Asistente (`llm`) | Probado en | Modelo recomendado | Por qué | Comprobado | Segundo plano |
|---|---|---|---|---|---|
| `claude-code` | macOS · Claude Code CLI · 2026-09-23 | Sonnet | Probado con todas las skills en un curso completo (configurar, sesión, dudas, examen y ejercicio). Opus es opcional para una clase muy densa si sobra cuota: gasta mucha más. | 2026-09-21 | sí |
| `codex` | Windows 11 · Codex CLI 0.155.1 · 2026-09-23 | — (sin comparar) | — | — | no |

**Segundo plano** dice si el asistente puede preparar una clase sin conversación (`preparar.js`, ver
`AGENTS.md`, "Si trabajas en segundo plano"): "sí" si su JSON trae `segundo_plano`, "no" si no. Sin él, el
caso 2 de `AGENTS.md` se queda en primer plano.

**Tu asistente no está, o su recomendación ha cambiado:** tu profesor sigue `.kit/ESTANDARES.md`, lo monta y,
con tu sí, lo propone al kit con una issue `[adaptador] <llm>`, que incluye su fila de esta tabla. Si aún no
has comparado modelos con ese asistente, no hace falta que lo hagas para proponer el adaptador: deja "— (sin
comparar)" y ábrelo igual.

Esta tabla y los ficheros `<llm>.json` de esta carpeta dicen lo mismo: un test del kit falla si no coinciden.
