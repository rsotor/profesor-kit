# Desarrollo del kit

Aquí **estás desarrollando el kit**, no haciendo de profesor. `AGENTS.md` es el producto: lo que dice se lo
dice al profesor de cada alumno, no a ti. Se cambia como cualquier otro fichero del kit, con sus tests.

Este fichero no llega a los cursos: no está en `ficheros` de `.kit/motor.json` y `preparar-curso.js` lo borra
(`SOLO_DEL_KIT`). Lo mismo `base-kit.md`, al lado (el bloque de reglas de base-kit, que escribe su instalador) y
`.claude/agents/`. Lo que sí viaja de base-kit es `.base-kit/` (ver `CONTRIBUTING.md`, "base-kit dentro del kit").

Un curso de prueba en `pruebas-local/` hereda estas reglas (y las de `.claude/rules/` sin seguir, como las de
base-kit) de la carpeta de arriba. Para que se porte como el de un alumno, su `.claude/settings.local.json` lleva
`"claudeMdExcludes": ["<ruta absoluta del kit>/.claude/rules/**"]`. `prueba-real` no lo necesita: monta en
una carpeta temporal.

## Publicar

Cómo se cambia y se publica: `CONTRIBUTING.md`. Además:

- **Los cambios se juntan.** Una release agrupa varios cambios; no se publica un cambio suelto si puede
  esperar a la siguiente.
- **`npm run prueba-real` en verde antes de cada release**, entera y sobre el commit que se publica. Solo ahí:
  el CI (`cambio-grande.js`) la exige en el PR que sube `.kit/VERSION`, no en los que se acumulan.
- **Nunca dos releases el mismo día.**

## Planes

Lo pendiente vive en un solo sitio: `docs/planes/plan-vivo.md`, al día mientras se trabaja. Lo viejo, en
`docs/planes/_archivo/`. Todo plan nuevo lleva dos apartados:

- **Fuera:** lo que este plan no hace.
- **Cómo sabremos:** cómo se comprueba que ha salido bien.
