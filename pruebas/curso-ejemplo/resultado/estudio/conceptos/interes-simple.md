---
tipo: concepto
bloques: [2.1 Interés simple y compuesto]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: []
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés simple

> **En una frase:** con interés simple, los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te darán de más por dejar un dinero varios años. Lo más sencillo es cobrar cada año lo mismo:
un porcentaje del dinero que pusiste al principio.

## El ejemplo

Depositas 1.000,00 € a un interés simple del 5 % anual durante 3 años.

- Cada año cobras 5 % anual de 1.000,00 €: **50,00 €** (siempre los mismos).
- En 3 años: 3 × 50,00 € = **150,00 €** de intereses.
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**.

Crece en línea recta: cada año, los mismos 50,00 €.

## La fórmula

$$I = C \cdot i \cdot t \qquad C_f = C + I$$

- $C$: el capital inicial (1.000,00 €).
- $i$: el tipo de interés en tanto por uno (5 % anual es 0,05).
- $t$: el tiempo, **en el mismo periodo que $i$** (si $i$ es anual, $t$ en años).
- $I$: los intereses. $C_f$: el capital final.

## El error típico

Mezclar periodos: usar un tipo anual con un tiempo en meses. Si $i$ es anual, $t$ va en años (6 meses son 0,5).

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.html)**

Aquí verás el lado simple: la línea recta a la que el compuesto acaba adelantando.

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen $C$ e $i$.
- [[interes-compuesto]] — el mismo capital y el mismo tipo, pero reinvirtiendo los intereses.

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
