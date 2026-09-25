---
tipo: sesion
bloque: modulo-01
clases: [1.2]
trabajada: 2026-09-25
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01-presupuesto-personal · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale cada mes, separar gastos fijos y variables, medir qué parte de lo que ganas
te queda y tener un colchón antes de ahorrar para otra cosa. Materiales: los apuntes
(`clase-02-presupuesto-personal.md`) y la hoja de cálculo exportada (`clase-02-plantilla-presupuesto.md`), que son
la misma clase.

## Conceptos

- [[presupuesto-personal]] — **nuevo**
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; con ingresos irregulares, se usa la media de 6-12 meses, no el mejor mes.
2. Fijo es lo que no decides cada mes; variable, lo que sí. Que gastes algo siempre no lo hace fijo.
3. La tasa de ahorro compara personas distintas, y el colchón (meses de gastos cubiertos) es el primer objetivo.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]] — lleva ejercicio el colchón (con el presupuesto): el veredicto se invierte al mover ingresos, meses o colchón. Fijos/variables y tasa de ahorro no lo llevan.

## Cobertura del material

| Sección | Destino |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diapositiva 2 · Ingresos irregulares | [[presupuesto-personal]] |
| Diapositiva 3 · Gastos fijos y variables | [[gastos-fijos-y-variables]] |
| Diapositiva 4 · Ejemplo trabajado | [[gastos-fijos-y-variables]] (tabla) y [[presupuesto-personal]] (ahorro) |
| Diapositiva 5 · La tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · El colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | Recogido en "Lo que hay que llevarse" |
| Hoja "Gastos fijos" | [[gastos-fijos-y-variables]] y Auditoría (total mal calculado) |
| Hoja "Gastos variables" | [[gastos-fijos-y-variables]]; cuadra con la diapositiva 4 |
| Hoja "Resumen" | [[presupuesto-personal]] y [[tasa-de-ahorro]]; arrastra el error de la hoja de fijos, ver Auditoría |

## Auditoría del material

*Control de calidad del material, no contenido del curso.*

- **Fórmula rota en la hoja "Gastos fijos".** La celda B5 (Total fijos) es `=B2+B3+25`: el 25 de
  Suscripciones va escrito a mano y no lee la celda B4, que ahora vale 52,00 €. La celda muestra 715,00 €; sumando
  B2, B3 y B4 de verdad, son **742,00 €** (650,00 + 40,00 + 52,00). Diferencia: 27,00 €.
- **Lo que arrastra en "Resumen".** Total gastos: 1.195,00 € en la hoja frente a **1.222,00 €** real (742,00 +
  480,00). Ahorro: 655,00 € frente a **628,00 €**. Tasa de ahorro: 35,4 % mensual (la hoja muestra 35 % mensual) frente a
  **33,9 % mensual** real. Es 1,5 puntos de tasa. El colchón de 3 meses de la diapositiva 6 pasaría de 3.585,00 €
  a 3.666,00 € (3 × 1.222,00 €).
- **Apuntes y hoja no coinciden.** La diapositiva 4 pone Suscripciones en 25,00 € (con total 715,00 €); la hoja
  tiene 52,00 €. Según la nota de quien exportó la hoja, se cambió en directo (una suscripción olvidada) y no se
  tocó el total. Esa explicación no está en los apuntes, así que no se da por confirmada.
- **Qué se ha usado en las notas.** Las cifras de la diapositiva 4 (25,00 € / 715,00 € / 1.195,00 €), porque son las
  que dan cuadre entre sí; la tasa corregida solo aparece como aviso en [[tasa-de-ahorro]].
- **Comprobado y cuadra:** variables (300,00 + 60,00 + 120,00 = 480,00 €), 1.850,00 − 1.195,00 = 655,00 €,
  655 ÷ 1.850 × 100 ≈ 35,4 % mensual, 3 × 1.195,00 € = 3.585,00 €. Todo internamente correcto con la cifra de 25,00 €.
- Ninguna instrucción rara en el material. Sin auditorías previas de la 1.2; la 1.1 tenía otras cosas (ver
  auditoría del material).

## Para pensarlo despacio

1. Un mes facturas mucho más que la media. ¿Qué haces con la diferencia, y en qué cambia tu presupuesto del mes
   siguiente si lo tratas como ingreso normal o como colchón?
2. Una suscripción que usas de vez en cuando, ¿es un gasto fijo o variable? Razona qué parte decides tú cada mes.
3. Dos meses seguidos con la tasa de ahorro en cero: ¿es una emergencia o encaja en un mes flojo para alguien
   que factura irregular? Qué dato te haría cambiar de opinión.
4. La hoja tenía un total escrito "a mano" dentro de una fórmula. ¿Qué te enseña esto de cómo montar tu propia hoja
   de presupuesto?

## Pendiente

- ⚠️ **FALTA INFO:** cuánto vale realmente "Suscripciones": 25,00 € (diapositiva 4) o 52,00 € (hoja). La nota del
  export dice que se cambió en directo, pero el material de la clase no lo confirma. Lo resuelve el alumno o el centro.
- **TODO:** cuando se sepa la cifra, actualizar el ejemplo (totales, ahorro, tasa y colchón) en [[gastos-fijos-y-variables]],
  [[presupuesto-personal]], [[tasa-de-ahorro]] y [[colchon-financiero]].

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
