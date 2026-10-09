---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [regla de 72]
tags: [interes, ahorro]
---
# Regla del 72

> **En una frase:** la regla del 72 es una aproximación para saber, a ojo, cuántos años tarda un capital en doblarse a interés compuesto: 72 dividido entre el tipo anual, en número.

## El problema

Quieres saber cuánto tardaría tu dinero en doblarse sin sacar la calculadora ni la fórmula exacta.

## El ejemplo

1.000,00 € al 6 % anual, a interés compuesto:

- Regla: 72 ÷ 6 = **12 años**.
- Cálculo exacto: **11,9 años**.

Compruébalo: tras 12 años, 1.000,00 € × 1,06¹² = 2.012,20 €. Ya has pasado de los 2.000,00 €, así que doblaste un poco antes.

## La fórmula

$$ T \approx \frac{72}{p} $$

- $T$: años para doblar el capital.
- $p$: el tipo anual en número, sin el % (6 % anual → 6).

La cuenta exacta sale de $(1+i)^T = 2$. La regla es una aproximación, **no** el resultado exacto.

## El error típico

Tomar la cifra de la regla como exacta, o usarla con interés simple (solo vale para el compuesto, donde el dinero se dobla "sobre sí mismo").

> [!info] Ampliación fuera de los apuntes
> Cuánto se aleja de la cifra exacta (cálculo propio):
>
> | Tipo | Regla del 72 | Exacto |
> |---|---|---|
> | 2 % anual | 36 años | 35,0 años |
> | 3 % anual | 24 años | 23,4 años |
> | 6 % anual | 12 años | 11,9 años |
> | 8 % anual | 9 años | 9,0 años |
> | 12 % anual | 6 años | 6,1 años |

## Relacionados

- [[interes-compuesto]] — la regla solo describe su ritmo de crecimiento
- [[tipo-de-interes]] — el número que se divide, siempre anual aquí

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
