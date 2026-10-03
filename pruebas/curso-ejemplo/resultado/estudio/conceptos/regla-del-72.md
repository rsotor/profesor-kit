---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: []
tags: [interes]
---
# Regla del 72

> **En una frase:** una cuenta de cabeza para saber, aproximadamente, cuántos años tarda un capital en doblarse a interés compuesto: 72 dividido entre el tipo anual.

## El problema

Quieres saber si un dinero se duplicará en tu vida, y no tienes calculadora ni ganas de despejar `n` en la fórmula del [[interes-compuesto]].

## El ejemplo

Al 6 % anual: 72 ÷ 6 = **12 años**, aproximadamente. El cálculo exacto da 11,9 años: se desvía en una décima de año.

> [!info] Ampliación fuera de los apuntes
> Otros dos tipos, para ver que la desviación cambia con el tipo (exacto, con la fórmula de `n`):
>
> | Tipo | Regla del 72 | Exacto |
> |---|---|---|
> | 2 % anual | 36,0 años | 35,0 años |
> | 6 % anual | 12,0 años | 11,9 años |
> | 12 % anual | 6,0 años | 6,1 años |

## La fórmula

$$ \text{años para doblar} \approx \frac{72}{i} $$

- Aquí `i` va **en número, sin el %**: 6 % anual se mete como 6, no como 0,06.
- Es el símbolo `≈`, no `=`: es una **aproximación**.

## El error típico

Tratarla como un resultado exacto. Da la cifra "a ojo" y vale para tipos medios; para algo que importe, se calcula con la fórmula de [[interes-compuesto]].

## Relacionados

- [[interes-compuesto]] — de donde sale: solo vale con interés compuesto
- [[tipo-de-interes]] — el número que se divide, siempre anual

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
