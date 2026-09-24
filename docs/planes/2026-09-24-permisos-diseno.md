# Permisos: aceptar una vez · Diseño (0.24.0)

Estado: **decidido con Roberto** (2026-09-24): P1 a P4 como se recomiendan. Nada implementado todavía.

## 1. El problema

El alumno tiene que aceptar decenas de permisos parecidos mientras el profesor trabaja. Visto:

- **Mac, Claude Code desde Obsidian (Claudian)**, al actualizar un curso: muchas peticiones seguidas.
- **Windows, Codex desde Claudian y en la terminal** (validación de la #36): "varias solicitudes de autorización";
  dentro del entorno restringido de Codex, git ni siquiera se puede ejecutar (se arregló el mensaje en la 0.23.0,
  no el permiso).

**Decisión de Roberto:** nada específico de un asistente; tiene que valer para todos. El alumno acepta una vez y el
profesor puede trabajar con todas sus notas y sesiones. Idea: que el profesor delegue en su "servicio técnico",
que lo configura para el entorno de ese alumno.

## 2. De dónde salen las peticiones (lo comprobado)

| Tipo | Ejemplo | ¿Se puede aceptar una vez sin riesgo? |
|---|---|---|
| **Herramientas del kit** | `node .kit/herramientas/guardar.js …` | Sí: son siempre las mismas, y el kit sabe cuáles son |
| **Leer y editar el curso** | editar una nota de `estudio/`, leer `config/` | Sí, **dentro de la carpeta del curso**: todo está en git y "deshaz lo último" lo devuelve |
| **git** | `git status`, `git log` | Los de solo lectura, sí. Los que escriben ya pasan por `guardar.js` |
| **Comandos improvisados** | `python3 - <<EOF`, `sed`, `pdftotext` | **No**: un "acepta cualquier `python3`" es darle vía libre. Se reducen, no se aceptan |

Comprobado en Claude Code (2026-09-23):

- Arrancado en `estudio/` (así lo abre Claudian), **solo aplica `estudio/.claude/settings.json`**; las reglas que el
  kit pone en la raíz del curso no cuentan. Arrancado en la raíz (el atajo de la terminal), solo cuentan las de la raíz.
- `additionalDirectories: [".."]` en `estudio/.claude/settings.json` le deja leer y editar `config/` sin preguntar.
  Es relativo: sigue valiendo si el alumno mueve el curso.
- El modo "aceptar ediciones" (`acceptEdits`) acepta las ediciones dentro de las carpetas de trabajo. Claudian ya
  lo usa en su modo normal; la terminal, por defecto, no.

Codex (de su ayuda, `codex-cli 0.156.1`; **lo que no está probado va marcado**):

- `--sandbox workspace-write` y `--add-dir <carpeta>`: escribe dentro de la carpeta de trabajo y de las que se añadan.
- `--ask-for-approval <política>`: cuándo pregunta.
- Reglas `prefix_rule(...)` en `~/.codex/rules/default.rules` para permitir comandos concretos (ya lo usa el kit).
- **TBD, probar en Windows:** si una regla `allow` hace que git se ejecute aunque el entorno restringido lo bloquee, y
  si Codex admite esta configuración por proyecto (en el propio curso) o solo por usuario.

## 3. La propuesta: un "servicio técnico" del kit

Una herramienta nueva, `permisos.js`, que sabe **qué** hay que permitir (lo decide el kit, igual para todos) y
**dónde** se escribe en cada asistente (lo dice su adaptador, que es donde vive lo específico de cada uno).

1. **Qué se permite, igual para todos:** las herramientas del kit; leer y editar dentro de la carpeta del curso;
   los git de solo lectura. **Nunca**: nada fuera del curso, ningún comando genérico (`python3`, `bash`…), ni el
   modo "sin preguntar nada" de ningún asistente.
2. **Dónde, según el adaptador:** Claude Code → `.claude/settings.json` en la raíz **y** en `estudio/` (terminal y
   Obsidian); Codex → sus reglas y su configuración del proyecto (lo que se confirme en Windows). Un asistente nuevo
   lo declara en su adaptador (`ESTANDARES.md`).
3. **El sí del alumno, una vez:** el profesor le explica en tres líneas qué va a poder hacer sin preguntar ("editar
   tus notas y ejecutar las herramientas del kit, solo dentro de este curso; todo se puede deshacer") y, con su sí,
   ejecuta `permisos.js --aplicar`. `--quitar` lo deshace.
4. **Cuándo:** en `/configurar` para un curso nuevo. En un curso que ya existe, el profesor lo ofrece una vez al
   actualizar a la 0.24.0, y también **cuando note que el alumno está aceptando muchos permisos** (el "servicio
   técnico" del que habló Roberto).
5. **Vigilado:** `diagnostico.js` comprueba que la configuración está donde el adaptador dice, para cada sitio desde
   el que se abre el profesor.
6. **Menos comandos improvisados** (lo que no se puede aceptar): `AGENTS.md` pide usar las herramientas del asistente
   para leer, buscar y editar, y P8 trae una herramienta del kit para leer PPTX, Excel y demás, que es de donde salen
   los `python3`.

## 4. Decisiones (Roberto, 2026-09-24: sí a las cuatro recomendaciones)

| # | Decisión | Recomendación | Por qué |
|---|---|---|---|
| P1 | ¿Las ediciones dentro del curso se aceptan sin preguntar? | **Sí** | Todo está en git y "deshaz lo último" lo devuelve; preguntar por cada nota es lo que satura |
| P2 | ¿Cuándo se pide el sí? | **Al configurar, y una vez al actualizar a la 0.24.0**; después, solo si el profesor ve muchas peticiones | Una sola conversación, no una por sesión |
| P3 | ¿Se permite `python3` (u otro comando genérico) para leer material? | **No**: se sustituye por una herramienta del kit (P8) | Aceptarlo es darle vía libre a cualquier programa |
| P4 | ¿P8 (leer PPTX, Excel…) entra en la misma versión? | **Sí**, en la 0.24.0 | Sin P8, los `python3` siguen preguntando y el alumno no nota la mejora entera |

## 5. Lo que hay que probar antes de programar

- Codex en Windows: reglas `allow` para `node .kit/herramientas/…` y `git`, desde la terminal y desde Claudian, y si
  el entorno restringido deja ejecutarlos (la #36 dice que no los dejaba).
- Claude Code en la terminal con `acceptEdits` desde el atajo: que las ediciones de `estudio/` y `config/` no pregunten.
- Claudian con Claude Code, con los dos `settings.json`: cero peticiones al procesar una clase (ayer, al actualizar,
  fueron decenas).
