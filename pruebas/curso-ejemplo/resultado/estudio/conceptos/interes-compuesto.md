---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-simple, capital-y-tipo-de-interes]
alias: [interés compuesto, interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y, desde ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con interés simple, los intereses que cobras se quedan parados. Si en vez de dejarlos quietos los reinviertes, el dinero crece más deprisa. Hace falta una forma de calcularlo.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual durante 3 años, pero ahora los intereses se suman al capital cada año:

| Año | Capital al empezar | Intereses (5 % anual) | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | **1.157,63 €** |

Con interés simple eran 1.150,00 €: **7,63 € de diferencia**. A 3 años parece poco; crece cada vez más deprisa cuantos más periodos pasan.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

$C$ es el capital inicial, $i$ el tipo en tanto por uno y $n$ el número de periodos de capitalización (si $i$ es anual, $n$ en años). Con las cifras de clase: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que el compuesto "siempre gana" desde el primer día. En el primer periodo dan lo mismo; la ventaja se ve con el tiempo, y a plazos cortos una oferta simple con un tipo algo mayor puede salir mejor (mira el ejercicio). Este error lo propone el profesor: los apuntes no traen ninguno.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Lo que hace crecer al compuesto es el **tiempo** sin tocar el dinero, no que las aportaciones sean regulares. Por eso conviene separar el ahorro a largo plazo de tu [[colchon-financiero]]: el colchón se toca cuando un mes flojo lo pide; lo otro, mejor que no.

## Practícalo

→ **[Ejercicios de 02-01-01-interes-simple-y-compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.md)**

Mueve el plazo entre una oferta simple y una compuesta. Lo que debería sorprender: hay un año a partir del cual el veredicto se invierte.

## Relacionados

- [[interes-simple]] — el punto de comparación: crece en línea recta
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuándo se dobla el capital

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
