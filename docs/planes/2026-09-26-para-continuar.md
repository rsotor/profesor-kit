# Para continuar · 2026-09-26

Cierre del 2026-09-25: publicada la **v0.26.0** (#49, #52) y preparada la **0.27.0** (rama `plan-0.27`, PR abierto).

## Texto para abrir la sesión

> Seguimos con el profesor-kit (repo en ~/Documents/courses/profesor-kit, cuenta rsotor). Lee
> `docs/planes/2026-09-26-para-continuar.md` y dime por dónde seguimos.

## Pendiente, en orden

1. **Fusionar el PR de la 0.27.0** y comprobar que la release sale (`gh release list`).
2. **"¿qué es la liquidez?"** (disparadores): de momento vale `dudas` o contestar en el chat (decisión de Roberto,
   2026-09-25). En el próximo cambio de skills, decidir si se refuerza la descripción de `/dudas` para que la
   registre (así cuenta para el tercer tropiezo) y medir.
3. **Claude en la nube (#50):** verificar de verdad que `guardar.js` sube y `--traer` trae con el proxy local
   (`http://…@127.0.0.1:PORT/git/<owner>/<repo>`), y trabajar en una rama `claude/…`. Lo prueba Roberto.
4. **Codex en el Mac (#45):** `codex login` y los pasos del comentario de la #45 (9 supuestos).
5. **0.28.0:** plan con calendario (E2 + E9) y examen acumulativo (E7).

## Cómo se trabaja (lo que funcionó)

- Prueba real **una sola vez al final**; entre cambios, lo rápido (tests, lint, lectura en frío, disparadores).
- Si la prueba real falla en un paso: `npm run prueba-real -- --desde "<paso>"` repite desde ahí con las copias
  (se quedan si algo falla). El resumen de `--desde` no vale para el PR: al final, una completa.
- Antes de aflojar una comprobación que falla, buscar la causa (0.27.0: tres pruebas con el mismo paso en rojo;
  la causa era la skill, que no decía de dónde salía el valor).
- Revisión independiente de todo lo que toca git del alumno o la decisión de subir (0.27.0: dos rondas, cada una
  encontró fallos graves).
