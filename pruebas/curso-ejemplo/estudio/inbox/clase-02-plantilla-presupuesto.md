# Clase 1.2 · Plantilla de presupuesto (hoja de cálculo exportada)

> El profesor compartió esta hoja de cálculo por email después de la clase, con el mismo ejemplo "ya
> montado" para que cada uno la copie con sus propias cifras. Se exporta aquí la hoja tal cual, celda a
> celda con su fórmula, tal como venía en el `.xlsx` (columna "Fórmula" = lo que había en la celda).

## Hoja "Gastos fijos"

| Celda | Concepto | Valor mostrado | Fórmula |
|---|---|---|---|
| B2 | Alquiler | 650,00 € | (número suelto) |
| B3 | Seguro | 40,00 € | (número suelto) |
| B4 | Suscripciones | 52,00 € | (número suelto) |
| B5 | **Total fijos** | **715,00 €** | `=B2+B3+25` |

## Hoja "Gastos variables"

| Celda | Concepto | Valor mostrado | Fórmula |
|---|---|---|---|
| B2 | Comida | 300,00 € | (número suelto) |
| B3 | Transporte | 60,00 € | (número suelto) |
| B4 | Ocio | 120,00 € | (número suelto) |
| B5 | **Total variables** | **480,00 €** | `=SUMA(B2:B4)` |

## Hoja "Resumen"

| Celda | Concepto | Valor mostrado | Fórmula |
|---|---|---|---|
| B2 | Ingresos | 1.850,00 € | (número suelto) |
| B3 | Total gastos | 1.195,00 € | `='Gastos fijos'!B5+'Gastos variables'!B5` |
| B4 | Ahorro | 655,00 € | `=B2-B3` |
| B5 | Tasa de ahorro | 35% | `=B4/B2` |

<!-- Nota de quien exporta: en clase, el profesor subió en directo "Suscripciones" de 25,00 € a
     52,00 € (dijo que se le había olvidado una, la del gimnasio) pero se le olvidó tocar la fórmula
     de "Total fijos" — se quedó en `=B2+B3+25`, con el 25 de Suscripciones "a mano" en vez de sumar la
     celda B4 de verdad. Por eso el total sigue en 715,00 € aunque la fila de arriba ya diga 52,00 €:
     el total real de gastos fijos es 742,00 €, no 715,00 €, y eso arrastra el resto de la hoja
     "Resumen" (total gastos, ahorro y tasa de ahorro también están mal). -->
