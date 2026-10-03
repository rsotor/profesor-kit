---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: []
tags: [ahorro, interes]
---
# Aportación periódica

> **En una frase:** una aportación periódica es una cantidad fija que añades a tus ahorros cada cierto tiempo (cada mes, cada año), con el mismo importe y el mismo periodo.

## El problema

Esperar a juntar una suma grande para ahorrarla de golpe casi nunca ocurre: siempre hay algo urgente. Apartar una cantidad pequeña y regular sí se mantiene, y además deja que cada aportación empiece a generar intereses cuanto antes.

## El ejemplo

Aportas 2.400,00 € al final de cada año, con un tipo de interés del 5 % anual compuesto, durante 3 años. Cada año, lo que ya hay crece un 5 % y se suma la aportación nueva:

| Año | Cuenta | Total |
|---|---|---|
| 1 | 2.400,00 € | 2.400,00 € |
| 2 | 2.400,00 × 1,05 + 2.400,00 | 4.920,00 € |
| 3 | 4.920,00 × 1,05 + 2.400,00 | **7.566,00 €** |

Has aportado 3 × 2.400,00 = 7.200,00 €. Los otros **366,00 €** son intereses.

## La fórmula

$$ V_n = A \times \frac{(1+i)^n - 1}{i} $$

- $A$ es la aportación de cada periodo, $i$ el tipo del periodo en tanto por uno (5 % anual = 0,05) y $n$ el número de periodos.
- Vale cuando la aportación entra **al final** de cada periodo, que es como lo cuenta la clase.
- Comprobación con los datos de arriba: 2.400,00 × (1,05³ − 1) ÷ 0,05 = 2.400,00 × 3,1525 = **7.566,00 €**.

La clase no da esta fórmula: da el cálculo año a año. La fórmula es la misma cuenta, abreviada.

> [!info] Ampliación fuera de los apuntes
> La fórmula cerrada es nuestra, para comprobar la cuenta de la clase. Si la aportación fuera mensual, $i$ y $n$ pasan a ser mensuales: ver el apartado de la sesión sobre 200,00 € al mes.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Mezclar el periodo de la aportación con el de la tasa: aportar 200,00 € al mes y aplicarle un tipo del 5 % anual sin pasarlo a mensual. Aportación y tasa tienen que hablar del mismo periodo, o la cuenta sale mal.

## Visto desde tus ingresos irregulares

Una aportación **fija** choca con ingresos que varían: un mes flojo, el importe fijo puede no salir. Dos salidas, sin que la clase diga cuál usar (**TODO:** preguntar al alumno cuál prefiere): fijarla sobre el ingreso medio, no sobre el del mejor mes, y cubrir los meses flojos con el [[colchon-financiero]] para no saltarte ninguna; o aportar de golpe en los meses buenos, cuidando que la suma anual sea la misma.

## Relacionados

- [[tasa-de-ahorro]] — de la tasa a la cifra que se aporta
- [[interes-compuesto]] — por qué cada aportación crece por su cuenta
- [[horizonte-temporal]] — cuántos años se mantiene la aportación
- [[colchon-financiero]] — lo que protege la aportación de un mes flojo

## Historial

- **02-02-01** · primera vez
