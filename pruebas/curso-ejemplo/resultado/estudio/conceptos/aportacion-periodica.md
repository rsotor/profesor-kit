---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [tasa-de-ahorro, interes-compuesto]
alias: []
tags: []
---
# Aportación periódica

> **En una frase:** Una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez; lo importante es que sea el mismo importe con el mismo periodo.

## El problema

Esperar a juntar una cantidad grande para ahorrarla de golpe casi nunca pasa. Y la [[tasa-de-ahorro]] sola es un porcentaje: no dice qué haces con el dinero ni cuándo.

## El ejemplo

> **Supuesto:** la aportación entra **al final de cada año** y el [[tipo-de-interes]] es del 5 % anual, compuesto.

Aportas 2.400,00 € al final de cada año durante 3 años:

| Año | Cuenta | Total |
|---|---|---|
| 1 | 2.400,00 € | 2.400,00 € |
| 2 | 2.400,00 € × 1,05 + 2.400,00 € | 4.920,00 € |
| 3 | 4.920,00 € × 1,05 + 2.400,00 € | 7.566,00 € |

Has aportado 3 × 2.400,00 € = 7.200,00 €. Los otros **366,00 €** son intereses. Cada aportación gana [[interes-compuesto|interés compuesto]] desde que entra, y esos intereses ganan a su vez intereses.

## La fórmula

$$ \text{saldo}_{n} = \text{saldo}_{n-1} \times (1 + r) + A $$

Cada año, lo que ya tienes se multiplica por $(1+r)$ (con $r$ la tasa del año, 5 % anual = 0,05) y se suma la nueva aportación $A$. Con aportación al final de año, la del último año todavía no ha ganado nada.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Confundir la aportación con el total ahorrado: 2.400,00 € al año durante 3 años no son 7.566,00 € "aportados", son 7.200,00 € aportados y 366,00 € que ha puesto el interés.

## Visto desde tus ingresos irregulares

"El mismo importe con el mismo periodo" choca con facturar unos meses más que otros. Dos formas de llevarlo: fijar la aportación sobre tu ingreso medio y apartar lo mismo cada mes, o aportar un porcentaje de lo que cobres. Lo segundo no es una aportación periódica en sentido estricto (el importe cambia).

**TODO:** la clase no dice cómo se trata una aportación que varía; decidir con el alumno si se amplía.

## Relacionados

- [[tasa-de-ahorro]] — de ella sale la cifra que se aporta
- [[interes-compuesto]] — hace que cada aportación crezca por su cuenta
- [[horizonte-temporal]] — cuántos años se mantiene la aportación
- [[capital]] — lo que ya hay ahorrado

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
