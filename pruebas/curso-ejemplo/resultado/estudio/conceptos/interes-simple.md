---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [capital, tipo-de-interes]
alias: []
tags: [interes]
---
# Interés simple

> **En una frase:** los intereses se calculan siempre sobre el capital inicial, periodo a periodo, y no se reinvierten.

## El problema

Quieres saber cuánto te dará un dinero prestado o depositado, de la forma más sencilla: cobrando cada periodo lo mismo, sin que los intereses entren en la cuenta del siguiente.

## El ejemplo

1.000,00 € a un interés simple del 5 % anual, durante 3 años.

| Año | Intereses del año | Acumulado |
|---|---|---|
| 1 | 50,00 € | 1.050,00 € |
| 2 | 50,00 € | 1.100,00 € |
| 3 | 50,00 € | 1.150,00 € |

Cada año son 50,00 €, porque siempre se calculan sobre los 1.000,00 € iniciales. Crece **en línea recta**.

## La fórmula

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- `C` es el [[capital]] inicial, `i` el [[tipo-de-interes]] en tanto por uno (5 % anual = 0,05) y `t` el tiempo.
- `t` va en el **mismo periodo que `i`**: con `i` anual, `t` en años.
- Con los datos de arriba: `I = 1.000,00 × 0,05 × 3 = 150,00 €` y `Cf = 1.150,00 €`.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: poner `i` anual y `t` en meses. Con `t = 18` meses y `i = 0,05` anual, saldría 900,00 € de intereses en vez de 75,00 € (1,5 años). `t` y `i` hablan del mismo periodo, siempre.

## Relacionados

- [[interes-compuesto]] — lo mismo, pero reinvirtiendo los intereses
- [[capital]] — la base fija sobre la que se calcula
- [[tipo-de-interes]] — el `i` de la fórmula

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
