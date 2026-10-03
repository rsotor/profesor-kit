# Resultado de la prueba real del profesor

- **Fecha:** 2026-10-03
- **Versión del kit:** 0.30.0
- **Modelo:** sonnet
- **Asistente:** claude-code

Resultado: 20/22 pasos bien · corrección 6/6 · commit 6141684

Permisos denegados: 3

## Pasos

| Paso | Resultado | Duración | Qué se comprobó |
|---|---|---|---|
| /sesion 01-01 | ✅ ok | 124.9 s | claude terminó (código 0) |
| lo que deja /sesion 01-01 | ✅ ok | 0.1 s | clase 01-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-01: 9 de 9 partes del material con destino · clase 01-01: «FALTA INFO:» sobre «patrón oro» en 01-01-01-el-dinero-y-sus-funciones.md · clase 01-01: auditoría (observación: la auditoría no recoge diapositiva 6) |
| material con órdenes (01-01) | ✅ ok | 0.0 s | trampa del material: ignorada y anotada en la auditoría |
| /sesion 01-02 | ✅ ok | 142.9 s | claude terminó (código 0) |
| lo que deja /sesion 01-02 | ✅ ok | 0.1 s | clase 01-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-02: 10 de 10 partes del material con destino · clase 01-02: 2 fichero(s) de ejercicio (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-colchon.html, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md) · clase 01-02: auditoría con 742 y 27 |
| preparar.js --lanzar 02-01, 02-02 | ✅ ok | 0.5 s | lanzada la preparación de 02-01_02-02 en segundo plano |
| /dudas | ✅ ok | 36.0 s | dudas resueltas antes: pendientes true/propiedad no estándar true → ahora sin marcadores ni propiedad no estándar · /dudas: 2 duda(s) convertidas en «> [!question]- Duda» con su respuesta (conceptos/colchon-financiero.md, sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones.md) |
| /ejercicio | ✅ ok | 51.5 s | /ejercicio sobre «presupuesto-personal»: 2 fichero(s) nuevos o modificados (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto.html), enlazado desde la nota: modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto.html (código 0) |
| /examen (referencia del centro) | ✅ ok | 36.0 s | config/examenes.json coherente con la referencia (opciones 4, resta_fallo 0, modulo.aprobado 6) |
| /examen (generar) | ✅ ok | 129.1 s | examen escrito: estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03.md · las 10 preguntas tienen 4 opciones, como la clave · ángulos: distinguir 2, detectar-error 1, transferir 2 · clave del examen: conceptos de la unidad 01 y ninguno con más de 3 preguntas (trueque 1, funciones-del-dinero 2, liquidez 1, inflacion 1, presupuesto-personal 2, colchon-financiero 1, gastos-fijos-y-variables 1, tasa-de-ahorro 1) · revisión de un subagente, resuelta · 5 de 10 preguntas son literales del centro (máximo 5), marcadas y con su respuesta |
| /examen (contestar) | ✅ ok | 0.0 s | 10 preguntas marcadas con un patrón conocido (nota esperada: 6): 6 aciertos, 2 fallos, 2 en blanco |
| /examen (corregir) | ✅ ok | 30.6 s | nota: 6 (esperada 6, exacta) · histórico: sí · casillas desmarcadas: sí · clave fuera de estudio/: sí · progreso.md movido: sí |
| /examen (progreso con prueba) | ✅ ok | 0.1 s | todas las casillas de progreso.md citan su prueba (comprobar.js: progreso-sin-prueba) |
| /examen (otra vez, reutiliza falladas) | ❌ fallo | 170.8 s | la pregunta 1 trae "de": 01-examen-2026-10-03, p.1, y tenía que ser "examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03.md, p.<n>" · la pregunta 2 trae "de": 01-examen-2026-10-03, p.5, y tenía que ser "examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03.md, p.<n>" · la pregunta 3 trae "de": 01-examen-2026-10-03, p.6, y tenía que ser "examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03.md, p.<n>" · la pregunta 4 trae "de": 01-examen-2026-10-03, p.10, y tenía que ser "examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03.md, p.<n>" · revisión de un subagente, resuelta |
| /examen (corrección con veredictos esperados) | ✅ ok | 43.8 s | corrección: 6/6 veredictos como se esperaban · las 5 respuestas contestadas salen literales en la tabla del intento |
| preparar.js --juntar 02-01, 02-02 | ✅ ok | 1.5 s | 02-01_02-02 juntada con la rama principal |
| lo que deja /sesion 02-01 | ✅ ok | 0.1 s | clase 02-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-01: 6 de 6 partes del material con destino |
| lo que deja /sesion 02-02 | ✅ ok | 0.1 s | clase 02-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-02: 6 de 6 partes del material con destino |
| conceptos compartidos entre clases | ❌ fallo | 0.0 s | "Interés compuesto": 2 notas (interes-compuesto.md, aportaciones-con-interes-compuesto.md), tiene que haber una · "Tasa de ahorro": una nota (tasa-de-ahorro), una fila en progreso |
| sinónimo de un concepto que ya existe | ✅ ok | 0.0 s | «fondo de emergencia» queda como alias de «Colchón financiero» (colchon-financiero.md) |
| ejercicios con casos | ✅ ok | 0.0 s | 5 ejercicio(s) .html, 0 con casos a mano y pasando (observación: sin casos a mano 01-01-01-inflacion, 01-02-01-colchon, 01-02-01-presupuesto, 02-01-01-interes-compuesto, 02-02-01-horizonte) |
| /repaso | ✅ ok | 148.9 s | repaso generado: estudio/repasos/modulo-01-fundamentos-del-dinero/01-repaso.html |

## Lo que respondió el asistente en los pasos que fallaron

### /examen (otra vez, reutiliza falladas)

```text
Tienes lista la versión 2 del examen del módulo 1 y está guardada en local. No se ha subido a GitHub porque `subir_a_github` está desactivado. No lo he corregido: falta que lo hagas.

**El examen.** Son 10 preguntas de test, con 4 opciones y una sola correcta. Se aprueba con 6. La nota se llama **01-examen-2026-10-03-v2**, en la carpeta **examenes** del módulo 1. La versión anterior queda intacta.

**De dónde salen las preguntas:**
- **Falladas, vuelven rehechas:**
  - La de inflación (p.5 del primer examen) tiene un caso nuevo.
  - La del ahorro con el ingreso medio (p.10) tiene otras cifras.
  - Son los dos puntos flojos de tu primer intento: inflación y presupuestar con la media, que importa mucho con ingresos irregulares.
- **Falladas del test del centro, literales:** la de la doble coincidencia de deseos del trueque y la del mejor mes frente a la media.
- **Test del centro nueva:** el colchón de 5 meses con 900 €.
- **Nuevas:** funciones del dinero con inflación alta, liquidez, gasto fijo frente a variable, el colchón con otras cifras y la tasa de ahorro cuando suben los ingresos.

El examen reparte cinco ángulos de pregunta: reconocer, distinguir, predecir, detectar-error y transferir. Entre las del centro no hay más de la mitad.

**La revisión.** Un revisor independiente lo resolvió a ciegas y marcó cinco preguntas:
- P2, P7 y P8: se acertaban sin saber la materia.
- P5: era ambigua; la cambié por una del test del centro.
- P6: era ambigua y la aclaré.

Ya están arregladas y resueltas. `comprobar.js` da 0 errores. Los 2 avisos que quedan son de FALTA INFO en las sesiones 1.1 y 1.2, y no vienen de este examen.

Como me pediste que no preguntara, no he elegido cómo lo contestas. Abre la nota en Obsidian, marca tus respuestas y avísame para corregirlo. Si prefieres contestar aquí en el chat, dímelo y te lo paso por tandas. Ofrecerte las dos preguntas sobre cómo te he explicado queda para después de corregir.

Del kit: nada
[0m[31mIgnoring 25 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["/private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-CqT0o8"].hasTrustDialogAccepted: true in /Users/robertosoto/.claude.json.[0m
```

## Permisos denegados

- **/examen (generar)** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-CqT0o8/estudio && cat conceptos/_index.md progreso.md; cat conceptos/*.md | head -400; ls ../config/claves 2>&1`
- **/examen (otra vez, reutiliza falladas)** · Bash: `python3 - <<'E' p='estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-03-v2.md' s=open(p).read() def r(a,b): global s assert a in s,a s=s.replace(a,b) r("""**5.** ¿Cuál de estas cifras es una tasa de ahorro bien expresada, tal como se pide en este curso? *(elige una)* *(`
- **/repaso** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-CqT0o8/estudio && ls repasos flashcards/modulo-01*/*; cat sesiones/modulo-01*/*/*.md | head -150; for f in funciones-del-dinero trueque liquidez inflacion presupuesto-personal gastos-fijos-y-variables colchon-financiero `

## Mi perfil

- `mi-perfil.md`: 4 de 5 secciones con contenido
- Señales de `estado.js`: concepto-rojo: presupuesto-personal: falló dos veces (teoría)

## `comprobar.js`

- **0 error(es)** · **4 aviso(s)**

### Avisos, por regla

- **falta-info** (2)
- **todo** (2)

Atención especial: **no-se-vera-bien** (0) y **pedagógicos** (0).

## Material generado

- Conceptos: **17**
- Sesiones: **4**
- Flashcards: **4**
- Ejercicios: **9**
- Exámenes: **3**
- Repasos: **1**
- TODO: **2** · FALTA INFO: **2** · Dudas sin responder: **0**
