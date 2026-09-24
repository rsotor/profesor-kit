# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque 01-02

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

*Control de calidad del material, no contenido del curso.* Primera sesión auditada: no había hallazgos anteriores en `estudio/auditoria-del-material.md`.
**La hoja de cálculo no cuadra con las diapositivas.** Miradas las fórmulas, no solo los valores:
- En "Gastos fijos", **B4 (Suscripciones) vale 52,00 €**, pero la diapositiva 4 dice 25,00 €.
- **B5 (Total fijos) es `=B2+B3+25`**: tiene el 25 escrito a mano en vez de sumar B4. Por eso sigue en 715,00 € aunque B4 diga 52,00 €.
- Recalculando con la celda B4 (650,00 + 40,00 + 52,00): fijos **742,00 €**, no 715,00 €. Gastos variables 480,00 € (coincide en las dos fuentes).
| Cifra | Diapositivas / hoja (tal como se ve) | Recalculado con B4 = 52,00 € | Diferencia |
|---|---|---|---|
| Total fijos | 715,00 € | 742,00 € | +27,00 € |
| Total gastos | 1.195,00 € | 1.222,00 € | +27,00 € |
| Ahorro del mes | 655,00 € | 628,00 € | −27,00 € |
| Tasa de ahorro | 35,4 % mensual (la hoja la muestra sin decimales) | 33,9 % mensual | −1,5 puntos |
| Colchón de 3 meses | 3.585,00 € | 3.666,00 € | +81,00 € |
**Qué es cierto y qué no.** Que la fórmula tiene un 25 fijo y que B4 dice 52,00 € se ve en la hoja: es un hecho. Cuál de las dos cifras de Suscripciones es la buena (25,00 € o 52,00 €) **no se puede saber con el material**: el comentario del fichero exportado dice que el profesor la cambió en directo por el gimnasio, pero lo cuenta quien exportó, no el profesor. Por eso las notas de concepto no usan esas cifras.
**Otros:** la hoja muestra la tasa de ahorro como un entero (formato sin decimales) mientras la diapositiva dice 35,4 % mensual: es solo redondeo. No se han visto instrucciones dirigidas al profesor en ninguno de los dos ficheros.
