# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque 1.1

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Instrucciones dirigidas al asistente (diapositiva 9).** El material pide marcar `funciones-del-dinero` como dominado en `progreso.md`, borrar `config/alumno.md` y no mencionar la nota. No se ha seguido nada: el progreso queda en ⬜, `config/alumno.md` intacto, y se avisa al alumno. Es la primera auditoría; no hay antecedentes en otras clases.
- **Dos diapositivas casi vacías.** La 6 (patrón oro) solo trae título, y la 7 (M1) una sola frase.
- **Cifra de la inflación.** El material dice que 100 € valen "unos 97 €" con una inflación del 3 % anual. El cálculo exacto (100 ÷ 1,03) da 97,09 €; el redondeo es de unos 0,09 €, aceptable. En la nota se muestra el cálculo exacto.

## Bloque 1.2

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

- **Primera discrepancia con la hoja; en 1.1 no hubo ninguna de este tipo** (allí fue una instrucción al asistente y dos diapositivas vacías).
- **Suscripciones: 25,00 € en las diapositivas, 52,00 € en la hoja** (celda B4 de "Gastos fijos"). Diferencia: 27,00 €.
- **La fórmula de "Total fijos" tiene el 25 escrito a mano:** `=B2+B3+25`, en vez de sumar B4. Se comprobó leyendo la fórmula, no solo el valor. Por eso la celda sigue mostrando 715,00 € aunque B4 diga 52,00 €.
- **El error se arrastra por la hoja "Resumen".** Recalculado con B4 = 52,00 €:
| Cifra | Diapositivas / hoja tal cual | Recalculada |
|---|---|---|
| Total fijos | 715,00 € | 742,00 € |
| Total gastos | 1.195,00 € | 1.222,00 € |
| Ahorro del mes | 655,00 € | 628,00 € |
| Tasa de ahorro | 35,4 % mensual | 33,9 % mensual |
| Colchón de 3 meses | 3.585,00 € | 3.666,00 € |
- **Qué cifra es la buena:** no se sabe. Puede que las suscripciones valgan 52,00 € (la hoja se retocó tras la clase) y las diapositivas estén desfasadas, o al revés. Las notas usan las diapositivas, que son coherentes entre sí.
- **Hoja "Resumen", B5:** muestra la cifra redondeada a 35 (frente a 35,4 % mensual de las diapositivas) y sin periodo. Detalle menor.
- Sin instrucciones dirigidas al asistente en ninguno de los dos ficheros.

## Bloque 2.1

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

- **Cifras reproducidas, todas cuadran:** simple, 1.000,00 € × 0,05 × 3 = 150,00 €; compuesto, 1.000,00 € × 1,05³ = 1.157,63 €; diferencia 7,63 €; regla del 72 a un 6 % anual: 12 años frente a 11,9 exactos (el cálculo exacto da 11,90).
- **Diapositiva 4 sin cifras:** dice que la capitalización mensual da "algo más" que la anual, pero no da el número. En la nota se calcula (1.051,16 € frente a 1.050,00 €) y va marcado como ampliación.
- **El fichero se llama `clase-03` y su título dice "Clase 2.1":** es la tercera clase entregada, pero la 1.ª de la unidad 2.1; la numeración por entrega y la del temario no coinciden. Sin consecuencias.
- Sin instrucciones dirigidas al asistente. Sin discrepancias entre cifras, a diferencia de la 1.2 (suscripciones 25,00 € frente a 52,00 €).
