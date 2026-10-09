---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto, los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también.

## El problema

Con el [[interes-simple]] lo que ganas se queda cobrado y quieto. Pero si lo ganado se queda dentro y vuelve a trabajar, el dinero crece sobre una base cada vez mayor. La pregunta es cuánta diferencia hace eso.

## El ejemplo

Los mismos **1.000,00 €** al 5 % anual, 3 años, año a año:

| Año | Cálculo | Saldo compuesto | Saldo simple |
|---|---|---|---|
| 1 | 1.000,00 € × 1,05 | 1.050,00 € | 1.050,00 € |
| 2 | 1.050,00 € × 1,05 | 1.102,50 € | 1.100,00 € |
| 3 | 1.102,50 € × 1,05 | 1.157,63 € | 1.150,00 € |

Al tercer año el compuesto lleva **7,63 €** más. Poco a 3 años. Pero la distancia no crece en línea recta:

| Años | Compuesto | Simple | Diferencia |
|---|---|---|---|
| 10 | 1.628,89 € | 1.500,00 € | 128,89 € |
| 20 | 2.653,30 € | 2.000,00 € | 653,30 € |
| 30 | 4.321,94 € | 2.500,00 € | 1.821,94 € |

> [!info] Ampliación fuera de los apuntes
> Las filas de 10, 20 y 30 años y el desglose año a año son cálculos añadidos con la misma fórmula del material; los apuntes solo dan el caso de 3 años.

## La fórmula

$$ C_f = C \cdot (1+i)^n $$

- $C_f$: el capital final, en €.
- $C$: el capital inicial, en €.
- $i$: el tipo en tanto por uno **con su periodo** (5 % anual → 0,05 anual).
- $n$: cuántos periodos de capitalización pasan (si $i$ es anual, $n$ en años).

Con los números: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

## El error típico

Pensar que, como a 3 años la diferencia es de unos pocos euros, el compuesto "casi es lo mismo" que el simple. A corto plazo lo es; con el tiempo, no.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve los años y el tipo anual: con 1 año (o con tipo 0) no hay ventaja, y a partir de cierto plazo supera una décima parte del capital. Cuánto plazo hace falta depende mucho del tipo.

> [!tip] Visto desde tus ingresos irregulares
> El compuesto necesita que el dinero **se quede dentro**. Un buen mes apartas 1.000,00 € al 5 % anual: a 10 años son 1.628,89 € (628,89 € de intereses). Si en un mes flojo los sacas al año 5, solo has ganado 276,28 €; los otros 352,61 € nacen precisamente en los 5 últimos años. Con ingresos irregulares, la tentación de tocarlo existe: por eso va primero el [[colchon-financiero]], para que el mes flojo se pague con él y no con lo que está creciendo.

## Relacionados

- [[interes-simple]] — el punto de comparación: crece en línea recta
- [[capitalizacion]] — cuántas veces al año se suman los intereses al capital
- [[regla-del-72]] — un atajo para estimar cuánto tarda en doblarse
- [[colchon-financiero]] — el dinero líquido que evita tocar lo que crece

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
