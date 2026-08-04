# AFC, pensiones voluntarias y pagos por salud — base de la Fase 2

Verificado 2026-08-04 en la compilación de la Secretaría del Senado (actualizada al
15-07-2026) y doctrina DIAN. Ningún artículo tiene cambios posteriores a los citados;
la reforma pensional (Ley 2381/2024) remite a los arts. 55 y 126-1 sin modificarlos.

## Art. 126-1 — Aportes voluntarios a fondos de pensiones (renta EXENTA)

Última modificación: art. 15, Ley 1819/2016.

- Renta exenta hasta una suma que, **sumada a los depósitos AFC (126-4), no exceda el
  30% del ingreso laboral o tributario del año, con tope conjunto de 3.800 UVT/año**.
- Sujeta además al límite global del 40%/1.340 UVT (art. 336).
- Permanencia mínima 10 años, salvo requisitos de pensión, muerte/incapacidad o compra
  de vivienda. Retiro sin requisitos → retención contingente (fuera de alcance del
  motor: se detecta y advierte, no se liquida).

## Art. 126-4 — Cuentas AFC (renta EXENTA)

Última modificación: art. 16, Ley 1819/2016. Mismo límite CONJUNTO con 126-1
(30% / 3.800 UVT). Retiros solo para vivienda; antes de 10 años para otro fin →
pérdida del beneficio.

**Regla del motor:** un solo insumo `aportesAfcYPensionVoluntaria` (suma de ambos
certificados) limitado a min(30% × ingreso bruto laboral/tributario, 3.800 UVT),
como renta exenta de la subcédula de trabajo DENTRO del límite global.
Constante existente: `afcFvp: { porcentaje: 0.3, topeAnualUvt: 3_800 }`.

## Art. 55 — Aporte VOLUNTARIO a pensión obligatoria (RAIS) — INCRNGO

Última modificación: art. 31, Ley 2010/2019.

- Cotizaciones voluntarias al RAIS: **INCRNGO hasta el 25% del ingreso laboral o
  tributario anual, limitado a 2.500 UVT**.
- NO es renta exenta y NO consume el límite del 40% (es INCRNGO).
- Distinto del 126-1 — la entrevista debe distinguirlos por certificado.
- Retiros para fines distintos: renta gravada + retención 35% (fuera de alcance:
  detectar y advertir).

**Regla del motor:** insumo `aporteVoluntarioPensionObligatoria` como INCRNGO de la
subcédula de trabajo, limitado a min(25% × ingreso, 2.500 UVT). Nueva constante.

## Arts. 387 / 387-1 y doctrina — pagos por salud (16 UVT/mes)

- Art. 387 (mod. Ley 1607/2012; par. 2 numerales 2-3 modificados por **Ley 2411/2024**:
  hijos 18-25 en educación superior/técnica; hijos >18 con dependencia certificada).
- Caben en la deducción de salud: medicina prepagada (vigilada por Supersalud),
  **pólizas de salud** (vigiladas por Superfinanciera) y **planes voluntarios/
  complementarios de EPS** — doctrina DIAN: Oficio 23292 de 2019 y Oficio 359 de 2020.
- El aporte obligatorio a la EPS NO cuenta (ese es INCRNGO).

**Regla del motor:** sin cambio de cálculo (tope 16 UVT/mes ya implementado); cambia la
PREGUNTA de la entrevista para incluir planes complementarios de EPS y pólizas de salud.

Fuentes: http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr005.html
(126-1, 126-4) · …_pr002.html (55) · …_pr015.html (387) ·
https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_23292_2019.htm ·
https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_0359_2020.htm
