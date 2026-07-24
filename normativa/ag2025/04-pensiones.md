# Rentas de pensiones — año gravable 2025

Respaldo normativo de la cédula de pensiones implementada en `motor-fiscal`
(`depuracion/pensiones.ts`). Montos en pesos; UVT 2025 = $49.799.

## 1. Qué ingresos entran (art. 337 E.T.)

Pensiones de jubilación, invalidez, vejez, de sobrevivientes y sobre riesgos
laborales; indemnizaciones sustitutivas de las pensiones y devoluciones de
saldos de ahorro pensional. Es una **cédula separada** de la cédula general
(art. 335) — sus rentas exentas NO consumen el límite del 40%/1.340 UVT del
art. 336, que es exclusivo de la cédula general.

## 2. Ingresos no constitutivos de renta (casilla 100)

Aportes obligatorios a **salud** a cargo del pensionado y aportes al **fondo
de solidaridad pensional** (arts. 55-56 E.T.). En el certificado del fondo
(formato 220) llegan como "aportes obligatorios a salud".

## 3. Renta exenta (num. 5 art. 206 E.T., mod. Ley 2277 de 2022)

- Está exenta **la parte del pago mensual que no exceda de 1.000 UVT**
  ($49.799.000/mes en 2025).
- El parágrafo 3 (Ley 2277/2022, art. 2) extiende el mismo tratamiento a las
  pensiones **del exterior** y de organismos multilaterales.
- La exención no está condicionada al número de asignaciones recibidas
  (mesadas adicionales incluidas).

**Implementación**: renta exenta = min(renta líquida de pensiones,
1.000 UVT × meses con mesada en el año). Con mesadas uniformes el resultado es
idéntico al cálculo pago a pago; el número de meses se confirma en la
entrevista (`mesesConPension`, por defecto 12). Supuesto documentado: si las
mesadas del año no fueron uniformes y alguna superó 1.000 UVT, el cálculo mes
a mes exacto requiere el detalle mensual (fuera de alcance del certificado
anual).

## 4. Renta líquida gravable total (art. 331 E.T., mod. Ley 2277 de 2022)

Desde AG2023, la renta líquida gravable a la que se aplica la **tabla del
art. 241** es la **suma** de: cédula general (casilla 97) + cédula de
pensiones (casilla 103) + cédula de dividendos. Las pérdidas de una cédula no
se netean contra otra.

## 5. Casillas del formulario 210 (Res. DIAN 000044 de 2024)

| Casilla | Contenido                                                         |
| ------- | ----------------------------------------------------------------- |
| 99      | Ingresos brutos por rentas de pensiones del país y del exterior   |
| 100     | Ingresos no constitutivos de renta (salud + fondo de solidaridad) |
| 101     | Renta líquida (99 − 100)                                          |
| 102     | Rentas exentas de pensiones (num. 5 art. 206)                     |
| 103     | Renta líquida gravable cédula de pensiones (101 − 102)            |

## 6. Fuentes

- Estatuto Tributario arts. 206 (num. 5 y par. 3), 331, 337:
  https://estatuto.co/206 · https://actualicese.com/estatutotributario/206-2/
- Ley 2277 de 2022 (arts. 2 y 6):
  http://www.secretariasenado.gov.co/senado/basedoc/ley_2277_2022.html
- Formulario 210 oficial (casillas 99-103):
  https://www.dian.gov.co/atencionciudadano/formulariosinstructivos/Formularios/2024/Formulario_210_2024.pdf
- Doctrina sobre exención no condicionada al número de asignaciones:
  https://www.ambitojuridico.com/noticias/tributario/laboral-y-seguridad-social/exencion-de-renta-por-pensiones-no-esta-condicionada
