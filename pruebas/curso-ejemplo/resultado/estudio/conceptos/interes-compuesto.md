---
tipo: concepto
bloques: [2.1 Interés simple y compuesto]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto, los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con [[interes-simple]] cobras siempre lo mismo, aunque lleves años con el dinero puesto. Pero los intereses ya
cobrados también son dinero: si se quedan dentro, podrían rendir ellos mismos.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual, 3 años, pero dejando los intereses dentro cada año.

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Los intereses ya no son 50,00 € cada año: crecen, porque cada año se calculan sobre un capital mayor.
Con interés simple serían 1.150,00 €. Diferencia: **7,63 €**.

## La fórmula

$$C_f = C \cdot (1 + i)^n$$

- $C$: el capital inicial (1.000,00 €).
- $i$: el tipo de interés por periodo, en tanto por uno (5 % anual es 0,05).
- $n$: el número de periodos de capitalización (si $i$ es anual, $n$ en años).
- $C_f$: el capital final: 1.000 × 1,05³ = 1.000 × 1,157625 = **1.157,63 €**.

## El error típico

Pensar que "7,63 € de diferencia a 3 años" es poca cosa. La diferencia con el simple **no crece en línea recta**,
crece cada vez más deprisa: es lo que sorprende la primera vez. Otro fallo habitual: confundir los dos y
calcular el compuesto como si fuera simple (o al revés).

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.html)**

Mueve los años y mira cómo se abre la diferencia: dobla el tiempo y la diferencia se hace más del doble.

## Visto desde tus ingresos irregulares

> [!tip] Lectura del profesor, no del curso
> El interés compuesto funciona si el dinero **se queda dentro**. Si en un mes flojo sacas lo que ganaste,
> vuelves a cobrar intereses solo sobre lo que queda. Por eso encaja con un dinero que no piensas tocar y no con
> el [[colchon-financiero]], que sí es para gastarlo cuando toca.

## Relacionados

- [[interes-simple]] — el mismo capital, sin reinvertir los intereses.
- [[capitalizacion]] — cada cuánto se suman los intereses al capital.
- [[regla-del-72]] — atajo para saber cuánto tarda en doblarse un capital así.
- [[inflacion]] — también actúa "sobre lo ya acumulado", pero restando poder de compra.

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
