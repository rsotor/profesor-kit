---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto, 02-02-01-ahorro-a-largo-plazo]
dificultad: 3
requiere: [capital, tipo-de-interes, interes-simple]
alias: []
tags: []
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés compuesto

> **En una frase:** Los intereses de cada periodo se suman al capital y desde entonces generan intereses ellos también: "interés sobre interés".

## El problema

Con [[interes-simple]], el dinero crece siempre lo mismo. Pero si los intereses ya cobrados se quedan dentro, ¿por qué no iban a trabajar también? Eso es lo que hace el compuesto, y por eso crece cada vez más rápido.

## El ejemplo

1.000,00 € al 5 % anual, 3 años, con intereses que se quedan dentro:

| Año | Capital al empezar | Intereses (5 % anual) | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del simple, hay **7,63 €** de diferencia. A 3 años parece poco, pero crece cada vez más rápido cuantos más años pasan.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

$C$ es el [[capital]], $i$ el tipo en tanto por uno y $n$ el número de periodos de [[capitalizacion]], en el mismo periodo que $i$ (tipo anual, $n$ en años). Aquí: $1.000 \times 1{,}05^3 = 1.157{,}63$ (en €).

## Con aportaciones periódicas

Visto en la clase 2.2. Si en vez de un solo capital metes una [[aportacion-periodica]], el interés compuesto se aplica a cada aportación: genera intereses desde el momento en que entra.

> **Supuesto:** aportación **al final de cada año**, 5 % anual, 3 años.

Ejemplo: 2.400,00 € cada año.

- Año 1: **2.400,00 €** (la primera aportación acaba de entrar, aún sin intereses).
- Año 2: 2.400,00 € × 1,05 + 2.400,00 € = **4.920,00 €**.
- Año 3: 4.920,00 € × 1,05 + 2.400,00 € = **7.566,00 €**.

Aportado: 7.200,00 €. Intereses: **366,00 €**. La primera aportación trabaja 2 años, la segunda 1 y la última ninguno: por eso el [[horizonte-temporal]] pesa tanto.

## El error típico

Mirar solo 3 años y concluir que simple y compuesto "dan casi lo mismo" (7,63 €). La diferencia es pequeña al principio y grande al final: en el test inicial confundiste cuál crece más rápido (prueba: test inicial, pregunta 4).

## Visto desde tus ingresos irregulares

Si aportas cuando cobras bien y nada en los meses flojos, el mecanismo sigue funcionando: cada aportación genera intereses desde que entra, sea cuando sea. Lo que más suma no es que sean iguales, sino que **entren pronto** y que no las saques.

## Practícalo

→ **[Simple o compuesto: qué cambia al mover los años y el tipo](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto.md)**

Cambia el número de años y el tipo, y mira cuándo la diferencia entre simple y compuesto se dispara y cuándo desaparece.

## Relacionados

- [[interes-simple]] — el contrapunto en línea recta
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuánto tarda en doblarse
- [[aportacion-periodica]] — el compuesto aplicado a cada aportación
- [[horizonte-temporal]] — cuantos más años, más pesa el compuesto
- [[inflacion]] — el interés solo hace crecer tu poder de compra si supera a la inflación

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
- **02-02-01-ahorro-a-largo-plazo** · ampliado: el compuesto aplicado a cada aportación periódica (supuesto: al final de cada año)
