---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [interes-simple]
alias: [interés compuesto, interés sobre interés]
tags: []
ejercicio: 02-01-01-cuando-se-dobla
---
# Interés compuesto

> **En una frase:** Con interés compuesto, los intereses de cada periodo se suman al capital y generan intereses ellos también, así que el dinero crece cada vez más deprisa.

## El problema

En el interés simple, los intereses que cobras cada año se quedan parados: no trabajan. Si los sumas al
capital, el año siguiente el interés se calcula sobre una cifra mayor.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual durante 3 años, ahora compuesto.

| Año | Capital al empezar | Interés del año | Capital al final |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Con simple eran 1.150,00 €. Diferencia: **7,63 €**. A 3 años parece poco, pero el interés del año 3
(55,13 €) ya es mayor que el del año 1 (50,00 €), y esa distancia se va abriendo cada vez más rápido.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`n` es el número de periodos de capitalización (si el tipo es anual, en años). En el ejemplo:
1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Calcular el interés de un año y multiplicarlo por `n` (eso es interés simple). También: creer que la
> ventaja es grande a plazos cortos; a 3 años son 7,63 €, y es a 30 años cuando pesa.

## Practícalo

→ **[¿Cuándo se dobla?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-cuando-se-dobla.html)**

Desde este concepto: cambia el tipo y los años y mira en qué momento el capital compuesto llega al doble,
mientras el simple aún va por detrás. Lo que debería sorprender es lo lejos que queda el simple.

## Visto desde tus ingresos irregulares

El colchón de un freelance ([[colchon-financiero]]) es dinero que se queda quieto meses. Si esos euros están
en algo que paga un tipo anual y capitaliza, crecen sin que hagas nada; si están en el cajón, no. A qué
tipo conviene dejarlo, **TODO:** el curso aún no lo ha explicado.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuándo se dobla
- [[inflacion]] — el mismo efecto acumulado, pero restando poder de compra

## Historial

- **02-01-01** · primera vez
