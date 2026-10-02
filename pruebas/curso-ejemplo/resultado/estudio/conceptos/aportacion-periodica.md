---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: [aportaciones periódicas, aportación regular]
tags: [ahorro, interes]
ejercicio: 02-02-01-horizonte-y-aportacion
---
# Aportación periódica

> **En una frase:** una aportación periódica es una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.

## El problema

Casi nadie tiene un montón de dinero para ahorrar de una vez. Lo que sí se puede es apartar una cantidad pequeña y regular. La pregunta es cuánto acaba siendo eso a la larga, y qué pasa si además ese dinero gana interés.

## El ejemplo

Con 2.400,00 € al año de aportación (la [[tasa-de-ahorro]] hecha cifra: 200,00 € al mes × 12), ingresados al final de cada año, al 5 % anual de [[interes-compuesto]], durante 3 años:

| Año | Cuenta | Total |
|---|---|---|
| 1 | 2.400,00 | **2.400,00 €** |
| 2 | 2.400,00 × 1,05 + 2.400,00 | **4.920,00 €** |
| 3 | 4.920,00 × 1,05 + 2.400,00 | **7.566,00 €** |

Has aportado 3 × 2.400,00 € = 7.200,00 €. Los otros **366,00 €** son intereses: cada aportación genera intereses desde que entra, y esos intereses generan más.

Lo importante es que sea regular: el mismo importe, con el mismo periodo.

## La fórmula

El curso solo da el cálculo año a año de arriba, no una fórmula.

> [!info] Ampliación fuera de los apuntes
> Hacer la cuenta año a año a 30 años es largo; hay un atajo, que da lo mismo que el cálculo año a año (comprobado con el ejemplo de 3 años: 7.566,00 €). Con $A$ la aportación al final de cada año, $i$ el interés anual en tanto por uno y $n$ los años:
>
> $$ \text{total} = A \times \frac{(1+i)^n - 1}{i} $$
>
> Con 2.400,00 € al año, $i = 0{,}05$ anual y $n = 3$: 2.400,00 × 3,1525 = **7.566,00 €**. Supone que cada aportación entra al final del año.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que el total es lo aportado más el interés de un solo año. Cada aportación lleva un número distinto de años ganando intereses: la del año 1 gana dos años, la del año 3 no gana ninguno. Por eso los 366,00 € no salen de 7.200,00 € × 5 % anual.

## Practícalo

→ **[Horizonte y aportación](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-horizonte-y-aportacion.md)**

Compara qué pasa con el total al mover los años y la aportación a la vez, aportando en conjunto lo mismo.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Una aportación "fija" choca con meses de 1.300,00 € de facturación. El curso no dice qué hacer. **TODO:** preguntar si se debe calcular la aportación con el [[ingreso-medio]] y pagarla de forma regular desde el [[colchon-financiero]] ya cubierto, o aportar solo los meses buenos.

## Relacionados

- [[tasa-de-ahorro]] — de ahí sale la cifra que se aporta
- [[interes-compuesto]] — lo que hace crecer cada aportación (nota de la clase 2.1)
- [[horizonte-temporal]] — cuántos años se aporta

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
