---
tipo: concepto
bloques: [2.2]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: [aportaciones periódicas]
tags: [ahorro, interes]
ejercicio: 02-02-01-empezar-antes-o-aportar-mas
---
# Aportación periódica

> **En una frase:** una aportación periódica es una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.

## El problema

Casi nadie tiene un montón de dinero para ahorrar de una vez. Lo que sí se puede es apartar una cantidad
pequeña cada mes. La pregunta es: ¿en qué se convierte eso con los años, si el dinero además gana intereses?

## El ejemplo

Apartas 2.400,00 € al final de cada año (los 200,00 € al mes de tu [[tasa-de-ahorro]], juntados) y cada
euro rinde un 5 % anual compuesto. Durante 3 años:

| Año | Cuenta | Total al acabar el año |
|---|---|---|
| 1 | 2.400,00 € | 2.400,00 € |
| 2 | 2.400,00 € × 1,05 + 2.400,00 € | 4.920,00 € |
| 3 | 4.920,00 € × 1,05 + 2.400,00 € | 7.566,00 € |

Has aportado 3 × 2.400,00 € = 7.200,00 €. Los otros **366,00 €** son intereses: cada aportación genera
intereses desde que entra, y esos intereses generan a su vez intereses (es el [[interes-compuesto]]).

## La fórmula

$$ F = A \cdot \frac{(1+i)^n - 1}{i} $$

`A` es la aportación de cada periodo, `i` el tipo por periodo en tanto por uno (un 5 % anual es 0,05) y `n`
el número de periodos. Aquí las aportaciones entran **al final** de cada periodo, como en el ejemplo. Con
`A` = 2.400,00 €, `i` = 0,05 y `n` = 3: 2.400,00 € × 3,1525 = 7.566,00 €.

> [!info] Ampliación fuera de los apuntes
> La clase no da esta fórmula; es la suma de las aportaciones del ejemplo: la primera trabaja 2 años
> (2.400,00 € × 1,05² = 2.646,00 €), la segunda 1 año (2.520,00 €) y la última ninguno (2.400,00 €):
> 2.646,00 € + 2.520,00 € + 2.400,00 € = 7.566,00 €.

## El error típico

Pensar que todas las aportaciones rinden lo mismo. La primera lleva más tiempo trabajando que la última, y
por eso pesa más en los intereses. Además, "regular" significa mismo importe **y** mismo periodo:
2.400,00 € una vez al año y 200,00 € al mes suman lo mismo en euros, pero son dos calendarios distintos y la
fórmula de arriba solo sirve si `i` y `n` van en el periodo de las aportaciones.

## Practícalo

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes-o-aportar-mas.html)**

Mueve la aportación de Luis y su retraso. Lo que debería sorprender: con 10 años de retraso, subir la
aportación en 1.200,00 € (hasta 3.600,00 € al año) no basta para alcanzar a quien empezó antes con 2.400,00 € al año.

## Visto desde tus ingresos irregulares

Con facturación irregular, una aportación fija es difícil de cumplir cada mes. 

> [!info] Ampliación fuera de los apuntes
> Una opción es fijar como mínimo lo que aguantas en tus meses flojos y completar en los buenos. Es una idea
> nuestra, no de la clase, y la clase tampoco cubre cómo afecta a la fórmula una aportación que varía.

## Relacionados

- [[tasa-de-ahorro]] — de donde sale la cantidad que se aparta
- [[interes-compuesto]] — hace que cada aportación genere intereses sobre intereses
- [[horizonte-temporal]] — cuántos años se mantiene la aportación, lo que más pesa en el resultado
- [[capital]] — aquí se va formando poco a poco, en vez de partir de una cifra inicial

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
