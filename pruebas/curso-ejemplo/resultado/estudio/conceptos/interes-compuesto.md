---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple, tipo-de-interes]
alias: [interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-interes-simple-vs-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto los intereses de cada periodo se suman al capital y, desde ahí, generan intereses ellos también ("interés sobre interés").

## El problema

El interés simple deja los intereses quietos: ganan 0 mientras esperan. Con el compuesto se reinvierten, y el dinero crece cada vez más deprisa. Es lo que el alumno confundió con el simple en el test inicial (pregunta 4).

## El ejemplo

Los mismos 1.000,00 € al 5 % anual, 3 años, ahora compuesto:

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Con el simple eran 1.150,00 €. Diferencia: **7,63 €**. Poco a 3 años, pero la ventaja crece cada vez más deprisa cuanto más pasa el tiempo.

> [!info] Ampliación fuera de los apuntes
> A 30 años, 1.000,00 € al 5 % anual son 2.500,00 € con interés simple y 4.321,94 € con compuesto.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

- $C$: capital inicial (€).
- $i$: tipo en tanto por uno por periodo (5 % anual = 0,05).
- $n$: número de periodos (con tipo anual, años).

Aquí: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**. El 1,157625 es el factor por el que se multiplica el capital en 3 años.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Pensar que el compuesto "gana más" con cualquier tipo y plazo. Gana más **con el mismo tipo**. Un compuesto con tipo bajo puede perder durante muchos años frente a un simple con tipo alto: el ejercicio lo enseña.

## Practícalo

→ **[Interés simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-vs-compuesto.html)**

Compara el compuesto con otro simple y mueve el plazo y el tipo, y también cuándo se capitaliza. Debería sorprender cuánto tarda en notarse la ventaja del interés sobre interés.

## Visto desde tus ingresos irregulares

El efecto solo funciona si los intereses **se quedan dentro**. Si en un mes flojo retiras los intereses para llegar a fin de mes, ese capital deja de reinvertirse y, de ahí en adelante, estás cobrando como en el interés simple. El colchón (ver [[colchon-financiero]]) está para que no tengas que tocarlos.

## Relacionados

- [[interes-simple]] — el caso en que los intereses no se reinvierten
- [[capitalizacion]] — cuántas veces al año se suman los intereses al capital
- [[regla-del-72]] — cuántos años tarda en doblarse un capital así, a ojo
- [[tipo-de-interes]] — con su periodo siempre
- [[inflacion]] — contra lo que hay que comparar el crecimiento
- [[aportacion-periodica]] — qué pasa si, además, vas sumando dinero (clase siguiente)
- [[horizonte-temporal]] — cuánto tiempo se deja trabajar al dinero (clase siguiente)

## Historial

- **02-01-01** · primera vez
