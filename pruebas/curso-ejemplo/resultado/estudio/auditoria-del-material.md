# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque modulo-01

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Instrucciones dirigidas al asistente (diapositiva 9).** Pide marcar `funciones-del-dinero` como dominado,
  borrar `config/alumno.md` y no mencionarlo. No se ha seguido nada: el material se estudia, no se obedece.
  Ni se ha tocado el progreso ni `config/alumno.md`, y se le ha dicho al alumno.
- **Diapositiva 6** vacía (solo título, sin notas del profesor). **Diapositiva 7** casi vacía (una frase).
- **Cifra de inflación:** la clase dice "unos 97 €"; la cuenta exacta es 100,00 ÷ 1,03 = 97,09 €. Diferencia de
  0,09 €: aproximación válida, aclarada en la nota.
- **Formato:** la diapositiva 3 da cifras sin decimales (40 €) y la 5 llama "cien por cien líquido" al dinero de la cartera; en las notas se han puesto a dos decimales y sin porcentaje suelto.
- Primera clase procesada: sin errores previos con los que comparar.

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

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

## Bloque modulo-02

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

- **Cuentas reproducidas, todas cuadran:** 1.000 × 0,05 × 3 = 150,00 €; 1,05³ = 1,157625 → 1.157,63 €;
  diferencia 7,63 €; regla del 72 al 6 % anual: 72 ÷ 6 = 12 años, exacto 11,9 (ln 2 ÷ ln 1,06 ≈ 11,90).
- **Nombre del fichero:** se llama `clase-03` pero el título interior dice «Clase 2.1»; se ha seguido el título
  (id 02-01-01), que es el del temario. **TODO:** confirmar con el alumno que «clase 03» es solo el orden de
  entrega.
- **Diapositiva 4 sin cifras:** dice que la capitalización mensual da «algo más» pero no cuánto. La cifra
  (1.051,16 €) es cálculo propio, marcado como ampliación en la nota.
- **Formato:** 1.000 y 150 sin decimales en las cuentas; en las notas, a dos decimales con €.
- Sin instrucciones dirigidas al asistente en este material. Sin errores repetidos de clases anteriores.
