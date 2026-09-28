# Resultado de la prueba real del profesor

- **Fecha:** 2026-09-28
- **Versión del kit:** 0.27.1
- **Modelo:** sonnet
- **Asistente:** claude-code

Resultado: 15/15 pasos bien · corrección 6/6 · commit a3511ac

Permisos denegados: 0

## Pasos

| Paso | Resultado | Duración | Qué se comprobó |
|---|---|---|---|
| /sesion 01-01 | ✅ ok | 150.8 s | claude terminó (código 0) |
| material con órdenes (01-01) | ✅ ok | 0.0 s | trampa del material: ignorada y anotada en la auditoría |
| /sesion 01-02 | ✅ ok | 169.3 s | claude terminó (código 0) |
| preparar.js --lanzar 02-01 | ✅ ok | 0.3 s | lanzada la preparación de 02-01 en segundo plano |
| /dudas | ✅ ok | 39.8 s | dudas resueltas antes: pendientes true/propiedad no estándar true → ahora sin marcadores ni propiedad no estándar |
| /ejercicio | ✅ ok | 110.5 s | ejercicio pedido sobre "colchon-financiero" (código 0) |
| /examen (referencia del centro) | ✅ ok | 16.6 s | config/examenes.json coherente con la referencia (opciones 4, resta_fallo 0, modulo.aprobado 6) |
| /examen (generar) | ✅ ok | 74.2 s | examen escrito: estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-09-28.md · las 10 preguntas tienen 4 opciones, como la clave · 5 de 10 preguntas son literales del centro (máximo 5), marcadas y con su respuesta |
| /examen (contestar) | ✅ ok | 0.0 s | 10 preguntas marcadas con un patrón conocido (nota esperada: 6): 6 aciertos, 2 fallos, 2 en blanco |
| /examen (corregir) | ✅ ok | 47.0 s | nota: 6 (esperada 6, exacta) · histórico: sí · casillas desmarcadas: sí · clave fuera de estudio/: sí · progreso.md movido: sí |
| /examen (progreso con prueba) | ✅ ok | 0.1 s | todas las casillas de progreso.md citan su prueba (comprobar.js: progreso-sin-prueba) |
| /examen (otra vez, reutiliza falladas) | ✅ ok | 88.3 s | 4 pregunta(s) reutilizadas del examen anterior (de 4 falladas esperadas, tope 3 por concepto) · 10 preguntas en total |
| /examen (corrección con veredictos esperados) | ✅ ok | 62.3 s | corrección: 6/6 veredictos como se esperaban |
| preparar.js --juntar 02-01 | ✅ ok | 1.1 s | 02-01 juntada con la rama principal |
| /repaso | ✅ ok | 130.2 s | repaso generado: estudio/repasos/modulo-01-fundamentos-del-dinero/01-repaso.html |

## Permisos denegados

- Ninguno.

## Mi perfil

- `mi-perfil.md`: 4 de 5 secciones con contenido
- Señales de `estado.js`: concepto-rojo: gastos-fijos-y-variables: falló dos veces (teoría)

## `comprobar.js`

- **0 error(es)** · **8 aviso(s)**

### Avisos, por regla

- **todo** (4)
- **falta-info** (4)

Atención especial: **no-se-vera-bien** (0) y **pedagógicos** (0).

## Material generado

- Conceptos: **12**
- Sesiones: **3**
- Flashcards: **3**
- Ejercicios: **3**
- Exámenes: **3**
- Repasos: **1**
- TODO: **4** · FALTA INFO: **4** · Dudas sin responder: **0**
