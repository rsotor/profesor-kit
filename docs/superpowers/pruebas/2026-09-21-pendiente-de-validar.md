# Pendiente de validar por Roberto

Estado a 2026-09-21 por la noche. `main` = kit 0.5.1 (lo que se está probando). PR #8 abierto, en verde,
**sin mezclar**: acumula el feedback de la prueba (kit 0.6.0).

Curso de prueba real: `~/Documents/cursos/inversion-multimercado` (repo privado `rsotor/inversion-multimercado`,
atajo `inversion`). Vault de referencia: `~/Documents/courses/inversion-multimercado`.

---

## 1. Lo que te ha pedido tu profesor (antes de que siga con las 10 sesiones que quedan)

Abre en Obsidian y mira **el formato**, no el contenido:

- [ ] `conceptos/coste-de-oportunidad`
- [ ] `conceptos/diversificacion`
- [ ] `ejercicios/amortizar-o-invertir` (doble clic: se abre en el navegador)

Para cada una, tres preguntas:

- [ ] **Largo:** ¿cabe en una pantalla y se lee de un tirón, o le sobra / le falta?
- [ ] **Tono y orden:** ¿el ejemplo va antes que la definición? ¿te habla como quieres?
- [ ] **Bloque "Desde tu producto":** ¿pesa lo justo, o se come la nota? (En el vault la regla era: tres líneas, al
      final, y que se pueda borrar sin perder nada del curso.)

Lo que decidas, **díselo a él**: lo aplica a todo lo que queda. Y apúntamelo aquí si crees que es un fallo del kit
y no una preferencia tuya.

## 2. Decisiones de estilo que salen de comparar con el vault (sesiones 1.2 y 1.3)

| | Vault | Kit |
|---|---|---|
| Conceptos | 24 | 13 (cubre 19 de los 24, varios fusionados) |
| Líneas por nota | ~102 | ~55 |
| Duplicados | 3 sospechosos | 0 |

- [ ] **Granularidad.** El kit hace menos notas y más anchas (`ahorro-inversion-especulacion` es una nota; en el
      vault son `invertir` y `especulacion`). ¿Te vale, o prefieres una nota por concepto?
- [ ] **`inflacion` no tiene nota propia**: está como alias dentro de `fuentes-de-rentabilidad`. En el vault es una
      nota con ejercicio interactivo y reaparece en el módulo 2. Mira esa nota y decide.
- [ ] Lo mismo, con menos peso: `ley-de-engel` (dentro de `autonomia-financiera`), `rentabilidad-anualizada`,
      `perfil-del-inversor`, `tasa-de-preferencia-temporal`. ¿Faltan, o es que el material de esas dos clases no
      daba para nota propia?
- [ ] **Diapositivas que solo traen el título** ("Riesgo no es Mr. Market", "Balanza emocional", "Balanza de flujos
      de caja", "Seguridad", "Miedo vs control"): el kit las marcó `FALTA INFO`, que es lo correcto. El vault sí
      tiene `mr-market` porque se lo contaste tú. Si le cuentas lo que recuerdes, lo añade marcado como aportado
      por ti.
- [ ] **Auditoría del material:** el kit encontró las mismas tres cosas que el vault (los 200 €/mes tratados como
      2.400 € de golpe, el 10 % del Excel contra el 9 % del PDF, la hipoteca al 10 %). Confirma que te parece
      equivalente leyéndola en `sesiones/`.

## 3. La pregunta que decide la 1.0.0

- [ ] Leyendo las dos versiones de las mismas notas: **¿el kit suple al vault, lo mejora, o se queda corto?**
      Cada "aquí el vault es mejor" → dime cuál y por qué: se convierte en un cambio del kit.

## 4. Decisiones abiertas tuyas

- [ ] **Tu dinero real.** El vault tenía una regla dura: nada de tu patrimonio ni de tu cartera en los ejemplos. El
      curso nuevo no la hereda. Tu regla 3 (nunca recomendaciones) cubre la mitad. ¿Le dictas la otra mitad como
      sexta regla, o has cambiado de idea?
- [ ] **Mezclar el PR #8.** Cuando lo hagas, repite el paso que te falló (login de GitHub; la reinstalación en
      Windows) para confirmar que el arreglo acierta: lo arreglé por lo que me contaste, sin ver esa máquina.
- [ ] Tras mezclar: en tu curso, `/actualizar` para pasar de 0.5.1 a 0.6.0 (primera actualización real de un curso
      de verdad) y después `node .kit/herramientas/diagnostico.js` — tiene que terminar en "Todo listo".

## 5. Feedback de las otras máquinas (Windows, Codex) que aún me debes

- [ ] El mensaje exacto que dio Codex cuando quiso reinstalar `gh` y Node (para confirmar o corregir mi hipótesis
      del PATH de Windows).
- [ ] ¿Codex generó su `config/adaptacion-llm.md`? ¿Encontró dónde van sus skills? ¿Cómo se invocan ahí?
- [ ] ¿El atajo funciona en Windows (`<palabra>.cmd` en `%USERPROFILE%\.local\bin`)? ¿Esa carpeta estaba en el PATH?
- [ ] ¿"Abrir en Terminal" aparece en el clic derecho del Explorador, como dice la guía?
- [ ] ¿Obsidian: el texto de los botones coincide con el de la guía?
- [ ] Cualquier momento en que dudaste o el profesor preguntó de más o de menos. En bruto vale.

## 6. Ya arreglado en el PR #8 (para que sepas qué no hace falta repetir)

1. Login de GitHub que se quedaba colgado (el profesor lo lanza en segundo plano y te dice el código).
2. 404 por tener activa otra cuenta de GitHub, que parecía "falta la invitación".
3. Reinstalar lo ya instalado: comprobar antes; PATH de Windows; retomar en vez de empezar de cero.
4. Camino rápido para el segundo curso.
5. `diagnostico.js`: la instalación se verifica sola, con ✓/✗ y el arreglo de cada fallo.
6. Mensaje de dónde está tu copia en GitHub, que es privada, y comprobación de que lo es.
7. Avisos de lo que Obsidian no dibujará bien (moneda o `%` dentro de una fórmula, alias dentro de tablas): en el
   núcleo, para cualquier curso.
8. Comparador `docs/superpowers/pruebas/comparar-con-vault.js`.
