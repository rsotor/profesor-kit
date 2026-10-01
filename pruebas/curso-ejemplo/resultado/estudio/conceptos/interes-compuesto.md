---
tipo: concepto
bloques: [2.1]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-simple, tipo-de-interes]
alias: [interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto los intereses de cada periodo se suman al capital y a partir de ahí generan intereses ellos también, así que el dinero crece cada vez más rápido.

Repaso de lo previo: en el [[interes-simple]] los intereses se calculan siempre sobre el capital inicial (`I = C · i · t`) y no se reinvierten.

## El problema

Con interés simple, los intereses cobrados se quedan parados. Si en cambio se dejan dentro y trabajan también, el resultado es distinto. ¿Cuánto distinto?

## El ejemplo

Los mismos 1.000,00 € a un 5 % anual, 3 años, ahora compuesto.

| Año | Capital al empezar | Interés del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del simple, hay **7,63 € más**. A 3 años parece poco, pero la diferencia crece cada vez más rápido cuantos más periodos pasan.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

- `C`: capital inicial.
- `i`: tipo de interés por periodo, en tanto por uno.
- `n`: número de periodos de capitalización (si `i` es anual, `n` en años).

Con las cifras del ejemplo: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

## El error típico

Pensar que "un poco más" a 3 años seguirá siendo "un poco más" a 30. El simple crece en línea recta; el compuesto, cada vez más empinado. Es justo lo que se confundió en el test inicial (simple frente a compuesto).

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Prueba a cambiar el capital: la respuesta del reto no se mueve. Cambia el tipo o los años y sí.

## Visto desde tus ingresos irregulares

Cuando un mes factures de más y lo apartes, ese dinero empieza a generar intereses desde ese mes. Cuanto antes entra, más periodos trabaja; un ahorro irregular se compone aportación a aportación, cada una desde su fecha.

## Relacionados

- [[interes-simple]] — la versión sin reinversión
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuándo se dobla
- [[inflacion]] — lo que el dinero pierde con el tiempo; el compuesto juega a favor o en contra según el lado

## Historial

- **02-01-01** · primera vez
