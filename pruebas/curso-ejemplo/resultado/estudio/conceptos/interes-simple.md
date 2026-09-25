---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: [interés simple]
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés simple

> **En una frase:** los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Necesitas saber cuánto te pagarán por un dinero prestado o depositado. Lo más sencillo es cobrar lo mismo cada
periodo, sin que los intereses ya cobrados vuelvan a generar nada.

## El ejemplo

**1.000,00 €** a un interés simple del 5 % anual, durante 3 años. Cada año cobras lo mismo: 5 % anual de 1.000,00 €.

| Año | Interés del año | Capital acumulado |
|---|---|---|
| 1 | 50,00 € | 1.050,00 € |
| 2 | 50,00 € | 1.100,00 € |
| 3 | 50,00 € | 1.150,00 € |

Total de intereses: 1.000 × 0,05 × 3 = **150,00 €**. Capital final: **1.150,00 €**.

## El nombre

**Interés simple.** Crece **en línea recta**: la misma cantidad cada periodo.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo de interés **en tanto por uno** (5 % anual = 0,05) y `t` el tiempo **en el
mismo periodo que `i`** (si `i` es anual, `t` en años). `I` son los intereses y `C_f` el capital final.

## El error típico

Mezclar periodos: tipo anual con el tiempo en meses. Con un 5 % anual y 18 meses, `t` es 1,5 años, no 18.

> [!info] Ampliación fuera de los apuntes
> Los apuntes dicen que `t` va en el mismo periodo que `i`; el caso de los 18 meses es mío. Con `t` = 1,5:
> 1.000 × 0,05 × 1,5 = 75,00 €.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve capital, tipo y años. Lo que debería sorprender: con 1 año, o con un tipo del 0 % anual, los dos métodos dan
lo mismo; a partir del segundo año el simple se queda atrás.

## Relacionados

- [[capital-y-tipo-de-interes]] — de dónde salen `C` e `i`
- [[interes-compuesto]] — el mismo caso, reinvirtiendo los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
