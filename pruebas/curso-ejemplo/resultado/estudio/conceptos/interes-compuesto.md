---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: [interes-sobre-interes]
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** Los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con [[interes-simple]] los intereses cobrados se quedan quietos: no trabajan. Si los sumas al capital, el periodo siguiente ya cobras sobre más dinero, y así cada vez.

## El ejemplo

**1.000,00 €** al **5 % anual**, **3 años**, reinvirtiendo los intereses.

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del interés simple: **7,63 € más**. A 3 años parece poco, pero la diferencia crece cada vez más rápido cuantos más periodos pasan (es la parte que sorprende la primera vez).

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

- `C`: capital inicial. `i`: tipo en tanto por uno.
- `n`: número de periodos de capitalización (si `i` es anual, `n` en años).

Comprobación: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que "compuesto" es lo mismo que "simple pero un poco más". El primer periodo da igual con los dos; la diferencia nace después y se dispara con el tiempo. Con 1.000,00 € al 5 % anual, a 30 años: 2.500,00 € con simple frente a 4.321,94 € con compuesto.

## Visto desde tus ingresos irregulares

Un mes bueno que apartas y **no tocas** es capital que empieza a componer ya. Y el dinero del colchón ([[colchon-financiero]]) tiene que estar líquido ([[liquidez]]): ahí manda tenerlo disponible, no el interés.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde aquí: mueve los años y busca cuándo la ventaja del compuesto deja de ser pequeña.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cuántas veces al año se suman los intereses
- [[regla-del-72]] — cuánto tarda en doblarse un capital que compone

## Historial

- **02-01-01** · primera vez
