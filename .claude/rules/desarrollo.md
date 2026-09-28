# Desarrollo del kit

Aquí **estás desarrollando el kit**, no haciendo de profesor. `AGENTS.md` es el producto: lo que dice se lo
dice al profesor de cada alumno, no a ti. Se cambia como cualquier otro fichero del kit, con sus tests.

Este fichero no llega a los cursos: no está en `ficheros` de `.kit/motor.json` y `preparar-curso.js` lo borra
(`SOLO_DEL_KIT`).

## Publicar

Cómo se cambia y se publica: `CONTRIBUTING.md`. Además:

- **Los cambios se juntan.** Una release agrupa varios cambios; no se publica un cambio suelto si puede
  esperar a la siguiente.
- **`npm run prueba-real` en verde antes de cada release**, entera y sobre el commit que se publica.
- **Nunca dos releases el mismo día.**

## Planes

Todo plan en `docs/planes/` lleva dos apartados:

- **Fuera:** lo que este plan no hace.
- **Cómo sabremos:** cómo se comprueba que ha salido bien.
