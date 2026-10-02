---
tipo: concepto
bloques: ["2.1 Interés simple y compuesto"]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** Con interés simple, los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te darán por un dinero prestado o depositado. La forma más sencilla: cada año cobras lo mismo, porque los intereses se calculan siempre sobre lo que pusiste al principio.

## El ejemplo

1.000,00 € a un interés simple del 5% anual, durante 3 años.

- Cada año: 1.000,00 € × 0,05 = 50,00 €
- En 3 años: 50,00 € × 3 = **150,00 €**
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5% anual = 0,05) y `t` el tiempo, en el mismo periodo que `i` (si `i` es anual, `t` en años). Los intereses crecen en línea recta.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Usar `t` en meses con un tipo anual (o al revés). Con 5% anual y 18 meses, `t` vale 1,5 años, no 18.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde el lado del simple: alarga los años y mira cómo el simple sigue en línea recta mientras el compuesto lo adelanta, incluso con un tipo menor.

## Relacionados

- [[interes-compuesto]] — el mismo capital, pero reinvirtiendo los intereses
- [[capital]] · [[tipo-de-interes]] — sus dos ingredientes

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
