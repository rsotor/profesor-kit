<!-- Título: «X.Y.Z: qué cambia» si sube .kit/VERSION; si no, «tipo: qué cambia» (arreglo, mejora, docs, ci, test, build, chore). Es el commit en main. Ver CONTRIBUTING.md -->

## Qué cambia

## Comprobaciones
- [ ] Tests en local en verde
- [ ] Check `tests-ok` en verde (Mac, Windows y Linux; cobertura ≥ 80 %)
- [ ] Línea en `.kit/CHANGELOG.md` si el alumno lo va a notar, y `.kit/VERSION` subido si se publica
- [ ] Migración si cambia el formato de los datos
- [ ] Nada de ningún curso concreto en el motor
- [ ] Si publica (sube `.kit/VERSION`) y la versión toca `.kit/skills/`, `AGENTS.md` o `.kit/plantillas/`: prueba real hecha (`npm run prueba-real`) y `pruebas/curso-ejemplo/resultado/RESUMEN.md` actualizado
