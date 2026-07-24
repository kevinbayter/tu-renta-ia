# Rentas no laborales — año gravable 2025

Respaldo normativo de la subcédula de rentas no laborales implementada en
`motor-fiscal` (`depuracion/no-laborales.ts`) y de la deduplicación de ingresos
por mandato en la exógena (`core/exogena/no-laborales.ts`).

## 1. Qué ingresos entran (art. 335 E.T.)

Son rentas no laborales todos los ingresos que no clasifiquen expresamente en
las demás rentas de la cédula general: arrendamientos recibidos a través de
contratos de **mandato** (inmobiliarias), honorarios sin vínculo, enajenaciones
de menos de 2 años, etc. Van en la columna "Rentas no laborales" de la cédula
general del 210.

## 2. Depuración (art. 336 E.T.)

- Renta líquida no laboral = ingresos brutos − INCRNGO − **costos y gastos
  procedentes** (art. 336 num. 4; para arriendos: predial del inmueble
  arrendado, administración, reparaciones locativas — con soporte).
- Los costos no pueden exceder los ingresos en esta implementación (las
  pérdidas cedulares y sus compensaciones —arts. 330/331— quedan fuera de
  alcance y documentadas como limitación).
- La renta líquida no laboral se suma a la renta líquida de la cédula general
  y la **base del límite del 40%/1.340 UVT** descuenta también los costos y
  gastos procedentes (art. 336 num. 4).

## 3. Casillas del formulario 210 (columna "Rentas no laborales")

| Casilla | Contenido                                           |
| ------- | --------------------------------------------------- |
| 74      | Ingresos brutos rentas no laborales                 |
| 76      | Ingresos no constitutivos de renta                  |
| 77      | Costos y gastos procedentes                         |
| 78      | Renta líquida (74 − 76 − 77)                        |
| 86      | Rentas exentas y deducciones imputables (limitadas) |
| 87      | Renta líquida ordinaria                             |
| 90      | Renta líquida ordinaria del ejercicio               |

(Numeración por paridad de filas con las columnas de trabajo y capital ya
calibradas contra una declaración real presentada.)

## 4. Duplicidad del mandato en la exógena

En contratos de mandato el MISMO ingreso suele aparecer DOS veces en la
exógena: lo reporta la inmobiliaria mandataria (concepto 4040) y también el
tercero pagador. La propia DIAN advierte en el reporte que la exógena "no
reemplaza la información de su realidad económica".

**Regla implementada**: las filas de ingresos no laborales (uso sugerido R74 o
concepto 4040) con el MISMO valor exacto reportado por informantes distintos se
cuentan UNA sola vez y se marcan como posible duplicado para que el usuario lo
confirme. Nunca se suman a ciegas.

## 5. Fuentes

- Estatuto Tributario arts. 335 y 336: https://estatuto.co/335 ·
  https://estatuto.co/336
- Resolución DIAN 000044 de 2024 (formulario 210):
  https://www.dian.gov.co/atencionciudadano/formulariosinstructivos/Formularios/2024/Formulario_210_2024.pdf
- Advertencia de la DIAN sobre la exógena (encabezado del propio reporte
  "Consulta de información reportada por terceros").
