---
name: examen
description: Use when the student wants to test themselves before an exam or check what they have mastered across topic blocks. Triggers on "/examen", "vamos a validar los bloques 1 y 2", "ponme un test", "prepárame el examen".
---

# Modo examen

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`).

Test interno sobre los bloques del temario que pida. **Solo se lanza cuando lo pide** — no forma
parte del ciclo normal de una sesión.

## Checklist

### 1. Alcance

El alcance se expresa en los bloques del temario de `config/curso.md` (usa el nombre que allí se
emplee: bloques, módulos, temas…). `/examen 1-3` = bloques 1 a 3. `/examen 7` = bloque 7. Si no
lo dice, pregunta qué bloques.

### 2. Componer el test

Lee las notas de esos bloques y `config/alumno.md`. Reparto de las preguntas:

| Origen | Peso | Por qué |
|---|---|---|
| Errores repetidos de `config/alumno.md` | 40 % | Es lo que va a fallar de verdad |
| Conceptos `dificultad: 3` | 25 % | Aún no están fijados |
| Fórmulas de `formulario.md` | 20 % | Se olvidan con el tiempo |
| Cobertura del resto | 15 % | Que no quede un hueco entero sin tocar |

Si `formulario.md` está vacío (el curso no tiene fórmulas), su 20 % pasa a cobertura: cobertura
sube a 35 %.

15-20 preguntas por bloque del temario. Mezcla:

- **Opción múltiple** — con distractores que sean el error típico de la nota, no opciones
  absurdas. Un distractor tonto no enseña nada.
- **Cálculo** (si el curso tiene cálculo) — números inventados y redondos, que salgan a mano.
- **"Explica por qué"** — respuesta corta. Es donde se ve si entendió o memorizó.

**Todas las preguntas salen de las notas del curso.** Nada de material que no haya visto: el
examen mide lo estudiado, no lo que "debería" saber.

### 3. Formato

`examenes/YYYY-MM-DD-<alcance>.md` con las soluciones en un callout plegado, o una página HTML
local autocorregible en `examenes/` si el alumno lo prefiere. **Sin Artifact:** es un test
interno, se queda en el repo.

Si `lente` está activada en `config/profesor.md`, añade al final la lectura desde ese punto de
vista; nunca decide qué se explica ni cuánto, y nunca puntúa.

### 4. Corregir — la parte que importa

Cuando te dé las respuestas:

1. Corrige pregunta a pregunta, diciendo **por qué** falla la respuesta equivocada, no solo cuál
   era la buena.
2. Agrupa los fallos por concepto, no por número de pregunta.
3. Si un concepto acumula 2+ fallos → a `## Errores repetidos` de `config/alumno.md`, citando
   este examen como prueba, y sube su `dificultad` en la nota.
4. Da el veredicto en tres bloques, sin rodeos:

```
✅ Dominado          → velocidad-media, causas-de-la-revolucion
⚠️ Hay que repasar   → aceleración (2 fallos)
🔴 Vuelve a la nota  → causas-de-la-revolucion — no está el mecanismo, está memorizado
```

5. **Actualiza `progreso.md`** — es el único sitio donde se sabe qué domina de verdad. Un
   concepto solo cambia de estado si hay una respuesta suya que lo justifique:
   - acertó el mecanismo → `teoría ✅` · acertó el cálculo o supo aplicarlo → `aplicación ✅`
   - falló → `🟡`; falló por segunda vez → `🔴` (y entonces también el paso 3)
6. Guarda el resultado:

    node .kit/herramientas/guardar.js "examen: <alcance>"

Toda entrada que este examen añada a `config/alumno.md` cita como prueba el fichero del examen.

**Sé honesto con la nota.** Un aprobado regalado hoy es un suspenso real cuando llegue el examen
de verdad.

El formato del examen oficial del centro no es cosa de esta skill (fase 2).
