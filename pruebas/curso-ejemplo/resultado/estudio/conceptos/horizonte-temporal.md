---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-02-01]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto]
alias: [horizonte, plazo de ahorro]
tags: [ahorro, interes]
ejercicio: 02-02-01-empezar-antes
---
# Horizonte temporal

> **En una frase:** El horizonte temporal es el tiempo que el dinero va a estar ahorrado antes de usarlo; con interés compuesto, es lo que más pesa.

## El problema

Dos personas ahorran lo mismo cada año y al mismo tipo de interés, y acaban con cifras muy distintas. La
diferencia no está en cuánto ahorran, sino en cuántos años lo dejan trabajar.

## El ejemplo

Ahorras 2.400,00 € al final de cada año, al 5 % anual compuesto:

| Años | Aportado | Intereses | Saldo final |
|---|---|---|---|
| 3 | 7.200,00 € | 366,00 € | 7.566,00 € |
| 30 | 72.000,00 € | ≈ 87.453,23 € | ≈ 159.453,23 € |

Con diez veces más años, aportas diez veces más (72.000,00 €), pero el saldo es unas veinte veces mayor. En 30
años, **más de la mitad del saldo son intereses**.

## La fórmula

$$ saldo_{n} = a \times \frac{(1 + i)^{n} - 1}{i} $$

> [!info] Ampliación fuera de los apuntes
> El material solo da el resultado a 30 años. Esta fórmula es la suma de todas las aportaciones del año a año
> de [[aportacion-periodica]], y reproduce las dos cifras: con $a$ = 2.400,00 €, $i$ = 0,05 y $n$ = 30, sale
> 159.453,23 €. Supone aportaciones al final de cada año; el material no lo dice.

## ¿Empezar antes pesa más que aportar más?

⚠️ **FALTA INFO:** la diapositiva 5 afirma que "empezar antes pesa más que aportar un poco más", pero el
material no trae ninguna comparación numérica que lo respalde. Solo lo resuelve el profesor del curso.

> [!info] Ampliación fuera de los apuntes
> Comparación propia, al 5 % anual y con aportaciones al final de cada año: 2.400,00 € al año durante 30 años
> dan 159.453,23 €; subir la aportación a 3.600,00 € al año pero solo 20 años da 119.037,43 €. Incluso aportar la
> mitad (1.200,00 € al año) durante 30 años (79.726,62 €) supera a aportar 2.400,00 € durante 20 (79.358,29 €).
> No es una regla: con un tipo de interés bajo y muchos años, aportar más puede ganar (el ejercicio lo enseña).

## El error típico

> [!info] Ampliación fuera de los apuntes
> Pensar que 30 años es "diez veces" más que 3. No es lineal: el saldo crece cada vez más rápido porque los
> intereses de los últimos años se calculan sobre un saldo ya grande.

## Practícalo

→ **[Más años o más aportación](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes.html)**

Mueve los años y el tipo de interés anual, y mira cuándo gana añadir diez años y cuándo subir la aportación.

## Relacionados

- [[aportacion-periodica]] — lo que se suma cada año durante el horizonte
- [[interes-compuesto]] — la razón por la que el tiempo pesa tanto
- [[tasa-de-ahorro]] — fija cuánto se aporta
- [[colchon-financiero]] — dinero a corto plazo, sin horizonte largo: no se invierte a 30 años

## Historial

- **02-02-01** · primera vez
