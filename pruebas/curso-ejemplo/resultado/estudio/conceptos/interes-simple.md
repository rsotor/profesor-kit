---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: [interés simple]
tags: []
---
# Interés simple

> **En una frase:** Con interés simple, los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Quieres saber cuánto te dará un depósito sin hacer cuentas complicadas. La forma más sencilla: cada año
cobras lo mismo, porque el interés se calcula siempre sobre los mismos euros de partida.

## El ejemplo

1.000,00 € a un interés simple de 5 % anual, durante 3 años.

Cada año cobras 1.000,00 × 0,05 = 50,00 €. En tres años, **150,00 €**. Capital final:
1.000,00 + 150,00 = **1.150,00 €**.

| Año | Interés del año | Capital al final |
|---|---|---|
| 1 | 50,00 € | 1.050,00 € |
| 2 | 50,00 € | 1.100,00 € |
| 3 | 50,00 € | 1.150,00 € |

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- `C`: capital inicial · `i`: tipo en tanto por uno (5 % anual = 0,05) · `t`: tiempo **en el mismo periodo
  que `i`** (si el tipo es anual, en años).
- `I`: intereses totales · `C_f`: capital final.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: con un tipo anual y el tiempo en meses (`t = 36`), sale una cifra absurda. Si `i` es
> anual, `t` va en años (3, no 36).

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen `C` e `i`
- [[interes-compuesto]] — el mismo caso, pero reinvirtiendo los intereses

## Historial

- **02-01-01** · primera vez
