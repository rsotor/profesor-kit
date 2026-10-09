---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 1
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes, ahorro]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** con interés simple, los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te dará un dinero parado a un tipo fijo. La versión más sencilla: cada año cobras lo mismo, porque el cálculo se hace siempre sobre la cifra de partida y lo cobrado no vuelve a trabajar.

## El ejemplo

Pones **1.000,00 €** a un interés simple del 5 % anual durante 3 años.

- Cada año: 1.000,00 € × 0,05 = 50,00 €.
- En 3 años: 50,00 € × 3 = **150,00 €** de intereses.
- Al final tienes 1.000,00 € + 150,00 € = **1.150,00 €**.

Año a año el saldo sube lo mismo: 1.050,00 €, 1.100,00 €, 1.150,00 €. En una gráfica, una línea recta.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- $I$: los intereses ganados, en €.
- $C$: el capital inicial, en €.
- $i$: el tipo en tanto por uno **con su periodo** (5 % anual → 0,05 anual).
- $t$: el tiempo, **medido en el mismo periodo que $i$** (si $i$ es anual, $t$ en años).
- $C_f$: el capital final.

## El error típico

Poner el tiempo en meses con un tipo anual. Con 1.000,00 € al 5 % anual durante 6 meses, no es $t = 6$ sino $t = 0{,}5$ años: 1.000,00 € × 0,05 × 0,5 = **25,00 €**, no 300,00 €.

> [!info] Ampliación fuera de los apuntes
> El material solo dice que $t$ va en el mismo periodo que $i$; el caso de los 6 meses es un ejemplo añadido para ver qué pasa si no se cumple.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Desde aquí, fíjate en la línea del simple: mueve el tipo y los años y comprueba que sube siempre lo mismo por año, y que con 1 año el compuesto no le gana. Es el listón con el que se mide al compuesto.

## Relacionados

- [[capital]] — la base sobre la que se calcula siempre
- [[tipo-de-interes]] — de él sale $i$, con su periodo
- [[interes-compuesto]] — lo mismo, pero reinvirtiendo los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
