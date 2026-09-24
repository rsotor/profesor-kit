---
tipo: concepto
bloques: ["Módulo 2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: [interés simple]
tags: []
---
# Interés simple

> **En una frase:** los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te darán 1.000,00 € depositados varios años. La versión más sencilla: cada año
cobras lo mismo, porque cada año el interés se calcula sobre esos mismos 1.000,00 €.

## El ejemplo

1.000,00 € a un interés simple del 5 % anual, durante 3 años.

Cada año cobras 1.000,00 € × 0,05 = 50,00 €. En 3 años: **150,00 €** de intereses. El capital final
es 1.000,00 € + 150,00 € = **1.150,00 €**.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el
mismo periodo que `i`**: si `i` es anual, `t` va en años. `I` son los intereses y `Cf`, el capital final.

## El error típico

Mezclar periodos: usar un tipo anual con el tiempo en meses. Si `i` es anual, `t` va en años (6 meses
son 0,5 años).

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen `C` e `i`
- [[interes-compuesto]] — la versión en la que los intereses también generan intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
