---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto]
alias: []
tags: [ahorro, interes]
ejercicio: 02-02-01-ahorro-a-largo-plazo-horizonte-temporal
---
# Horizonte temporal

> **En una frase:** el horizonte temporal es el tiempo que el dinero va a estar ahorrado antes de usarlo; con interés compuesto, es lo que más pesa en el resultado.

## El problema

Parece que lo que decide cuánto juntas es cuánto aportas. Con interés compuesto no es así: los intereses generan intereses, y eso solo despega con los años.

## El ejemplo

Misma aportación de 2.400,00 € al final de cada año, con un tipo de interés del 5 % anual compuesto. Solo cambia el tiempo:

| Horizonte | Aportado | Intereses | Total |
|---|---|---|---|
| 3 años | 7.200,00 € | 366,00 € | **7.566,00 €** |
| 30 años | 72.000,00 € | 87.453,23 € | **159.453,23 €** |

Con 10 veces más años, el total es 21 veces mayor (159.453,23 ÷ 7.566,00 ≈ 21,1), porque en 30 años los intereses (87.453,23 €) superan a lo aportado (72.000,00 €).

## La fórmula

$$ V_n = A \times \frac{(1+i)^n - 1}{i} $$

Es la de la [[aportacion-periodica]]. Aquí el protagonista es $n$, que está en el exponente: crece más rápido que $A$, que solo multiplica. Con los datos: 2.400,00 × (1,05³⁰ − 1) ÷ 0,05 = 2.400,00 × 66,4388 = **159.453,23 €**.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Pensar que 10 años más son "un poco más". Con interés compuesto el efecto no es lineal: los últimos años aportan mucho más que los primeros.

## Practícalo

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-ahorro-a-largo-plazo-horizonte-temporal.md)**

Mueve los años y el importe de la aportación, y compara dos planes con el mismo dinero aportado. Debería sorprenderte quién gana, y que con un tipo de interés del 0 % anual dejarían de ganar los años.

## Visto desde tus ingresos irregulares

Los años pesan más que acertar con el importe: una aportación pequeña pero constante desde ya le gana a esperar a un buen año para empezar con más. Eso encaja con tus meses flojos: si en uno no llegas, no dejes de aportar el año entero, aporta menos.

## Relacionados

- [[interes-compuesto]] — el mecanismo que hace pesar el tiempo
- [[aportacion-periodica]] — lo que se añade cada periodo
- [[colchon-financiero]] — evita tener que sacar el dinero antes de tiempo y cortar el horizonte

## Historial

- **02-02-01** · primera vez
