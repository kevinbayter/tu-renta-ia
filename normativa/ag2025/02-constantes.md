# AG2025 — Constantes del motor fiscal

Espejo documental de `packages/motor-fiscal/src/constantes/ag2025.ts`. UVT 2025 = **$49.799** (Res. DIAN 000193/2024).

## Topes de obligados a declarar (arts. 592, 594-3 E.T.)

| Concepto                                                 | UVT   | Pesos       |
| -------------------------------------------------------- | ----- | ----------- |
| Patrimonio bruto 31-dic                                  | 4.500 | 224.095.500 |
| Ingresos brutos / consumos TC / compras / consignaciones | 1.400 | 69.718.600  |

## Depuración cédula general

| Constante                                             | Valor                                                           | Norma                    |
| ----------------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| Límite global exentas+deducciones                     | min(40% × (ingresos − INCRNGO), 1.340 UVT = 66.730.660)         | art. 336                 |
| Renta exenta 25% pagos laborales                      | tope 790 UVT/año = 39.341.210                                   | art. 206-10              |
| Dependientes 10% ingresos laborales                   | tope 32 UVT/mes (384 UVT/año = 19.122.816), prorrateo por meses | art. 387                 |
| Dependiente adicional (fuera del límite)              | 72 UVT = 3.585.528 c/u, máx. 4 (288 UVT = 14.342.112)           | art. 336-3               |
| Medicina prepagada / seguros salud                    | tope 16 UVT/mes (192 UVT/año = 9.561.408)                       | art. 387                 |
| Intereses vivienda                                    | tope 1.200 UVT = 59.758.800                                     | art. 119                 |
| Intereses ICETEX                                      | tope 100 UVT = 4.979.900                                        | art. 119                 |
| GMF (4×1000)                                          | 50% deducible, sin tope UVT                                     | art. 115                 |
| AFC + FVP + AVC (renta exenta)                        | 30% del ingreso, tope 3.800 UVT = 189.236.200                   | arts. 126-1/126-4        |
| Aportes voluntarios RAIS (INCRNGO)                    | 25% del ingreso, tope 2.500 UVT = 124.497.500                   | art. 55                  |
| 1% compras con factura electrónica (fuera del límite) | tope 240 UVT = 11.951.760                                       | art. 336-5               |
| Componente inflacionario ingresos                     | **55,43%**                                                      | decreto anual (proyecto) |
| Componente inflacionario gastos no deducibles         | 28,35%                                                          | decreto anual (proyecto) |
| Renta exenta pensiones                                | 1.000 UVT/mes (12.000 UVT/año)                                  | art. 206-5               |
| Renta presuntiva                                      | 0%                                                              | art. 188                 |

## Cesantías — % exento según ingreso mensual promedio últimos 6 meses (art. 206-4)

| Promedio (UVT) | Exento |
| -------------- | ------ |
| ≤ 350          | 100%   |
| >350–410       | 90%    |
| >410–470       | 80%    |
| >470–530       | 60%    |
| >530–590       | 40%    |
| >590–650       | 20%    |
| >650           | 0%     |

## Tabla impuesto (art. 241) — en UVT

| Desde   | Hasta  | Tarifa marginal | UVT a sumar |
| ------- | ------ | --------------- | ----------- |
| 0       | 1.090  | 0%              | 0           |
| 1.090   | 1.700  | 19%             | 0           |
| 1.700   | 4.100  | 28%             | 116         |
| 4.100   | 8.670  | 33%             | 788         |
| 8.670   | 18.970 | 35%             | 2.296       |
| 18.970  | 31.000 | 37%             | 5.901       |
| >31.000 | ∞      | 39%             | 10.352      |

Fórmula: `impuesto_UVT = (base_UVT − desde) × tarifa + sumar`

## Anticipo (arts. 807-809)

- 1.ª declaración: 25% · 2.ª: 50% · 3.ª+: 75% del impuesto neto.
- Procedimiento 1: impuesto neto año actual × %. Procedimiento 2 (desde 2.ª): promedio impuesto neto 2 últimos años × %. Se elige el menor; se restan retenciones del año; mínimo 0.

## Ganancias ocasionales

- General 15% (art. 314) · Loterías/rifas/apuestas 20% (art. 317).
- Exentas: casa habitación 5.000 UVT; vivienda causante 13.000; otros inmuebles causante 6.500; porción conyugal 3.250; donaciones a no legitimarios 20% máx. 1.625; seguros de vida 3.250.

## Redondeo

Art. 577 E.T.: múltiplo de mil más cercano, por casilla del formulario.
