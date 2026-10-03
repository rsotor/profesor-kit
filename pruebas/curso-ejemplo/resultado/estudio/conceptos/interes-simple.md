---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-interes-simple-vs-compuesto
---
# Interés simple

> **En una frase:** con interés simple los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que cada periodo suma lo mismo.

## El problema

Hay que saber cuánto produce un dinero prestado o depositado. La forma más sencilla: cobrar el tipo sobre lo que pusiste, siempre, sin tocar los intereses que ya han salido.

## El ejemplo

Depositas 1.000,00 € a un 5 % anual de interés simple durante 3 años:

- Cada año: 1.000,00 × 0,05 = 50,00 €.
- En 3 años: 3 × 50,00 = **150,00 €**.
- Capital final: 1.000,00 + 150,00 = **1.150,00 €**.

Cada año suma lo mismo: el crecimiento va en línea recta.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- $C$: capital inicial (€).
- $i$: tipo en tanto por uno (5 % anual = 0,05 por año).
- $t$: tiempo, **en el mismo periodo que el tipo** (tipo anual, años).
- $I$: intereses totales. $C_f$: capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: poner el tiempo en meses con un tipo anual. Si $i$ es anual, $t$ va en años (6 meses son 0,5 años).

## Practícalo

→ **[Interés simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-vs-compuesto.html)**

Pon el interés simple a un tipo anual más alto que el compuesto y mueve el plazo: al principio gana el simple, pero a partir de cierto año el compuesto lo adelanta. Debería sorprender que un tipo menor acabe ganando.

## Relacionados

- [[capital]] — la base fija sobre la que se calcula
- [[tipo-de-interes]] — el porcentaje que se aplica, con su periodo
- [[interes-compuesto]] — la versión en la que los intereses también generan intereses

## Historial

- **02-01-01** · primera vez
