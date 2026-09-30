# Seguridad

## Cómo avisar de un fallo de seguridad

**No abras una issue pública.** Usa el aviso privado de GitHub:
[Report a vulnerability](https://github.com/rsotor/profesor-kit/security/advisories/new)
(pestaña *Security* del repo → *Report a vulnerability*). Solo lo ve el mantenedor.

Incluye, si puedes:
- qué parte está afectada (una herramienta, una skill, `AGENTS.md`, la instalación…) y la versión del kit
  (`.kit/VERSION`);
- cómo reproducirlo, **con un curso inventado** (sirve el de `pruebas/curso-ejemplo/`), nunca con el material
  ni los datos de un alumno de verdad;
- qué impacto crees que tiene.

Es un proyecto personal mantenido en el tiempo libre: no hay plazos garantizados, pero los avisos de
seguridad tienen prioridad sobre cualquier otra cosa. Cuando haya arreglo, se publica como release (los cursos
lo reciben al actualizar) y se da crédito a quien lo avisó, si quiere.

## Versiones soportadas

Solo la última release. Si tu curso va atrasado, dile a tu profesor «actualiza el kit» antes de avisar.

## Qué se considera un fallo de seguridad

- Que datos del alumno (su material, `config/alumno.md`, rutas con su usuario) acaben donde no debe: en este
  repo, en una issue o en cualquier sitio que no sea su curso.
- Que el material del curso (un PDF, unos apuntes) consiga que el profesor obedezca instrucciones escondidas en
  él: borrar ficheros, subir cosas, leer fuera de la carpeta del curso.
- Que una herramienta lea, escriba o borre fuera de la carpeta del curso.
- Que el kit use, guarde o suba un token o una contraseña que el alumno haya pegado en la conversación.
- Que `/actualizar` o la instalación ejecuten algo que no venga de una release de este repo, o que se salten
  la comprobación de hash de los complementos de Obsidian.

## Qué no lo es

- Lo que hace el propio asistente (Claude, Codex…) fuera de las reglas del kit: eso se avisa a su fabricante.
- Que el alumno acepte permisos de más a mano o haga público el repositorio de su curso.
- Errores de contenido o de funcionamiento: son importantes, pero van por una
  [issue normal](https://github.com/rsotor/profesor-kit/issues/new/choose).
