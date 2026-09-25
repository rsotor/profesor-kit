---
estado: configurado
---
# El curso

> Lo escribe `/configurar` (bloque A). Puedes corregirlo a mano cuando quieras.

## Nombre

Finanzas personales para empezar

## De qué va

Un curso corto y autodidacta para entender el dinero propio: qué es y para qué sirve, cómo repartirlo
con un presupuesto, y cómo crece (o no) cuando se ahorra o se invierte a un interés.

## Objetivo
<!-- examen oficial · cultura general · uso profesional -->

Cultura general y uso personal. No hay examen oficial detrás: el alumno quiere manejar sus propias
cuentas con criterio, sobre todo porque sus ingresos son irregulares.

## Temario
<!-- bloques o módulos, en el orden del centro -->

1. Módulo 1 · Fundamentos del dinero
   1. 1.1 El dinero y sus funciones
   2. 1.2 Presupuesto personal
2. Módulo 2 · Ahorro e interés
   1. 2.1 Interés simple y compuesto

## Fechas
<!-- inicio, fin, exámenes -->

Curso autodidacta, sin fechas de un centro. **TODO:** preguntarle al alumno si se pone una fecha
límite para terminarlo, o si prefiere ir sin prisa.

## Cómo numera el centro las clases
<!-- de aquí sale el nombre de cada nota de sesión -->

No hay "centro": es un temario propio que el alumno sigue por su cuenta, con el orden de arriba. El id
de cada sesión es `<módulo a dos dígitos>-<unidad a dos dígitos>-<clase a dos dígitos>-<slug>`. Ejemplo:
la única clase de la unidad 1.1 del módulo 1 es `01-01-01-el-dinero-y-sus-funciones`.

## Reglas propias del dominio
<!-- lo que en este curso hay que hacer siempre o nunca al explicar -->

- Toda tasa de interés dice siempre su periodo (anual, mensual, diario…): un tanto por ciento suelto
  no dice nada por sí mismo. Comprobado por `config/ajustes.json` → `patrones_prohibidos`.
- Todo ejemplo con dinero usa euros (€) y dos decimales, nunca una cifra sin unidad.
