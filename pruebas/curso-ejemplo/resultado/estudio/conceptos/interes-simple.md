---
tipo: concepto
bloques: [2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [tipo-de-interes]
alias: []
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés simple

> **En una frase:** los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Necesitas saber cuánto te dará un depósito, o cuánto pagarás por un préstamo, sin que los intereses cambien la base de la cuenta.

## El ejemplo

**1.000,00 €** a un interés simple del **5 % anual**, durante **3 años**. Cada año se cobran 50,00 € (el 5 % anual de 1.000,00 €), y siempre son 50,00 €, porque los intereses no se suman al capital. En 3 años: 150,00 €. Capital final: **1.150,00 €**.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo periodo que `i`** (si `i` es anual, `t` en años). Aquí: 1.000,00 × 0,05 × 3 = 150,00 €.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: usar un tipo anual con el tiempo en meses (`t` = 36). Sale una cifra absurda. `i` y `t` van siempre en el mismo periodo.

## Practícalo

→ **[[ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto|Simple frente a compuesto: qué pasa al alargar el plazo]]**

Sube los años y mira cómo el simple sube siempre lo mismo cada año.

## Relacionados

- [[tipo-de-interes]] — de dónde sale `i`
- [[interes-compuesto]] — la alternativa que reinvierte los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
