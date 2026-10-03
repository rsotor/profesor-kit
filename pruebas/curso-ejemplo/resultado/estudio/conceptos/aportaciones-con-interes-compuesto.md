---
tipo: concepto
bloques: [02-02]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto]
alias: []
tags: [ahorro, interes]
---
# Aportaciones con interés compuesto

> **En una frase:** si cada aportación periódica se deposita a interés compuesto, cada una genera intereses desde que entra, y esos intereses generan a su vez intereses.

> **Para refrescar [[interes-compuesto]]:** los intereses de cada año se suman al capital y desde ahí generan intereses. 1.000,00 € al 5 % anual durante 3 años: 1.000,00 × 1,05³ = 1.157,63 €.

## El problema

Con una aportación periódica no tienes un solo capital que crece, sino uno nuevo cada año. Sumar 2.400,00 € × años da lo aportado, pero no lo que de verdad tendrás: faltan los intereses de cada aportación, cada una con una edad distinta.

## El ejemplo

2.400,00 € al final de cada año, al 5 % anual compuesto, durante 3 años.

| Año | Cuenta |
|---|---|
| 1 | 2.400,00 € |
| 2 | 2.400,00 × 1,05 + 2.400,00 = **4.920,00 €** |
| 3 | 4.920,00 × 1,05 + 2.400,00 = **7.566,00 €** |

Aportado: 3 × 2.400,00 = 7.200,00 €. Intereses: 7.566,00 − 7.200,00 = **366,00 €**.

## La fórmula

$$ S_n = S_{n-1} \times (1 + r) + A $$

- $S_n$ es lo que hay al final del año $n$, $S_{n-1}$ lo del año anterior, $A$ la aportación del año y $r$ el interés anual en decimal (5 % anual: $r = 0{,}05$).
- Cada año: lo que había crece un 5 % anual y entra la aportación nueva (al final del año, así que esa no genera intereses todavía).

> [!info] Ampliación fuera de los apuntes
> La misma cuenta en un solo paso: $S_n = A \times \dfrac{(1 + r)^n - 1}{r}$. Con $A$ = 2.400,00 €, $r = 0{,}05$ y $n = 30$ da 159.453,23 €, igual que ir año a año.

## El error típico

Calcular lo aportado y olvidar que la primera aportación lleva trabajando todos los años: en la tabla, los 2.400,00 € del año 1 son los que más intereses dan. Quien suma "2.400,00 × 3" se queda en 7.200,00 € y pierde 366,00 €.

## Relacionados

- [[aportacion-periodica]] — el importe que se añade cada periodo
- [[interes-compuesto]] — el mecanismo de intereses sobre intereses
- [[horizonte-temporal]] — cuánto pesa el número de años

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
