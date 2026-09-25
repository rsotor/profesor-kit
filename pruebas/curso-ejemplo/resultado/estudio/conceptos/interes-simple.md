---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** Los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te darán por un depósito. Lo más sencillo es cobrar lo mismo cada año: los intereses de cada periodo salen del dinero con el que empezaste, sin darle vueltas a lo ya cobrado.

## El ejemplo

**1.000,00 €** a un interés simple del **5 % anual**, durante **3 años**.

- Cada año cobras 1.000,00 × 0,05 = 50,00 €.
- En 3 años: 50,00 × 3 = **150,00 €**.
- Capital final: 1.000,00 + 150,00 = **1.150,00 €**.

Los 50,00 € del primer año no generan nada el segundo: el cálculo siempre parte de 1.000,00 €.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- `C`: capital inicial.
- `i`: tipo de interés en tanto por uno (5 % anual = 0,05).
- `t`: el tiempo, **en el mismo periodo que `i`** (si `i` es anual, `t` va en años).
- `I`: los intereses. `C_f`: el capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: usar un tipo anual con el tiempo en meses. Con un 5 % anual y 18 meses, `t` es 1,5 (años), no 18.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde aquí: mira qué le pasa al interés simple cuando pasan muchos años. Crece siempre lo mismo, en línea recta.

## Relacionados

- [[tipo-de-interes]] — de dónde salen `C` e `i`
- [[interes-compuesto]] — el mismo caso, reinvirtiendo los intereses

## Historial

- **02-01-01** · primera vez
