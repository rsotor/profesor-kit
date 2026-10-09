---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto, tipo-de-interes, capital]
alias: []
tags: [ahorro, interes]
---
# Aportación periódica

> **En una frase:** una aportación periódica es una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.

## El problema

Tienes una tasa de ahorro ([[tasa-de-ahorro]]), pero para planificar a largo plazo "ahorro el 10 por ciento" no sirve: hace falta una **cifra** y un **ritmo**. Y si cada aportación se deja en una cuenta con interés compuesto, hay que saber cuánto habrás juntado al cabo de unos años.

## El ejemplo

**Paso 1: de la tasa a la cifra.** Ingresos de 2.000,00 € al mes y una tasa de ahorro del 10 por ciento:

- Al mes: 2.000,00 € × 0,10 = **200,00 €**.
- Al año: 200,00 € × 12 = **2.400,00 €**.

**Paso 2: la cifra con tipo de interés.** 2.400,00 € al final de cada año, al 5 % anual compuesto, durante 3 años:

| Año | Cuenta | Capital |
|---|---|---|
| 1 | 2.400,00 € | 2.400,00 € |
| 2 | 2.400,00 € × 1,05 + 2.400,00 € | 4.920,00 € |
| 3 | 4.920,00 € × 1,05 + 2.400,00 € | **7.566,00 €** |

Has aportado 3 × 2.400,00 € = 7.200,00 €. Los otros **366,00 €** son intereses: cada aportación genera los suyos desde que entra, y esos intereses generan a su vez más.

## La fórmula

$$ C_{\text{año}} = C_{\text{año anterior}} \cdot (1 + i) + A $$

- $A$: la aportación de cada año (2.400,00 €).
- $i$: el tipo de interés anual en tanto por uno (5 % anual = 0,05).
- Se repite año a año, empezando en 0,00 €. La versión cerrada, para saltar directo al año $n$, está en [[horizonte-temporal]].

## El error típico

Que "la aportación" sea lo que sobra a fin de mes. Si no es un importe fijado de antemano y con el mismo periodo, deja de ser periódica: unos meses entra y otros no, y el cálculo de arriba ya no vale.

> [!tip] Visto desde tus ingresos irregulares
> Un importe fijo cada mes es lo más difícil de cumplir con ingresos que varían. Dos ajustes, sin cambiar la idea: fijar el periodo **anual** (2.400,00 € al año, aportados cuando entre el dinero de los meses buenos, en vez de 200,00 € cada mes) o calcular la tasa de ahorro con tu ingreso medio, no con el de un mes suelto, como en [[tasa-de-ahorro]]. Lo que no cambia: lo que aportas tiene que ser un importe que puedas mantener incluso en un mal año, y el [[colchon-financiero]] va antes.

## Relacionados

- [[tasa-de-ahorro]] — de ahí sale la cifra que se aporta
- [[interes-compuesto]] — cada aportación crece por su cuenta
- [[tipo-de-interes]] — el porcentaje, siempre con su periodo
- [[capital]] — lo acumulado en cada momento
- [[horizonte-temporal]] — cuántos años dura la aportación, y lo que más pesa
- [[colchon-financiero]] — conviene tenerlo antes de empezar a aportar

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
