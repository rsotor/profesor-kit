---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-o-compuesto
---
# Interés simple

> **En una frase:** Con interés simple los intereses se calculan siempre sobre el capital inicial y no se reinvierten, así que el dinero crece en línea recta.

## El problema

Hay que acordar cuántos intereses se pagan por un préstamo o un depósito. La forma más sencilla: cada periodo se paga lo mismo, sobre el dinero de partida, y nada más.

## El ejemplo

**1.000,00 €** al **5 % anual** de interés simple, durante **3 años**:

| Año | Intereses del año | Capital acumulado |
|---|---|---|
| 1 | 50,00 € | 1.050,00 € |
| 2 | 50,00 € | 1.100,00 € |
| 3 | 50,00 € | 1.150,00 € |

Cada año son 50,00 €, sin importar cuánto llevas acumulado: crece en línea recta.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

$C$ es el capital inicial, $i$ el tipo en tanto por uno y $t$ el tiempo **en el mismo periodo que $i$** (si $i$ es anual, $t$ en años). Con el ejemplo: $I$ = 1.000 × 0,05 × 3 = **150,00 €**, y $C_f$ = **1.150,00 €**.

## El error típico

Mezclar periodos: usar un tipo anual con el tiempo en meses (3 años → 36). La fórmula solo vale si $i$ y $t$ hablan del mismo periodo.

## Practícalo

→ **[Simple o compuesto: ¿cuál gana?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-o-compuesto.html)**

Pon un tipo simple más alto que el compuesto y ve alargando el tiempo: el simple gana al principio, y después deja de hacerlo.

## Relacionados

- [[interes-compuesto]] — el mismo ejemplo reinvirtiendo los intereses
- [[capital-y-tipo-de-interes]] — de dónde salen $C$ e $i$

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
