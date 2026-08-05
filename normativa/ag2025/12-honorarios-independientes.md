# Honorarios de independientes — base de la Fase 4b

Verificado 2026-08-04 contra el texto vigente de la Secretaría del Senado
(descarga directa, compilación al 15-07-2026).

## Art. 206 par. 5 (mod. art. 2, Ley 2277/2022) — texto completo

> "La exención prevista en el numeral 10 también procede en relación con las
> rentas de trabajo que no provengan de una relación laboral o legal y
> reglamentaria."

La Ley 2277 ELIMINÓ la condición anterior (Ley 2010: haber contratado menos de
dos trabajadores): hoy el 25% procede para cualquier independiente con rentas
de trabajo sin relación laboral.

## Art. 336 num. 4 (mod. art. 7, Ley 2277/2022) — la elección excluyente

> "…también se podrán restar los costos y los gastos asociados a rentas de
> trabajo que no provengan de una relación laboral o legal y reglamentaria,
> caso en el cual los contribuyentes deberán **optar entre restar los costos y
> gastos procedentes o la renta exenta** prevista en el numeral 10 del artículo
> 206…"

## Reglas del motor (módulo separado `depuracion/honorarios.ts`)

- Subcédula propia del 210 (casillas 43-57, columna "por honorarios… sujetos a
  costos y gastos"); NO se mezcla con las rentas de trabajo de asalariados.
- El motor calcula la cédula general COMPLETA en ambos modos (costos vs 25%) y
  elige el de menor renta líquida gravable — nada de aproximaciones. Empate:
  gana costos (no consume el límite del 40%).
- El 25% de honorarios comparte el tope de 790 UVT del 206-10 con el 25% del
  asalariado (misma exención): se calcula sobre el remanente.
- Aportes PILA del independiente: INCRNGO (arts. 55-56), casilla 44.
- Casillas por simetría de fila con la columna de trabajo del formulario:
  43 ingresos, 44 INCRNGO, 45 costos procedentes, 46 renta líquida,
  48/49 exentas, 53 limitadas, 57 renta líquida ordinaria.
- La retención del art. 383/392 practicada suma al total de retenciones.

Fuentes: http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr008.html
(206 par. 5) · …_pr014.html (336 num. 4).
