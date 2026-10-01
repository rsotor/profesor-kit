---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-simple-vs-compuesto
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también.

## El problema

Con interés simple, el dinero que ya has ganado se queda parado. El compuesto lo pone a trabajar: lo que cobras un año forma parte del capital del siguiente.

## El ejemplo

Los mismos **1.000,00 €** al **5 % anual**, 3 años, pero reinvirtiendo los intereses:

| Año | Capital al empezar | Interés del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Con interés simple eran **1.150,00 €**. La diferencia: **7,63 €**.

Parece poco a 3 años, pero crece cada vez más rápido:

| Años | Simple (5 % anual) | Compuesto (5 % anual) |
|---|---|---|
| 3 | 1.150,00 € | 1.157,63 € |
| 10 | 1.500,00 € | 1.628,89 € |
| 30 | 2.500,00 € | 4.321,94 € |

El simple sube en línea recta (siempre +50,00 € al año); el compuesto, cada vez más deprisa.

> [!info] Ampliación fuera de los apuntes
> Las cifras de 10 y 30 años las he calculado yo con la misma fórmula; no están en la clase.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno y `n` el número de periodos de capitalización (si `i` es anual, `n` en años). Con el ejemplo: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

## El error típico

Pensar que "a 3 años no hay para tanto, así que da igual". La diferencia entre simple y compuesto no es constante: se abre más cuanto más tiempo pasa. A 3 años son 7,63 €; a 30, más de 1.800,00 €.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-vs-compuesto.html)**

Mueve el tipo y los años y mira cuándo la diferencia deja de ser pequeña. Lo que debería sorprender: con muy pocos años, apenas se distinguen.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Lo que más pesa en el compuesto es el tiempo, no la cantidad: un colchón apartado en un mes bueno y dejado quieto empieza a generar intereses desde ese mes, y esperar a un mes "perfecto" para ahorrar cuesta periodos de capitalización.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuándo se dobla un capital

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
