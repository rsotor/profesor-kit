---
name: dudas
description: Use when the student has doubts, either left as markers in their notes while studying alone or asked right now in the chat about a concept. Triggers on "/dudas", "tengo dudas", "tengo una duda de este concepto", "no entiendo el interés compuesto", "he dejado comentarios", "resuelve mis dudas", "revisa lo que he anotado".
---

# Resolver las dudas pendientes

El alumno estudia por su cuenta y deja el marcador de dudas donde tiene una duda, ve un error o
quiere que se amplíe algo. El marcador es el de `config/profesor.md` (`@@` por defecto). Puede
ponerlo **en cualquier fichero**: en apuntes de `estudio/inbox/`, o dentro de una nota ya escrita.

## Checklist

### 1. Recogerlas todas

Ejecuta:

    node .kit/herramientas/comprobar.js

Los avisos con regla `duda-pendiente` señalan los ficheros que tienen marcadores sin responder —
es lo que sustituye a repasar el material a mano. Si no hay ninguno y la duda no te la ha hecho en el chat, dilo
y termina.

**Si te la hace en el chat** ("no entiendo X"), es una duda igual que un marcador: la respondes en la
conversación (pasos 2 y 3: contexto y un ejemplo nuevo), la llevas a la nota si la mejora (paso 4, sin callout de
duda: no había marcador) y **la apuntas en el registro** (paso 5, con `--prueba "chat, <fecha>"`): si no, el
tercer tropiezo solo contaría las que deja por escrito.

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
| **Ampliación** — "¿y si la condición cambia?" | Ampliar la nota (o crear el concepto nuevo si da para nota propia y añadirlo al índice: antes, `node .kit/herramientas/candidatos.js "<nombre> — <definición>"` — si uno es lo mismo, amplíalo; un alias es otro nombre, nunca una parte que se evalúa aparte) |
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

- Apunta la duda en el registro con la herramienta, una vez por duda (no edites la tabla a mano: un reemplazo
  mal hecho rompe `config/alumno.md`, y el alumno lo ve en su **mi-perfil**):

      node .kit/herramientas/dudas.js <slug-del-concepto> --prueba "<fichero de la duda>"

  Si te dice que es la tercera duda, es el tercer tropiezo (abajo).
- Si es la 1ª vez: apunta en `## Conceptos que costaron` qué falló y qué lo desbloqueó.
- **Si es la 3ª duda del mismo concepto**: tercer tropiezo, bandera roja. Reexplica la nota
  entera desde otro ángulo sin que lo pida, y díselo: _"Es la tercera vez que <X> te frena. He
  reescrito la nota con otro enfoque."_
- Si la duda revela un prerrequisito flojo, comprueba el `requiere:` de la nota: puede que el
  problema esté aguas arriba y sea otro concepto el que hay que reforzar.
- **Toda entrada nueva cita su prueba:** el fichero y la fecha de la duda.

### 6. Cerrar

    node .kit/herramientas/guardar.js "dudas: N resueltas"

## Al terminar, resume

Cierra con `Del kit: nada` o `Del kit: <qué>` (ver "Feedback al kit" en `AGENTS.md`).

```
3 dudas resueltas

conceptos/velocidad-media.md            duda        → ejemplo nuevo con un tramo más corto
conceptos/causas-de-la-revolucion.md    duda        → 3ª vez, nota reescrita de cero
sesiones/s04-cinematica.md              corrección  → el profesor dijo "distancia", no "desplazamiento"
inbox/clase-04.md                       ampliación  → concepto nuevo [[velocidad-instantanea]]

Patrón: dos de las tres dudas de esta tanda son sobre magnitudes que cambian con el tiempo.
Se lo he apuntado en config/alumno.md — conviene repasar ese bloque antes del próximo examen.
```
