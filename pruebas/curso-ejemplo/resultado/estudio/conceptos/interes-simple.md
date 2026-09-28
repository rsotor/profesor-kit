---
tipo: concepto
bloques: ["Módulo 2 · Ahorro e interés"]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** Con interés simple los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Quieres saber cuánto tendrás dentro de unos años si el banco te paga un tipo fijo. Lo más sencillo es que cada
año te pague lo mismo, calculado siempre sobre lo que pusiste el primer día.

## El ejemplo

Depositas 1.000,00 € a un interés simple del 5 % anual, durante 3 años.

- Cada año: 1.000,00 € × 0,05 = 50,00 € de intereses.
- En 3 años: 50,00 € × 3 = **150,00 €**.
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**.

Los 50,00 € del primer año no se vuelven a meter: el año siguiente vuelven a ser 50,00 €, ni un céntimo más.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo
periodo que `i`** (si `i` es anual, `t` en años). `I` son los intereses y `C_f` el capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: poner un tipo anual con el tiempo en meses. Con 0,05 anual y `t` = 36 salen 1.800,00 €
> de intereses en vez de 150,00 €. `i` y `t` deben hablar del mismo periodo.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde el lado del simple: alarga los años y mira que la línea sube siempre igual, 50,00 € cada año.

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen `C` e `i`
- [[interes-compuesto]] — el mismo caso, pero reinvirtiendo los intereses

## Historial

- **02-01-01** · primera vez
