---
tipo: concepto
bloques: [2.1]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** con interés simple los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Quieres saber cuánto te da un dinero prestado o depositado. La versión más sencilla: cada año cobras
lo mismo, porque los intereses se quedan aparte y no vuelven a trabajar.

## El ejemplo

1.000,00 € a un 5 % anual durante 3 años:

- Cada año: 1.000,00 € × 0,05 = 50,00 €
- En 3 años: 50,00 € × 3 = **150,00 €** de intereses
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (un 5 % anual es 0,05) y `t` el tiempo, en el
mismo periodo que `i` (si `i` es anual, `t` en años). `I` son los intereses y `C_f` el capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Confundirlo con el compuesto y pensar que "se va acelerando". No: con el simple, el tercer año da
> lo mismo que el primero (50,00 €). Es justo lo que distingue a los dos.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve el tipo y los años. Lo que debería sorprender: el simple es la recta de comparación; mira cuánto
se separa de ella el compuesto según el plazo.

## Relacionados

- [[capital]] — la base sobre la que se calcula siempre
- [[tipo-de-interes]] — con su periodo
- [[interes-compuesto]] — la alternativa que reinvierte los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
