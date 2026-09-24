# Si el alumno cambia de asistente, o si no eres Claude Code

> Parte de `AGENTS.md` que se lee solo cuando hace falta.

## Si el alumno cambia de asistente

El curso no está atado a un LLM: el atajo abre el que diga `config/ajustes.json` (`"llm"`), y las
herramientas (`instalar-skills.js`, `crear-atajo.js`, `diagnostico.js`) leen su **adaptador**:
`.kit/adaptadores/<llm>.json` si el kit ya lo trae (mira su matriz de soporte en `.kit/adaptadores/LEEME.md`), o
`config/adaptador-llm.json` si lo escribiste tú para este curso, que manda sobre el del kit **solo si su `id` es ese
`llm`**. Para
cambiar (por ejemplo de Claude Code a Codex):

1. Que instale el asistente nuevo con su guía oficial e inicie sesión en él.
2. `config/ajustes.json` → `"llm": "<id>"`.
3. Si no existe `.kit/adaptadores/<id>.json`, sigue `.kit/ESTANDARES.md`: escribe
   `config/adaptador-llm.json` con la forma que pide (`schema_version`, `id`, comando, skills, puente, permisos, soporte, probado).
4. `node .kit/herramientas/instalar-skills.js` (toma el destino del adaptador) y el resto de
   `.kit/ESTANDARES.md` (fichero puente, permisos).
5. `node .kit/herramientas/crear-atajo.js --nombre <su palabra>`: vuelve a escribir el atajo con el
   comando nuevo. Nada más cambia: su material, su configuración y su historial son los mismos.
6. `node .kit/herramientas/diagnostico.js` hasta "Todo listo".
7. Propón devolver el adaptador al kit (abajo, "Si no eres Claude Code"): así el siguiente alumno con este
   mismo LLM no tiene que montarlo de cero.

## Si no eres Claude Code

Lee `.kit/ESTANDARES.md`: dice qué necesita el kit de ti, cómo escribir tu adaptador
(`config/adaptador-llm.json`, en este curso) y cómo proponerlo al kit para el siguiente alumno con tu
mismo LLM — una issue `[adaptador] <id>`, con el sí del alumno delante, como en "Feedback al kit".
