---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto, los intereses de cada periodo se suman al capital y desde ahí generan intereses ellos también, así que el dinero crece cada vez más rápido.

## El problema

Con el interés simple, lo que ganas se queda parado: no trabaja. Si cada año metes lo ganado de nuevo en la
cuenta, ese dinero también produce, y el crecimiento deja de ser una línea recta.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual, 3 años, pero reinvirtiendo los intereses:

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | **1.157,63 €** |

Con interés simple eran 1.150,00 €. Diferencia: **7,63 €**. A 3 años parece poco, pero esa diferencia crece cada
vez más rápido con los años.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

$C$ es el capital inicial, $i$ el tipo por periodo en tanto por uno (5 % anual = 0,05) y $n$ el número de
periodos (si $i$ es anual, $n$ en años). Comprobación: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = 1.157,63 €.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Calcularlo como si fuera simple porque "a 3 años da casi lo mismo". La diferencia es pequeña al principio y se
> dispara con los años: es justo lo que hace al compuesto tan potente (o tan caro, si es una deuda).

## Practícalo

→ **[Simple frente a compuesto: qué pasa si cambio las condiciones](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.md)**

Alarga los años con el mismo capital y tipo y mira cómo se separan las dos cuentas.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> El interés compuesto premia el tiempo sin tocar el dinero. Con ingresos irregulares, lo que te lo estropea no
> es meter poco en un mes flojo, sino sacar lo ahorrado en uno malo: por eso importa el [[colchon-financiero]]
> aparte, para no tener que deshacer el ahorro.

## Relacionados

- [[interes-simple]] — el punto de comparación: crece en línea recta
- [[capitalizacion]] — cuántas veces al año se aplica el interés
- [[regla-del-72]] — cuánto tarda en doblarse a interés compuesto
- [[colchon-financiero]] — para no tener que tocar lo que está creciendo

## Historial

- **02-01-01** · primera vez
