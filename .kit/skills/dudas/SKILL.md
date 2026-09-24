---
name: dudas
description: Use when the student wants their pending doubt markers reviewed and answered, the async channel for solo study. Triggers on "/dudas", "he dejado comentarios", "resuelve mis dudas", "revisa lo que he anotado".
---

# Resolver las dudas pendientes

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`).

El alumno estudia por su cuenta y deja el marcador de dudas donde tiene una duda, ve un error o
quiere que se amplíe algo. El marcador es el de `config/profesor.md` (`@@` por defecto). Puede
ponerlo **en cualquier fichero**: en apuntes de `estudio/inbox/`, o dentro de una nota ya escrita.

**Ninguna duda se borra sin responderla.** Es el único canal que tiene para dejarte comentarios
cuando estudia sin ti delante.

## Checklist

### 1. Recogerlas todas

Ejecuta:

    node .kit/herramientas/comprobar.js

Los avisos con regla `duda-pendiente` señalan los ficheros que tienen marcadores sin responder —
es lo que sustituye a repasar el material a mano. Si no hay ninguno, dilo y termina. No hay nada
más que hacer.

### 2. Leer el contexto de cada una

Lee el **párrafo o sección completa** donde está el marcador, no solo la línea. La duda casi
nunca se entiende suelta.

Antes de responder, mira `## Conceptos que costaron` en `config/alumno.md`: si el concepto ya
aparece ahí como difícil, no repitas la explicación que ya falló — **cambia de ángulo**.

### 3. Clasificar la intención

Un solo marcador, tú deduces qué quiere. Los cuatro casos:

| Lo que escribe | Qué hacer |
|---|---|
| **Duda** — "no entiendo por qué…" | Responder con un ejemplo **nuevo**, distinto del que ya está en la nota |
| **Corrección** — "esto no es lo que explicó el profesor" | Corregir la nota. El alumno estuvo en clase, tú no: **tiene razón por defecto**. Si además es incorrecto de fondo, dilo, pero corrige lo que dijo el profesor y márcalo `> [!warning]` |
| **Ampliación** — "¿y si la condición cambia?" | Ampliar la nota (o crear el concepto nuevo si da para nota propia y añadirlo al índice) |
| **Nota mental** — "esto seguro que cae en el examen" | Sin respuesta: llevarlo a las flashcards y a `config/alumno.md` |

Si no está claro qué quiere: **pregunta**. Responder a la duda equivocada gasta su tiempo.

### 4. Responder en el sitio

La respuesta se queda **donde nació la duda**. El marcador se consume y se convierte en:

```markdown
> [!question]- Duda · YYYY-MM-DD
> no pillo por qué la velocidad media baja si el tramo es más corto pero se tarda lo mismo
>
> **Respuesta:** …
```

La duda se cita **sin el marcador**, para que `node .kit/herramientas/comprobar.js` no la vuelva
a contar como pendiente. Callout **plegado** (el guion): queda para releer sin ensuciar la nota.

Si la respuesta obliga a reescribir la explicación principal, **reescríbela** — y deja en el
callout solo un "reescrito el ejemplo, mira arriba". El objetivo es que la nota quede bien, no
acumular parches al final.

### 5. Aprender de las dudas

En `config/alumno.md`:

- Sube el contador del concepto en la tabla de `## Registro de dudas`.
- Si es la 1ª vez: apunta en `## Conceptos que costaron` qué falló y qué lo desbloqueó.
- **Si es la 3ª duda del mismo concepto** (`estado.js --json` la da como señal `tercer-tropiezo`): tercer tropiezo, bandera roja. Reexplica la nota
  entera desde otro ángulo sin que lo pida, y díselo: _"Es la tercera vez que <X> te frena. He
  reescrito la nota con otro enfoque."_
- Si la duda revela un prerrequisito flojo, comprueba el `requiere:` de la nota: puede que el
  problema esté aguas arriba y sea otro concepto el que hay que reforzar.
- **Toda entrada nueva cita su prueba:** el fichero y la fecha de la duda.

### 6. Cerrar

    node .kit/herramientas/guardar.js "dudas: N resueltas"

## Al terminar, resume

Y cierra con una línea `Del kit: nada` o `Del kit: <qué>` (algo que no es de este curso ni de este alumno; si no es
"nada", sigue "Feedback al kit" de `AGENTS.md`).

```
3 dudas resueltas

conceptos/velocidad-media.md            duda        → ejemplo nuevo con un tramo más corto
conceptos/causas-de-la-revolucion.md    duda        → 3ª vez, nota reescrita de cero
sesiones/s04-cinematica.md              corrección  → el profesor dijo "distancia", no "desplazamiento"
inbox/clase-04.md                       ampliación  → concepto nuevo [[velocidad-instantanea]]

Patrón: dos de las tres dudas de esta tanda son sobre magnitudes que cambian con el tiempo.
Se lo he apuntado en config/alumno.md — conviene repasar ese bloque antes del próximo examen.
```
