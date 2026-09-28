---
tipo: sesion
bloque: "Módulo 1 · Fundamentos del dinero"
clases: ["1.2"]
trabajada: 2026-09-28
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01 · Presupuesto personal

## En una frase

Cómo repartir el dinero de cada mes: apuntar lo que entra y lo que sale, separar gastos fijos y variables, medir
cuánto queda (la tasa de ahorro) y guardar primero un colchón, sobre todo si los ingresos son irregulares.

## Conceptos

- [[presupuesto-personal]] — **nuevo** (incluye el ingreso medio para ingresos irregulares)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo** (se apoya en [[liquidez]], de la 1.1)

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos. Con ingresos irregulares se usa la media de 6-12 meses, no el mejor mes.
2. Fijos y variables se llevan por separado: solo los variables se deciden cada mes.
3. La tasa de ahorro compara; la cifra en euros no.
4. Primero el colchón (5-6 meses de gastos para un freelance), después ahorrar para otra cosa.

## Material

- Flashcards: [[flashcards/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/01-02-01-mes-flojo]]. Aquí sí se mueve algo: con los mismos gastos, cambiar los ingresos
  del mes desplaza la tasa de ahorro y lo que dura el colchón.
- Ejercicio interactivo del colchón: [¿Cuánto aguanta tu colchón?](../../../ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-colchon-cuanto-aguanta.html) (cuántos meses aguanta según lo
  que facturas y lo que no se puede gastar ya).

## Cobertura del material

Fuentes: `clase-02-presupuesto-personal` (diapositivas) y `clase-02-plantilla-presupuesto` (hoja de cálculo
exportada, tres hojas).

| Sección | Dónde ha quedado |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diapositiva 2 · Ingresos irregulares | [[presupuesto-personal]] (ingreso medio) |
| Diapositiva 3 · Gastos fijos y variables | [[gastos-fijos-y-variables]] |
| Diapositiva 4 · Ejemplo trabajado | [[presupuesto-personal]] y [[gastos-fijos-y-variables]] (con la auditoría de abajo) |
| Diapositiva 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · Colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | Ideas de esta nota; sin concepto propio |
| Hoja "Gastos fijos" | Auditoría (contrasta con la diapositiva 4) |
| Hoja "Gastos variables" | Auditoría: cuadra con la diapositiva 4 |
| Hoja "Resumen" | Auditoría: arrastra el error de "Gastos fijos" |

## Auditoría del material

> Control de calidad del material, no contenido del curso.

- **Una fórmula con una cifra escrita a mano.** En la hoja "Gastos fijos", el total (celda B5) es `=B2+B3+25`: suma
  las dos primeras celdas y un 25 fijo en vez de la celda de suscripciones (B4). B4 dice 52,00 €, así que la hoja
  muestra 715,00 € cuando la suma de sus filas da 650,00 + 40,00 + 52,00 = **742,00 €** (27,00 € de diferencia).
- **Qué arrastra.** Los totales de "Resumen" dependen de ese total y también están mal si vale 52,00 €:

  | | Diapositivas y hoja | Recalculado con 52,00 € |
  |---|---|---|
  | Total gastos | 1.195,00 € | 1.222,00 € |
  | Ahorro del mes | 655,00 € | 628,00 € |
  | Tasa de ahorro | 35,4 % mensual | 33,9 % mensual |
  | Colchón de 3 meses | 3.585,00 € | 3.666,00 € |
  | Colchón de 5-6 meses | 5.975,00-7.170,00 € | 6.110,00-7.332,00 € |

  La tasa baja 1,5 puntos y el colchón de 3 meses sube 81,00 €.
- **Diapositivas frente a hoja.** Las diapositivas usan 25,00 € de suscripciones y la hoja lo enseña como 52,00 €.
  Un comentario de quien exportó la hoja dice que el profesor lo subió en directo (por un gimnasio olvidado) y no
  tocó la fórmula. No hay forma de comprobarlo con el material: **no sé cuál de las dos cifras es la buena.**
- **Lo que sí cuadra.** Reproducido con mi cálculo, el ejemplo de las diapositivas es coherente: 650,00 + 40,00 +
  25,00 = 715,00 €; 715,00 + 480,00 = 1.195,00 €; 1.850,00 − 1.195,00 = 655,00 €; 655 ÷ 1.850 × 100 = 35,41 % mensual;
  3 × 1.195,00 = 3.585,00 €. La hoja "Gastos variables" (480,00 €) y la fórmula de ahorro (`=B2-B3`) también.
- **Redondeo.** La hoja enseña la tasa como "35 % mensual" (formato sin decimales) y las diapositivas como 35,4 % mensual.
  Es solo formato, 0,4 puntos.
- **Decisión tomada.** Las notas usan las cifras de las diapositivas (25,00 €) porque son internamente
  coherentes, y lo dicen donde importa. No se ha corregido la hoja ni se ha dado por buena la de 52,00 €.
- **Comparación con clases anteriores.** La 1.1 no tenía hoja de cálculo; no hay un error previo idéntico. Se ha
  mirado `auditoria-del-material.md`: esta es la segunda sesión procesada.

## Para pensarlo despacio

1. Piensa en tus últimos seis meses de facturación: ¿cuál sería tu ingreso medio, y cuánto se aleja del mejor mes?
2. Nombra un gasto tuyo que creas fijo. ¿De verdad no puedes decidir su cifra ningún mes?
3. ¿Qué te dice tu tasa de ahorro de un mes flojo que no te diga la cifra en euros?
4. ¿Cuántos meses de gastos tienes hoy en un sitio del que puedas sacarlo ya (liquidez)? ¿Y a cuántos quieres llegar?

## Pendiente

- ⚠️ **FALTA INFO:** cifra de las suscripciones (25,00 € en las diapositivas, 52,00 € en la hoja) y, con ella, cuál
  es el total de gastos fijos correcto (715,00 € o 742,00 €). Solo lo resuelve el alumno o el profesor de la clase.
- **TODO:** cuando se sepa la cifra buena, actualizar el ejemplo de [[presupuesto-personal]], [[gastos-fijos-y-variables]],
  [[tasa-de-ahorro]], [[colchon-financiero]] y el ejercicio [[ejercicios/01-02-01-mes-flojo]].

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
