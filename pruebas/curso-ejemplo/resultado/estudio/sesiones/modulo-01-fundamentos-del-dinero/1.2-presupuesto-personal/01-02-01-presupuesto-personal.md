---
tipo: sesion
bloque: modulo-01
clases: [1.2 Presupuesto personal]
trabajada: 2026-10-01
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01 · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale cada mes, separar gastos fijos y variables, medir lo que te queda
(tasa de ahorro) y tener un colchón para los meses flojos.

## Conceptos

- [[presupuesto-personal]] — **nuevo**
- [[gasto-fijo-y-variable]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**
- [[liquidez]] e [[inflacion]] — no se amplían: solo se enlazan desde el colchón

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; con ingresos irregulares, se presupuesta con la media, no con el mejor mes.
2. Fijo es lo que no decides cada mes; variable, lo que sí. Que gastes algo siempre no lo hace fijo.
3. La tasa de ahorro compara personas; el colchón (5-6 meses para un freelance) va antes que ahorrar para otra cosa.

## Material

- Flashcards: [[flashcards/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/01-02-01-mes-flojo]] — ingresos, gastos y colchón se mueven; el mes se pone en negativo.

## Cobertura del material

Dos ficheros, una misma clase: los apuntes (`clase-02-presupuesto-personal.md`) y la hoja de cálculo
exportada (`clase-02-plantilla-presupuesto.md`).

| Sección | Destino |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diapositiva 2 · Ingresos irregulares | [[presupuesto-personal]] (ingreso medio) |
| Diapositiva 3 · Fijos y variables | [[gasto-fijo-y-variable]] |
| Diapositiva 4 · Ejemplo trabajado | [[gasto-fijo-y-variable]] y [[presupuesto-personal]] |
| Diapositiva 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · Colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | "Lo que hay que llevarse" |
| Hoja "Gastos fijos" | Auditoría (ver abajo) y [[gasto-fijo-y-variable]] |
| Hoja "Gastos variables" | Cuadra con la diapositiva 4: sin nota aparte |
| Hoja "Resumen" | Auditoría (ver abajo) |

## Auditoría del material

*Control de calidad del material, no contenido del curso.*

- **Fórmula con un número suelto en "Total fijos" (hoja "Gastos fijos", B5).** La celda es `=B2+B3+25`: suma
  el 25 a mano en vez de la celda B4. En clase se subió Suscripciones de 25,00 € a 52,00 € (B4) y el total no
  se movió: la hoja enseña 715,00 € con un 52,00 € justo encima.
- **Cuánto cambia.** Con B4 = 52,00 €: fijos 742,00 € (+27,00 €), total gastos 1.222,00 € (+27,00 €), ahorro
  628,00 € (−27,00 €) y tasa de ahorro 628 ÷ 1.850 × 100 ≈ 33,9 por ciento, frente al 35,4 por ciento de las
  diapositivas. Los 715,00 € solo son correctos con Suscripciones a 25,00 €.
- **Arrastre al colchón (diapositiva 6).** 3 meses de 1.195,00 € = 3.585,00 €; con 1.222,00 € serían 3.666,00 €
  (+81,00 €).
- **Hoja y diapositivas dicen cosas distintas.** Las diapositivas traen 25,00 € en Suscripciones; la hoja,
  52,00 € (la nota de quien exporta cuenta que se añadió el gimnasio en directo). No sé cuál es la cifra buena
  del ejemplo: ver ⚠️ FALTA INFO.
- **Redondeo de la hoja (Resumen, B5).** Muestra "35 por ciento" por `=B4/B2` con formato sin decimales (655 ÷ 1.850 =
  0,354); las diapositivas dicen 35,4 por ciento. Es solo formato, pero la celda tampoco dice de qué mes es.
- **Cuentas de las diapositivas.** 650 + 40 + 25 = 715 · 300 + 60 + 120 = 480 · 715 + 480 = 1.195 ·
  1.850 − 1.195 = 655 · 3 × 1.195 = 3.585: todas cuadran con su propio ejemplo.
- Es la primera hoja de cálculo del curso: no hay auditorías de otra clase con las que repetir hallazgo
  (la de la 1.1 fue por una cifra aproximada y unas instrucciones colgadas en el material, otra cosa).

## Para pensarlo despacio

1. Facturas 2.400,00 € un mes y 1.300,00 € al siguiente, con los mismos gastos. ¿Qué te dice la tasa de ahorro de cada mes y por qué no basta con mirar un solo mes? Razónalo.
2. ¿Por qué el ocio es variable aunque lo gastes todos los meses? ¿Qué cambiaría si lo pagaras con una cuota fija de gimnasio? Razónalo.
3. Un colchón guardado en una cuenta que no rinde nada, ¿sigue siendo buen colchón dentro de cinco años? Razónalo.
4. En una hoja de cálculo, ¿qué diferencia hay entre escribir `=B2+B3+25` y `=B2+B3+B4`, y cuándo se nota? Razónalo.

## Pendiente

- ⚠️ **FALTA INFO:** la cifra correcta de Suscripciones en el ejemplo de la clase (25,00 € en las diapositivas,
  52,00 € en la hoja) y, por tanto, los totales buenos (1.195,00 € / 655,00 € / 35,4 por ciento, o
  1.222,00 € / 628,00 € / 33,9 por ciento). Solo lo resuelve el profesor del curso.
- **TODO:** si se aclara, actualizar el ejemplo de [[gasto-fijo-y-variable]], [[presupuesto-personal]],
  [[tasa-de-ahorro]] y [[colchon-financiero]] (hoy usan la cifra de las diapositivas).

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]]
%% fin de la navegación %%
