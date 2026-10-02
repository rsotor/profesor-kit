---
tipo: concepto
bloques: ["2.2 Ahorro a largo plazo"]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: []
tags: [ahorro, interes]
ejercicio: 02-02-01-empezar-antes-o-aportar-mas
---
# Aportación periódica

> **En una frase:** Una aportación periódica es una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.

## El problema

Casi nadie tiene un montón de dinero para ahorrar de una vez. Lo normal es apartar un poco cada mes. Y entonces hace falta saber cuánto llegará a ser ese goteo con los años, sobre todo si el dinero genera intereses.

## El ejemplo

Con unos ingresos de 2.000,00 € al mes y una tasa de ahorro de 10 (10 € de cada 100 € ingresados), ahorras 200,00 € al mes: **2.400,00 € al año**. Esa cifra, repetida con el mismo importe y el mismo periodo, es la aportación periódica.

Ahora la pones al **final de cada año** a un interés de 5 % anual compuesto, durante 3 años:

| Año | Cuenta |
|---|---|
| 1 | 2.400,00 € |
| 2 | 2.400,00 € × 1,05 + 2.400,00 € = 4.920,00 € |
| 3 | 4.920,00 € × 1,05 + 2.400,00 € = **7.566,00 €** |

Has aportado 7.200,00 € (3 × 2.400,00 €); los otros **366,00 €** son intereses. La primera aportación genera intereses dos años, la segunda uno, la tercera ninguno (entra al final).

## La fórmula

$$ S_n = S_{n-1} \cdot (1 + i) + A $$

$A$ es la aportación de cada periodo, $i$ el tipo de interés de **ese mismo periodo** (anual si aportas cada año) y $S_n$ lo acumulado tras $n$ periodos. Cada año: lo que había crece con el interés y se suma la aportación nueva.

## El error típico

Dos, y los dos piden el periodo:

> [!info] Ampliación fuera de los apuntes
> Mezclar periodos: aportar cada mes y usar un tipo de interés anual sin convertirlo. La aportación y el interés tienen que hablar del mismo periodo. En esta nota todo es anual, aportaciones incluidas, que van al final de cada año; si la aportación cae al principio, la cifra sube un poco.

> [!info] Ampliación fuera de los apuntes
> Contar la tasa de ahorro como si fuera un interés: la tasa de ahorro (10 de cada 100 € ingresados) dice cuánto apartas; el interés (5 % anual) dice cuánto crece lo apartado. Ver [[tasa-de-ahorro]].

## Practícalo

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes-o-aportar-mas.html)**

Compara dos planes y mueve la aportación anual: aportar el doble no siempre compensa haber empezado diez años después.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Una aportación "fija" cuesta lo mismo en un mes de 2.400,00 € que en uno de 1.300,00 €, y en el mes flojo puede hacerla imposible. Si la cifra regular que eliges es la que cabe en tus meses flojos, la puedes mantener siempre; la de un mes bueno te obligará a saltarte meses. **TODO:** el material no dice cómo adaptar la aportación a ingresos irregulares (aportar una cifra mínima fija y el resto cuando se pueda, o un porcentaje de lo facturado): decidir con el alumno.

## Relacionados

- [[tasa-de-ahorro]] — de donde sale el importe que se aporta
- [[interes-compuesto]] — lo que hace crecer cada aportación (clase 2.1)
- [[horizonte-temporal]] — cuántos periodos se repite la aportación
- [[colchon-financiero]] — el primer destino de lo que se aparta, antes de ahorrar a largo plazo

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
