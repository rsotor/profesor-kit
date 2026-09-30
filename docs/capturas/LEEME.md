# Capturas y vídeo del README

Todo se graba con el **curso de ejemplo**, nunca con uno de verdad: abre
`pruebas/curso-ejemplo/resultado/estudio/` como bóveda en Obsidian. Es un curso inventado (finanzas personales)
y ya tiene clases preparadas, progreso y un repaso. Antes de grabar, que no salga tu nombre de usuario en
ninguna ruta de la terminal ni de Obsidian.

## Vídeo: `docs/tutorial.mp4` + `docs/tutorial.gif`

40-60 segundos, sin voz. Un día normal, de principio a fin:

1. Terminal: se escribe el atajo y se abre el profesor con su saludo.
2. Se escribe *"he dejado los apuntes de hoy"* (corta la espera de la preparación).
3. Obsidian: **inicio** → la sesión recién preparada → una nota de concepto.
4. Terminal: una duda sobre esa nota y su respuesta.
5. Terminal: *"hazme unas preguntas"*, una respuesta y la corrección.
6. Obsidian: **progreso**, con el concepto que acaba de cambiar de estado.

El GIF, a 1000 px de ancho como mucho y por debajo de 10 MB (GitHub no enseña los más grandes). El MP4, en
mejor calidad, enlazado debajo del GIF.

## Capturas: `docs/capturas/`

| Fichero | Qué se ve |
|---|---|
| `clase.png` | Obsidian con una sesión preparada (la 1.1) y el panel de enlaces a sus conceptos |
| `progreso.png` | Obsidian con **progreso**: conceptos en 🟢/🟡/🔴 y la respuesta que lo prueba |
| `repaso.png` *(opcional)* | La página de repaso del módulo 1 en el navegador |

Tema claro, ventana a unos 1400 px de ancho, sin barras laterales de más.

## Al tenerlos

En `README.md`, cambiar los dos comentarios `TODO` por:

```markdown
![Un día con tu profesor: preparar una clase, leerla en Obsidian, preguntar y ponerse a prueba](docs/tutorial.gif)

<sub>Vídeo en mejor calidad: [docs/tutorial.mp4](docs/tutorial.mp4). Todo sale de un curso inventado.</sub>
```

```markdown
| Una clase preparada | Tu progreso |
|---|---|
| ![Una clase preparada](docs/capturas/clase.png) | ![Tu progreso](docs/capturas/progreso.png) |
```
