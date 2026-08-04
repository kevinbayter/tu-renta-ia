# Ganancias ocasionales — base de la Fase 3

Verificado 2026-08-04 (Secretaría del Senado al 15-07-2026, normograma y doctrina
DIAN). Tarifas y exenciones según Ley 2277/2022, sin cambios posteriores (la propuesta
de subir loterías al 30% se hundió con la reforma de dic-2025).

## Hecho generador y regla de los 2 años

- **Art. 300**: utilidad en venta de activo fijo poseído **≥2 años** = ganancia
  ocasional (precio − costo fiscal); **<2 años** = renta líquida ordinaria.
- **Art. 302**: herencias, legados, donaciones, actos gratuitos y porción conyugal.
- **Art. 303**: valor = el del bien a 31-dic del año anterior (dinero nominal,
  vehículos avalúo MinTransporte, inmuebles art. 277, acciones art. 272, usufructo
  5%/año hasta 70%).
- **Art. 303-1** (mod. L. 2277): indemnizaciones de seguros de vida — exentas hasta
  3.250 UVT, gravado el exceso.

## Tarifas

- **15%**: general — residentes (art. 314), no residentes (316), sociedades (313).
- **20%**: loterías, rifas, apuestas y similares (art. 317, nunca modificado).
  Retención del 20% sobre premios >48 UVT, descontable.

## Exenciones art. 307 (mod. Ley 2277)

1. Primeras **13.000 UVT** de la vivienda de habitación del causante.
2. Primeras **6.500 UVT** de otros inmuebles del causante.
3. Primeras **3.250 UVT** de porción conyugal/herencia/legado **por beneficiario**.
4. **20%** de lo recibido por no legitimarios y de donaciones, máx. **1.625 UVT**.
5. Libros, ropas, utensilios y mobiliario del causante.

## Art. 311-1 — venta de casa/apartamento de habitación (duda RESUELTA)

Texto vigente (mod. art. 31, Ley 2277):

- Exentas las primeras **5.000 UVT** de utilidad (bajó de 7.500).
- **El requisito de destinación SUBSISTE**: depositar la totalidad en cuenta AFC con
  destino a otra vivienda, O abonar directamente a los créditos hipotecarios del
  inmueble vendido (en ese caso sin pasar por AFC). Confirmado por Concepto DIAN
  100208192-87 (003028 int. 87 del 14-02-2024) y Concepto 011383 int. 433 del
  11-06-2024: el reglamento art. 1.2.3.1 DUT (Decreto 1920/2023) sigue aplicable.
- **El tope de 15.000 UVT de valor del inmueble fue ELIMINADO** por la Ley 2277.
- Aplica solo si la utilidad es ganancia ocasional (posesión ≥2 años).

## Reglas para el motor (Fase 3)

- Entrada por categoría: venta de activos (con fechas → el motor decide GO vs renta
  ordinaria), herencia/donación (por beneficiario y tipo de bien), premios (20%).
- Exenciones se restan ANTES de la tarifa; la exención 311-1 exige confirmar la
  destinación AFC/hipoteca — sin esa confirmación NO se aplica.
- `gananciaOcasionalNeta` alimenta la comparación patrimonial (hoy va 0).
- Casillas del bloque GO del 210 (estructura sin cambios desde AG2023): 112 ingresos,
  113 costos, 114 no gravadas y exentas, 115 gravables; 127 "Impuesto de ganancias
  ocasionales" (etiqueta verificada en el 210 de referencia del repo).

Fuentes: http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr012.html
(300, 302, 303) · …_pr013.html (307, 311-1, 313-317) ·
https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1920_2023.htm ·
https://www.dian.gov.co/normatividad/Documents/Concepto-100208192-87-14022024.pdf ·
https://www.dian.gov.co/Contribuyentes-Plus/Documents/CONCEPTO-011383-int-433-11062024.pdf
