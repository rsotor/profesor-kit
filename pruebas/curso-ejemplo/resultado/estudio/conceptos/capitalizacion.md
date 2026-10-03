---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia de capitalización]
tags: [interes]
ejercicio: 02-01-01-interes-simple-vs-compuesto
---
# Capitalización

> **En una frase:** la capitalización es cuántas veces al año se suman los intereses al capital; cuanto más seguido, más rápido crece el dinero.

## El problema

Un tipo anual no siempre se aplica de golpe a fin de año. Si el banco suma los intereses cada mes, desde el segundo mes ya ganas intereses sobre los intereses del primero. ¿Cambia el resultado frente a esperar al año?

## El ejemplo

1.000,00 € al 5 % anual durante 1 año:

- **Capitalización anual:** 1.000,00 × 1,05 = **1.050,00 €**.
- **Capitalización mensual:** cada mes se aplica la doceava parte del tipo anual (5 ÷ 12 = 0,4167 % mensual) al capital ya crecido → **1.051,16 €**.

La diferencia es de **1,16 €** en un año. Pequeña, pero siempre a favor de capitalizar más seguido.

> [!info] Ampliación fuera de los apuntes
> Los apuntes dicen que mensual da "algo más" sin dar la cifra. Las cifras de arriba son cuentas mías con la fórmula de abajo.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> Los apuntes no traen esta fórmula, solo la idea.

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- $C$: capital inicial; $i$: tipo anual en tanto por uno (0,05).
- $m$: veces al año que se capitaliza (1 anual, 12 mensual).
- $t$: años.

Con $m = 1$ es la fórmula de [[interes-compuesto]].

## El error típico

> [!info] Ampliación fuera de los apuntes
> Confundir "5 % anual capitalizado cada mes" con "5 % mensual". Lo primero da 1.051,16 € en un año; lo segundo daría 1.000,00 × 1,05¹² = 1.795,86 €. Se aplica la doceava parte del tipo anual, no el tipo entero cada mes.

## Practícalo

→ **[Interés simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-vs-compuesto.html)**

Cambia la opción B de "una vez al año" a "cada mes" y mira cuánto mueve el resultado, y si basta para cambiar el veredicto con un plazo corto. Debería sorprender lo poco que mueve frente al plazo o al tipo.

## Relacionados

- [[interes-compuesto]] — el mecanismo de fondo
- [[tipo-de-interes]] — el tipo anual del que se toma la parte de cada periodo

## Historial

- **02-01-01** · primera vez
