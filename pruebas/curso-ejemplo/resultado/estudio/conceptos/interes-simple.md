---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [tipo-de-interes]
alias: []
tags: [interes]
---
# Interés simple

> **En una frase:** los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te darán por un dinero prestado o depositado sin complicarte. Con interés simple la cuenta es la más sencilla: cada periodo cobras lo mismo.

## El ejemplo

**1.000,00 €** a un interés simple del **5 % anual**, durante **3 años**.

- Cada año cobras el 5 % anual de 1.000,00 €: **50,00 €**.
- En 3 años: 50,00 € × 3 = **150,00 €** de intereses.
- Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**.

Los 50,00 € del primer año se quedan aparte: no vuelven a trabajar.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo periodo que `i`** (si `i` es anual, `t` en años). `I` son los intereses y `C_f` el capital final.

## El error típico

Mezclar periodos: poner un tipo anual con el tiempo en meses. Si `i` es anual, `t` va en años (18 meses = 1,5 años).

## Relacionados

- [[tipo-de-interes]] — de dónde sale `i`
- [[interes-compuesto]] — el mismo caso, pero reinvirtiendo los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
