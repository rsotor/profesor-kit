---
tipo: concepto
bloques: [2.1]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** con interés simple los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que cada periodo suman lo mismo.

## El problema

Quieres saber cuánto te dará un depósito sin hacer cuentas raras: cada año te pagan lo mismo y los intereses se quedan aparte, sin volver a trabajar.

## El ejemplo

1.000,00 € a un 5 % anual de interés simple, durante 3 años.

| Año | Interés de ese año | Intereses acumulados |
|---|---|---|
| 1 | 50,00 € | 50,00 € |
| 2 | 50,00 € | 100,00 € |
| 3 | 50,00 € | 150,00 € |

Capital final: 1.000,00 € + 150,00 € = **1.150,00 €**. Cada año se calcula sobre los mismos 1.000,00 €.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- `C`: capital inicial.
- `i`: tipo de interés en tanto por uno (un 5 % anual es 0,05).
- `t`: tiempo, **en el mismo periodo que `i`** (si `i` es anual, `t` en años).
- `I`: intereses; `C_f`: capital final.

## El error típico

Mezclar periodos: usar un tipo anual con el tiempo en meses. Si `i` es anual, `t` va en años; 18 meses son 1,5 años.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve los años y el tipo: lo que importa es cuándo la ventaja del compuesto pasa de pequeña a grande.

## Relacionados

- [[interes-compuesto]] — el contrapunto: aquí los intereses no se reinvierten
- [[tipo-de-interes]] — de dónde sale `i`

## Historial

- **02-01-01** · primera vez
