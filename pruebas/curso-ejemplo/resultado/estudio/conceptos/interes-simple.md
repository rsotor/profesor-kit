---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01]
dificultad: 2
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes, ahorro]
ejercicio: 02-01-01-simple-contra-compuesto
---
# Interés simple

> **En una frase:** Con interés simple, los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Quieres saber cuánto tendrás al final de un depósito. Si cada año cobras lo mismo y lo retiras, no hay
efecto bola de nieve: es el caso más sencillo, y sirve de vara de medir para el compuesto.

## El ejemplo

1.000,00 € a un interés simple del 5 % anual, durante 3 años:

| Año | Intereses del año | Total |
|---|---|---|
| 1 | 50,00 € | 1.050,00 € |
| 2 | 50,00 € | 1.100,00 € |
| 3 | 50,00 € | 1.150,00 € |

Cada año se cobran los mismos 50,00 €, porque se calculan siempre sobre los 1.000,00 € iniciales. En total:
**150,00 € de intereses** y **1.150,00 €** al final.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo
periodo que `i`** (tipo anual, `t` en años). `C_f` es el capital final.

## El error típico

Pensar que "interés compuesto" y "simple" dan casi lo mismo porque a 3 años la diferencia es pequeña (7,63 €
en el ejemplo). Es pequeña al principio; con los años se abre cada vez más (ver [[interes-compuesto]]).

## Practícalo

→ **[Simple contra compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-contra-compuesto.html)**

Mueve los años y los dos tipos: mira cuándo la línea recta del simple gana al compuesto y cuándo deja de ganarle.

## Relacionados

- [[capital]] — el capital inicial es la base de todo el cálculo
- [[tipo-de-interes]] — el `i` de la fórmula, con su periodo
- [[interes-compuesto]] — la alternativa: los intereses también generan intereses

## Historial

- **02-01-01** · primera vez
