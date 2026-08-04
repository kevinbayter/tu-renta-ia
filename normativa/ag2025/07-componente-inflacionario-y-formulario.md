# Componente inflacionario AG2025 y formulario 210 — fuentes en firme

Verificado 2026-08-04 sobre fuentes primarias (Diario Oficial / normograma DIAN).

## Componente inflacionario — Decreto 0898 del 29 de julio de 2026 (EN FIRME)

Reglamenta arts. 35, 38-41, 81, 81-1 y 118 E.T.; sustituye arts. 1.2.1.7.5,
1.2.1.12.6, 1.2.1.12.7 y 1.2.1.17.19 del DUT 1625/2016.

- **55,43%** de los rendimientos financieros percibidos por personas naturales no
  obligadas a llevar contabilidad **no constituye renta ni ganancia ocasional** por el
  año gravable 2025 (art. 1.2.1.12.6 DUT). Mismo porcentaje para utilidades de fondos
  mutuos/de inversión/de valores (art. 1.2.1.12.7).
- **28,35%** de los intereses y demás costos y gastos financieros **no es deducible**
  (art. 1.2.1.17.19 DUT).
- Interés presunto préstamos sociedad-socio AG2026: 9,09% (no aplica al motor PN).

Estado en el motor: `constantes/ag2025.ts` ya usa 0.5543 / 0.2835 → **confirmados en
firme**; se retira cualquier reserva de "proyecto de decreto".

Fuente: PDF Diario Oficial, repositorio SIDN Rama Judicial —
https://sidn.ramajudicial.gov.co/SIDN/NORMATIVA/TEXTOS_COMPLETOS/5_DECRETOS/DECRETOS%202026/Decreto%200898%20de%202026.pdf

## Formulario 210 AG2025 — sin resolución nueva

- La **Resolución DIAN 000044 del 14-03-2024** prescribió el 210 "para el año gravable
  2023 **y siguientes**" → aplica al AG2025 sin cambios de estructura.
- Instructivo ajustado por Resolución 000120 del 31-07-2024 (precisión del límite
  40%/1.340 UVT) sin cambio de casillas.
- Desde el 23-09-2025 ambas están compiladas en la **Resolución Única 000227 de 2025**
  (arts. 1.2.2.12 y 1.2.2.13) sin crear obligaciones nuevas.
- Casillas de control Ley 2277 (28, 111, 138-141) y bloque de ganancias ocasionales:
  idénticos desde AG2023. Solo cambian los valores por UVT 2025 ($49.799).

Estado en el motor: `formulario210/casillas.ts` sigue válido para AG2025.

Fuentes: https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0044_2024.htm ·
https://www.dian.gov.co/normatividad/Paginas/Resolucion-000227-del-23092025.aspx
