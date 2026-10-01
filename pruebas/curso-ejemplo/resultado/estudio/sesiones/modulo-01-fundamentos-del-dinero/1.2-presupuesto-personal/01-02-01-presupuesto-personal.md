---
tipo: sesion
bloque: modulo-01
clases: [1.2]
trabajada: 2026-10-01
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01 · Presupuesto personal

## En una frase

Cómo llevar las cuentas del mes: ingresos menos gastos, gastos fijos frente a variables, qué parte de lo que ganas
te queda (tasa de ahorro) y cuántos meses de gastos conviene tener guardados (colchón).

## Conceptos

- [[presupuesto]] — **nuevo** (incluye el ingreso medio para ingresos irregulares)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; con ingresos irregulares se usa el ingreso medio de 6-12 meses.
2. Fijo es lo que no decides cada mes; variable, lo que sí. El ocio es variable.
3. La tasa de ahorro permite comparar; el colchón (3 meses, 5-6 si eres freelance) va antes que otros ahorros.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]] (colchón financiero). **TODO** (sigue abierto, para el presupuesto): decidir con el alumno si quiere un ejercicio donde cambie el ingreso de un mes (¿a partir de qué ingreso el ahorro se vuelve negativo?).

## Cobertura del material

| Sección | Destino |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto]] |
| Diapositiva 2 · Ingresos irregulares | [[presupuesto]] (ingreso medio) |
| Diapositiva 3 · Fijos y variables | [[gastos-fijos-y-variables]] |
| Diapositiva 4 · Ejemplo trabajado | [[gastos-fijos-y-variables]] y [[presupuesto]]; con la cifra de la diapositiva (ver Auditoría) |
| Diapositiva 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · Colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | Repite 1-6; va en "Lo que hay que llevarse" |
| Hoja «Gastos fijos» | Auditoría (fórmula de B5 mal) |
| Hoja «Gastos variables» | Auditoría: cuadra (480,00 €) |
| Hoja «Resumen» | Auditoría: arrastra el error de «Gastos fijos» |

## Auditoría del material

*Control de calidad del material, no contenido del curso.*

- **La hoja no cuadra con las diapositivas.** En «Gastos fijos», B4 (Suscripciones) vale 52,00 €, pero la
  diapositiva 4 dice 25,00 €. Además B5 es `=B2+B3+25`: lleva el 25 escrito a mano en vez de sumar B4, así que el
  total no se mueve aunque cambie la celda.
- **Cuantificado.** Total de fijos mostrado 715,00 €; con B4 = 52,00 €, 742,00 € (+27,00 €). Total de gastos:
  1.195,00 € frente a 1.222,00 €. Ahorro: 655,00 € frente a 628,00 €. Tasa de ahorro: 35,4 frente a 33,9 de cada
  100,00 € (628 ÷ 1.850 × 100 = 33,95), y la hoja muestra "35" por redondeo. Colchón de 3 meses: 3.585,00 € frente a 3.666,00 €.
- **Qué se ha hecho.** En las notas se usa la cifra de las diapositivas (25,00 €), que es la coherente con todos
  sus totales. No se sabe cuál es la cifra buena: ver FALTA INFO.
- **La causa** viene en un comentario del export (de quien lo exportó, no del profesor): se subió Suscripciones de
  25,00 € a 52,00 € en directo y no se tocó la fórmula. No se ha podido verificar con el `.xlsx` original.
- «Gastos variables» sí cuadra: `=SUMA(B2:B4)` = 480,00 €.
- Formato: la hoja da la tasa de ahorro como "35" por cada 100,00 €, con formato de porcentaje y sin decimales y las diapositivas dan cifras como 2.400 € sin
  decimales; en las notas, a dos decimales y sin porcentaje suelto.
- Primera clase con hoja de cálculo; la 1.1 tuvo otros fallos (diapositivas vacías, instrucciones al asistente),
  no repetidos aquí.

## Para pensarlo despacio

1. Tu mejor mes es de 2.400,00 € y el peor de 1.300,00 €, con 1.195,00 € de gastos. ¿Con qué cifra de ingresos presupuestarías y por qué?
2. ¿Por qué el ocio es variable aunque gastes algo todos los meses? ¿Qué pasaría con tu margen si fuera fijo?
3. Dos personas ahorran 400,00 € al mes. ¿Qué te falta saber para decir quién ahorra mejor?
4. ¿Por qué el colchón se mide en meses de gastos y no en euros sueltos?

## Pendiente

- ⚠️ **FALTA INFO:** cifra correcta de Suscripciones (25,00 € de la diapositiva 4 o 52,00 € de la hoja). Solo lo resuelve el profesor o el centro; de ella dependen total de gastos, ahorro, tasa de ahorro y colchón del ejemplo.
- **TODO:** preguntar al alumno si quiere un ejercicio sobre el ingreso de un mes flojo.

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
