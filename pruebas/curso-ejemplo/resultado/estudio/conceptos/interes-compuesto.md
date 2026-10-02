---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01, 02-02-01]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-simple-contra-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto, los intereses de cada periodo se suman al capital y desde ahí generan intereses ellos también, así que el dinero crece cada vez más rápido.

## El problema

Con [[interes-simple]] los intereses se quedan quietos. Pero si los dejas dentro, trabajan: ahí está la
diferencia entre ahorrar y hacer crecer lo ahorrado.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual, 3 años, ahora compuesto:

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del simple: **7,63 € de más**. Poco a 3 años, pero a 10 años el compuesto da
1.628,89 € y el simple 1.500,00 €.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`n` es el número de periodos, y `i` el tipo por uno **de ese mismo periodo** (tipo anual, `n` en años).
Aquí: 1.000 × 1,05³ = 1.000 × 1,157625 = **1.157,63 €**.

## Con aportaciones periódicas

> [!quote] De la clase 02-02-01 (Ahorro a largo plazo)
> Aplicado a [[aportacion-periodica]], cada aportación genera intereses desde el momento en que entra, y esos
> intereses generan a su vez intereses. Ejemplo: 2.400,00 € al final de cada año, al 5 % anual, durante 3 años:
> año 1, 2.400,00 €; año 2, 2.400,00 × 1,05 + 2.400,00 = 4.920,00 €; año 3, 4.920,00 × 1,05 + 2.400,00 =
> **7.566,00 €**. Se han aportado 7.200,00 €; los otros **366,00 €** son intereses. Cuanto más tiempo
> ([[horizonte-temporal]]), más pesa el efecto.

## El error típico

Creer que, como a 3 años casi no se nota, no importa. La ventaja del compuesto crece cada vez más rápido con
el tiempo: es lo que sorprende la primera vez que se ve (y, en el test inicial, lo que se confundió con el
simple).

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Un mes flojo en el que no puedes aportar no borra lo ya acumulado: lo aportado antes sigue generando
> intereses. Retrasa solo esa aportación; no hace falta rehacer todo el plan.

## Practícalo

→ **[Simple contra compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-contra-compuesto.html)**

Con el mismo tipo el compuesto nunca pierde; con tipos distintos sí puede. Busca en cuántos años se invierte el resultado.

## Relacionados

- [[interes-simple]] — la versión sin reinversión, para comparar
- [[tipo-de-interes]] — con su periodo: es lo que decide `n`
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — años que tarda en doblarse un capital
- [[aportacion-periodica]] · [[horizonte-temporal]] — el compuesto aplicado al ahorro regular (clase 02-02-01)
- [[tasa-de-ahorro]] — de ahí sale lo que se aporta
- [[inflacion]] — lo que resta al crecimiento real

## Historial

- **02-01-01** · primera vez
- **02-02-01** · ampliado: aportaciones periódicas con interés compuesto (7.566,00 €, de los que 366,00 € son intereses), aportado por la clase 02-02-01
