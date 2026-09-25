---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple, capital-y-tipo-de-interes]
alias: [interés compuesto, interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también.

## El problema

Con [[interes-simple]] los intereses cobrados se quedan parados. Si en cambio se vuelven a poner a trabajar, el
dinero crece más. Hace falta una cuenta que lo recoja.

## El ejemplo

El mismo caso: **1.000,00 €** al 5 % anual, 3 años, pero cada año los intereses se suman al capital.

| Año | Interés del año | Capital acumulado | Simple, para comparar |
|---|---|---|---|
| 1 | 50,00 € | 1.050,00 € | 1.050,00 € |
| 2 | 52,50 € (5 % anual de 1.050,00 €) | 1.102,50 € | 1.100,00 € |
| 3 | 55,13 € (5 % anual de 1.102,50 €) | 1.157,63 € | 1.150,00 € |

Diferencia a 3 años: 1.157,63 − 1.150,00 = **7,63 €**. Parece poco, pero crece cada vez más rápido con los años.

## El nombre

**Interés compuesto**, o «interés sobre interés». Crece **cada vez más rápido**; el simple, en línea recta.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno y `n` el número de periodos de capitalización (si `i` es
anual, `n` en años). Cuenta del ejemplo: 1.000 × 1,05³ = 1.000 × 1,157625 = **1.157,63 €**.

## El error típico

Creer que compuesto gana ya el primer periodo. Al final del **primer** periodo simple y compuesto dan exactamente
lo mismo; la ventaja aparece desde el segundo.

> [!info] Ampliación fuera de los apuntes
> Es un tropiezo probable, no algo que digan los apuntes. Sale de comparar la tabla: año 1, 1.050,00 € en las dos.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve capital, tipo y años. Lo que debería sorprender: cuántos más años, más se separan las dos cuentas, y con 1
año no hay diferencia.

> [!tip] Visto desde tus ingresos irregulares
> La fórmula supone que no tocas el capital. Si en un mes flojo sacas dinero, el capital baja y los intereses de
> los periodos siguientes se calculan sobre menos: el compuesto premia justo lo contrario, dejar el dinero quieto.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cuántas veces al año se suman los intereses
- [[regla-del-72]] — cuánto tarda en doblarse un capital así
- [[inflacion]] — lo que crece el dinero no sirve si los precios suben más

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
