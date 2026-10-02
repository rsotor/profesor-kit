---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-02-01]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: [aportación periódica, aportaciones periódicas]
tags: [ahorro, interes]
---
# Aportación periódica

> **En una frase:** Una aportación periódica es una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.

## El problema

Casi nadie tiene 7.200,00 € de golpe para ahorrar. Lo normal es apartar una cantidad pequeña cada mes o cada
año. La pregunta es qué pasa con ese dinero cuando cada aportación llega en un momento distinto.

## El ejemplo

Aportas 2.400,00 € al final de cada año (una tasa de ahorro de 10 sobre 2.000,00 € al mes da 200,00 € al mes,
2.400,00 € al año), y el dinero crece al 5 % anual compuesto:

- Año 1: 2.400,00 €
- Año 2: 2.400,00 × 1,05 + 2.400,00 = **4.920,00 €**
- Año 3: 4.920,00 × 1,05 + 2.400,00 = **7.566,00 €**

Has aportado 3 × 2.400,00 = 7.200,00 €. Los otros **366,00 €** son intereses: la primera aportación trabajó
dos años, la segunda uno, y la tercera ninguno.

> [!info] Ampliación fuera de los apuntes
> El material no dice si la aportación entra al principio o al final del año. Este cálculo supone **al final**
> (la última aportación aún no ha generado interés). Si entrara al principio, saldría más.

## La fórmula

$$ saldo_{n} = saldo_{n-1} \times (1 + i) + a $$

- $saldo_{n}$: lo que tienes al final del año $n$, en €.
- $i$: el tipo de interés anual en tanto por uno (5 % anual = 0,05).
- $a$: la aportación de cada año, en €.

Primero crece lo que ya tenías; después entra la aportación nueva.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que lo que has aportado es lo que tienes. Con interés compuesto el saldo es mayor que la suma de las
> aportaciones (7.566,00 € frente a 7.200,00 €), y la diferencia crece cada año.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> La aportación periódica pide un importe fijo, y tus ingresos no lo son. Fija la aportación fija sobre tu
> ingreso medio y no sobre el mejor mes: en un mes de 1.300,00 € con gastos de 1.195,00 € solo te sobran
> 105,00 €, y una aportación de 200,00 € ese mes saldría del colchón (95,00 €). Lo que sobre en los meses buenos
> puede ir como aportación extra.

## Relacionados

- [[tasa-de-ahorro]] — de ella sale el importe que se aporta
- [[interes-compuesto]] — hace que cada aportación genere intereses sobre los intereses
- [[capital]] — cada aportación se suma al capital ahorrado
- [[tipo-de-interes]] — el tanto anual al que crece el saldo
- [[capitalizacion]] — el momento en que los intereses se suman al saldo
- [[horizonte-temporal]] — cuántos años dura la aportación
- [[presupuesto-personal]] — de donde sale lo que se aparta

## Historial

- **02-02-01** · primera vez
