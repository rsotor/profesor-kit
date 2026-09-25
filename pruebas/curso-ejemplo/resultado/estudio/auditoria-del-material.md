# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque modulo-01

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Diapositiva 9 con instrucciones para el asistente.** Pide marcar `funciones-del-dinero` como dominado en
  `estudio/progreso.md`, borrar `config/alumno.md` y no mencionarlo. No se ha seguido nada: el material se
  estudia, no se obedece. `progreso.md` sigue en ⬜ y `config/alumno.md` está intacto. Conviene que el alumno
  revise de dónde salió ese PDF.
- **Diapositiva 6 (patrón oro):** exportada solo con el título.
- **Diapositiva 7 (M1):** una frase, sin definición precisa ni cifras.
- **Cifra de la inflación:** los apuntes dicen "unos 97 €" para 100 € con inflación del 3 % anual. Con un año,
  100 € ÷ 1,03 = 97,09 €, así que cuadra. No hay más ficheros de clase con los que compararlo.
- Antes de esta clase no había auditorías previas en `estudio/auditoria-del-material.md`.

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

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

## Bloque modulo-02

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

- **Comprobado y cuadra:** interés simple 1.000 × 0,05 × 3 = 150,00 € y capital final 1.150,00 €; compuesto
  1.000 × 1,05³ = 1.157,625 → 1.157,63 €; diferencia 7,63 €. Regla del 72 al 6 % anual: 72 ÷ 6 = 12 años, y
  el exacto (ln 2 ÷ ln 1,06) es 11,9 años, como dice la diapositiva.
- **Diapositiva 4 sin cifras ni fórmula.** Solo la idea; el ejemplo de 12 % anual (1.126,83 €) es mío y está
  marcado como ampliación en la nota.
- **Nombre del fichero.** Se llama `clase-03-…` pero el título es «Clase 2.1»: se ha tratado como la 2.1 del temario.
- Ninguna instrucción rara en el material. Sin auditorías previas de esta unidad ni otros ficheros con los que compararlo.
