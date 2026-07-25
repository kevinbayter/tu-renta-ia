# Caso de prueba dorado — Ana Ramírez, Año Gravable 2025 (referencia, elaborada 2026-07-18)

Este documento consolida los datos de entrada (documentos en `/docs`) y el resultado esperado
(resumen de referencia) que nuestra plataforma debe reproducir exactamente.

## Resultado esperado (referencia)

| Concepto                                                | Valor                                     |
| ------------------------------------------------------- | ----------------------------------------- |
| **Impuesto a pagar**                                    | **$0**                                    |
| **Total saldo a favor (casilla 137)**                   | **$1.401.000**                            |
| Impuesto neto de renta / total a cargo                  | $1.217.000                                |
| Renta líquida gravable cédula general (casilla 97)      | $60.689.000                               |
| Retenciones AG a declarar (casilla 132)                 | $825.000                                  |
| Saldo a favor año anterior sin devolución (casilla 131) | $1.793.000                                |
| Anticipo año siguiente (casilla 133)                    | $0 (por 75% regla: 608.500 − 825.000 < 0) |
| Patrimonio bruto (casilla 29)                           | $69.875.000                               |
| Deudas (casilla 30)                                     | $0                                        |

## Depuración referencia — Cédula general, rentas de trabajo

- Ingreso bruto rentas de trabajo: **113.234.000** (= 220 ANDINA 95.741.000 + 220 PTC 17.493.000)
- INCRNGO aportes seguridad social: **6.184.000** (= salud 2.126.000 + pensión 2.638.000 [ANDINA] + salud 631.000 + pensión 789.000 [PTC])
- Renta líquida: 107.050.000
- Deducciones: dependientes económicos **11.323.000** (10% del ingreso, tope 32 UVT/mes × 11 meses trabajados), plan adicional salud (medicina prepagada Salud Prepagada) **3.200.000** (3.199.749 aprox; nota: certificado 2 de 407.793 con vigencia 24/11/2025–30/04/2026 NO se sumó — referencia solo tomó 3.199.749)
- Rentas exentas: cesantías **11.691.000** (= pagadas 5.535.000 + consignadas 6.156.000; exentas por ingreso promedio ≤ 350 UVT), 25% pagos laborales **20.209.000**
- Renta exenta + deducciones imputables limitadas: **43.114.000** (límite 40% = min(40% × (114.409.000 − 6.623.000) = 43.114.400; 1.340 UVT = 66.730.660))
- Renta cedular trabajo: **63.936.000**

## Rentas de capital

- Ingresos: **1.175.000** (= Nu rendimientos 786.273 + rendimientos cesantías Colfondos 382.694 + FICs Ejemplo Dos 6.103 + Fiduciaria Uno ~471 + Fiduciaria Tres 47.272 → referencia usó 786.000 + 383.000 + 6.000)
- INCRNGO componente inflacionario **55,43%**: 439.000 (sobre 786.000+6.000, no sobre rendimientos de cesantías)
- Deducción GMF 50%: 17.000 (Nu GMF 2.019… referencia reporta GMF total 34.913 → 50% = 17.457 ≈ 17.000)
- Renta cedular capital: **736.000**

## Deducciones NO sujetas al límite del 40%

- Dependientes adicionales (72 UVT × 1 dependiente, proporcional?): **3.586.000** (casillas 138=1, 139)
- 1% compras con factura electrónica: **397.000** (exógena DIAN: monto susceptible de beneficio 39.680.528 × 1% = 396.805)
- Límite total resultante: 47.097.000

## Cálculo impuesto (art. 241 E.T.)

- RLG total: 60.689.000 = 1.219 UVT (UVT 2025 = 49.799 → 66.730.660/1.340 confirma UVT=49.799)
- Rango 1.090–1.700 UVT: (1.219 − 1.090) × 19% = 24,51 UVT → impuesto **1.217.000**
- Anticipo: primera vez declara con impuesto (impuesto año anterior 0) → 75%? referencia usó porcentaje 75% sobre promedio… Subtotal 608.500 (promedio de 0 y 1.217.000), 75% = 456.375, menos retenciones 825.000 → 0.
  - OJO: 75% con promedio de dos años = tercer año en adelante; verificar por qué referencia usó promedio y 75%.

## Patrimonio (31-dic-2025)

| Activo                              | Valor          |
| ----------------------------------- | -------------- |
| Bienes personales                   | 24.500.000     |
| Ejemplo Dos cuenta                  | 6.909          |
| Nu cuenta ahorros                   | 20.902.486     |
| FIC Ejemplo Dos                     | 15.205         |
| Fondo Uno (Fiduciaria Uno)          | 1.467.428      |
| Comisionista (Comisionista Ejemplo) | 682.355        |
| CxC apartamento                     | 20.900.000     |
| CxC Saldo a favor DIAN              | 1.401.000      |
| **Total**                           | **69.875.000** |

Nota: patrimonio bruto año anterior (AG2024): 45.053.000. No incluyó saldos menores (Pagos Digitales 5.001, Billetera Digital 165, Colfondos cesantías saldo?, activos laborales PTC 682.052) — revisar criterio.

## Retenciones AG2025

| Fuente                      | Valor                                      |
| --------------------------- | ------------------------------------------ |
| ANDINA (trabajo)            | 386.000                                    |
| PTC/WOM (trabajo)           | 396.000                                    |
| Nu (rendimientos)           | 42.540                                     |
| Fiduciaria Tres Fiduciaria  | 3.309                                      |
| Fiduciaria Uno              | 13+15                                      |
| **Total usado por referencia** | 825.000 (trabajo 782.000 + capital 43.000) |

## Documentos fuente en /docs

1. `resumen-TI-…pdf` — Resumen referencia con depuración completa + borrador 210 (páginas 7-14).
2. `reporteExogena2025.xlsx` — Consulta información reportada por terceros DIAN (topes: ingresos 114.456.920, patrimonio 45.053.000, TC 42.112.060, movimientos 143.226.272, compras 44.694.376).
3. `2026-04-01_Certificado…PTC.pdf` — 220 Servicios Telecom 04/11–31/12/2025: brutos 17.493.000, salud 631.000, pensión 789.000, ret. 396.000, prom. 6 meses 7.885.000.
4. `certificado-220-empleador-1.pdf` — 220 ANDINA 01/01–09/09/2025: brutos 95.741.000 (salarios 52.926.000, prestaciones 9.275.000, otros 21.849.000, cesantías pagadas 5.535.000, cesantías consignadas 6.156.000), salud 2.126.000, pensión 2.638.000, ret. 386.000, prom. 6 meses 6.403.000.
5. `certificado-bancario.pdf` — Nu: saldo 20.902.486, rendimientos 786.273, GMF 2.019, ret. 42.541, componente inflacionario 435.831 (55,43%).
6. `Retefuente_…unlocked.pdf` — Salud Prepagada medicina prepagada: 3.199.749 (vig. hasta 31/10/2025) + 407.793 (vig. 24/11/2025–30/04/2026, no usado por referencia). ⚠️ Los nombres de archivo están cruzados respecto a su contenido.

## Preguntas abiertas a validar con la investigación

1. ¿Por qué la deducción de dependientes 10% dio 11.323.000 exacto (=10% de 113.234.000, sin tope mensual aplicado)? Tope = 32 UVT × 11 meses = 17.529.248 → no limitó.
2. Regla exacta de "dependientes adicionales" 72 UVT (art. 336 num. 3): 72 × 49.799 = 3.585.528 ≈ 3.586.000 ✓ (no prorratea por meses).
3. Componente inflacionario AG2025 = 55,43% (confirmar decreto).
4. Regla de anticipo aplicada (75% y promedio) — verificar si corresponde a 3.ª declaración.
5. GMF total 34.913: Nu certifica 2.019 → el resto (≈32.894) debió venir de otra fuente (Ejemplo Dos?) — el usuario lo habrá informado manualmente.
6. Bienes personales 24.500.000 y CxC apartamento 20.900.000: datos manuales del usuario (no vienen en exógena; exógena muestra 20.900.000 como "inversión en FIC Ejemplo Dos durante el año" — referencia lo trató como CxC según respuesta del usuario).
