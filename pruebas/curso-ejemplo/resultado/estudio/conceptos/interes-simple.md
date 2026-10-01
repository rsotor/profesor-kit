---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: []
tags: [interes, ahorro]
---
# Interés simple

> **En una frase:** Con interés simple, los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Quieres saber cuánto te dará un depósito. La cuenta más directa es cobrar lo mismo cada periodo, calculado sobre
lo que pusiste al principio, sin que lo ganado vuelva a entrar en la cuenta.

## El ejemplo

Depositas 1.000,00 € al 5 % anual de interés simple, durante 3 años.

- Cada año ganas 5 % anual de 1.000,00 € = **50,00 €**, siempre los mismos.
- En 3 años: 3 × 50,00 € = **150,00 €** de intereses.
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

$C$ es el capital inicial, $i$ el tipo en tanto por uno (5 % anual = 0,05) y $t$ el tiempo **en el mismo periodo
que $i$** (si $i$ es anual, $t$ va en años). $I$ son los intereses y $C_f$ el capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: usar un tipo anual con el tiempo en meses (3 años escritos como 36). La $t$ y la $i$ tienen
> que hablar del mismo periodo, o la cuenta sale 12 veces mayor.

## Practícalo

→ **[Simple frente a compuesto: qué pasa si cambio las condiciones](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.md)**

Compara el mismo capital y tipo con simple y con compuesto, moviendo los años. Lo que debería sorprender es
que la diferencia no crece al mismo ritmo.

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen $C$ e $i$
- [[interes-compuesto]] — lo mismo, pero reinvirtiendo los intereses

## Historial

- **02-01-01** · primera vez
