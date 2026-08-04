# Cobertura del flujo de declaración AG2025 — auditoría de código × investigación externa

Fecha: 2026-08-04. Cruza la auditoría del código (motor-fiscal, construir-perfil, entrevista)
con investigación en fuentes externas (DIAN, Actualícese, Gerencie, Siempre al Día, prensa
económica, foros Rankia/Reddit, comentarios de usuarios). Objetivo: que no se nos escape
ningún caso de declarante.

## 1. Veredicto general

- El **motor** es sólido y correcto para su alcance declarado (asalariado/pensionado con
  rentas de capital y no laborales simples). Todas las constantes AG2025 verificadas contra
  fuentes externas coinciden (UVT $49.799, tabla 241, 40%/1.340, 25%/790, dependientes,
  GMF 50%, FE 1%/240, componente inflacionario 55,43%, calendario Decreto 2229/2023).
- Las **brechas** están en (a) eventos que la entrevista no pregunta, (b) ganancias
  ocasionales y dividendos que el motor no liquida, y (c) beneficios que dejan plata al
  usuario sobre la mesa (AFC/FVP, costos de independientes).
- El riesgo más serio hoy: producir **silenciosamente** un borrador incompleto para
  usuarios con venta de activos, herencias, premios o cripto — sin preguntar ni advertir.

## 2. Motor: verificado ✓ / faltante ✗

| Regla                                                                                                             | Estado                                        | Nota                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Cédula general (trabajo/capital/no laborales) + pensiones, suma → tabla 241                                       | ✓                                             | art. 331, Ley 2277                                                                            |
| Límite 40%/1.340 UVT con FE y dependientes-336 por fuera                                                          | ✓                                             | correcto                                                                                      |
| Renta exenta 25% (790 UVT), cesantías (tabla 206-4), pensiones (1.000 UVT/mes)                                    | ✓                                             |                                                                                               |
| INCRNGO aportes obligatorios salud/pensión                                                                        | ✓                                             |                                                                                               |
| Componente inflacionario 55,43% ingresos                                                                          | ✓                                             | ⚠ decreto AG2025 aún en proyecto al investigar — confirmar número final antes de la temporada |
| GMF 50%, prepagada, intereses vivienda/ICETEX, dependientes 387+336                                               | ✓                                             |                                                                                               |
| Descuento donaciones ESAL (257/258)                                                                               | ✓                                             |                                                                                               |
| Anticipo 25/50/75 con procedimiento promedio                                                                      | ✓                                             | arts. 807-809                                                                                 |
| Comparación patrimonial 236-239                                                                                   | ✓                                             | pero recibe `gananciaOcasionalNeta: 0` fijo                                                   |
| Renta presuntiva                                                                                                  | ✓ (no aplica, 0% desde AG2021 — bien omitida) |                                                                                               |
| **Ganancias ocasionales** (15% general, 20% loterías; exenciones 307/311-1; casillas 82-88)                       | ✗                                             | fuera de alcance explícito                                                                    |
| **Cédula de dividendos** (tabla 241 + descuento 254-1 del 19% sobre exceso de 1.090 UVT; gravados al 35% primero) | ✗                                             | backlog                                                                                       |
| **AFC/FVP renta exenta** (30%/3.800 UVT, arts. 126-1/126-4)                                                       | ✗                                             | ¡la constante `afcFvp` existe en ag2025.ts pero nada la usa!                                  |
| **Aporte voluntario a pensión obligatoria** como INCRNGO (art. 55: 25%/2.500 UVT)                                 | ✗                                             | distinto de 126-1; confundirlos es error típico                                               |
| **Costos y gastos de independientes** (excluyente con el 25%, simular ambos)                                      | ✗                                             | rentas de trabajo solo modelan certificados 220; honorarios con costos no existen             |
| **Descuento impuestos pagados en el exterior** (254)                                                              | ✗                                             | ojo: NO aplica a servicios prestados desde Colombia (Oficio DIAN 901335/2022)                 |
| Beneficio de auditoría 689-3 (vigente AG2025: +35% → 6 meses, +25% → 12 meses, base ≥71 UVT)                      | ✗                                             | oportunidad de producto: sugerirlo, no solo liquidarlo                                        |
| Sanción por extemporaneidad (641/642, mínima 10 UVT 2026 = $523.740)                                              | ✗                                             | útil para declarantes atrasados                                                               |
| Formulario 160 activos en el exterior (>2.000 UVT a 1-ene)                                                        | ✗                                             | ni se detecta el caso                                                                         |

## 3. Entrevista: preguntas que faltan (por evento/perfil)

Hoy la entrevista cubre bien: meses trabajados, dependientes, prepagada, intereses
vivienda/ICETEX, GMF, bienes y deudas al 31-dic, declaraciones previas, pensiones,
arriendos precargados, donaciones, patrimonio anterior. Lo que NO pregunta:

**Eventos del año (disparan GO o patrimonio):**

- ¿Vendiste inmueble, vehículo u otro activo? → fecha compra/venta (regla 2 años:
  ≥2 años GO al 15%, <2 años renta ordinaria), costo fiscal, ¿era tu vivienda habitual?
  (exención 5.000 UVT art. 311-1 — Ley 2277 la bajó de 7.500 y eliminó el tope de avalúo;
  ⚠ verificar con concepto DIAN si subsiste el requisito AFC/hipoteca: fuentes divergen).
  El ingreso bruto de la venta obliga a declarar aunque no haya utilidad.
- ¿Recibiste herencia, legado o donación? → GO al 15% con exenciones 307 (13.000 UVT
  vivienda del causante, 6.500 otros inmuebles, 3.250 por heredero, 20%/1.625 no
  legitimarios). Hoy el flujo la esconde como "justificación patrimonial": cuadra el
  patrimonio pero omite el impuesto — riesgo de inexactitud.
- ¿Ganaste premios (lotería, rifa, apuestas online tipo BetPlay)? → GO al 20%, retención
  20% >48 UVT descontable; premios chicos acumulados igual se declaran; las casas legales
  reportan a la DIAN.
- ¿Compraste vivienda, vehículo u otro activo grande? → entra al patrimonio por costo
  fiscal y explica el salto patrimonial (hoy solo se captura si el usuario lo lista solo).

**Beneficios que dejan plata sobre la mesa:**

- ¿Aportaste a AFC o pensión voluntaria? ¿Retiraste (con/sin requisitos)? → certificados
  del fondo; distinguir 126-1/126-4 (exenta) de aporte voluntario al RAIS (INCRNGO 55).
- Independientes: ¿tienes gastos del negocio con factura electrónica? ¿cotizaste PILA?
  → simular costos vs 25% y elegir el mayor beneficio.
- ¿Plan complementario de EPS o póliza de salud? (sí es deducible como prepagada —
  duda #1 en foros).
- ¿Leasing habitacional? (los intereses cuentan como vivienda).

**Ingresos fuera de exógena (los que terminan en requerimiento):**

- ¿Ingresos de plataformas: Rappi/Uber/Airbnb/YouTube/Twitch/OnlyFans, ventas online,
  honorarios en efectivo, negocios informales?
- ¿Ingresos del exterior (freelance, salarios en divisas)? → TRM de percepción; el
  descuento 254 NO aplica si el servicio se prestó desde Colombia; ¿CDI con el país?
- ¿Dividendos recibidos? → certificado del emisor con gravado/no gravado.
- ¿Cripto? → patrimonio a costo fiscal aunque no vendas (omitirlo = sanción 200%
  art. 239-1); ventas/permutas realizan ingreso; exchange extranjero = activo en el
  exterior; desde AG2026 los exchanges reportan (Res. 000240/2025).
- ¿Cuentas/activos fuera de Colombia (Wise, Payoneer, PayPal, brokers)? → formulario 160
  si >2.000 UVT.
- ¿Inmuebles en copropiedad/sociedad conyugal? → cada quien declara su %.
- ¿Recibiste plata de terceros en tus cuentas (mandatos, "vaquitas")? → no es ingreso
  propio pero explica consignaciones; documentar en el momento.

## 4. Hallazgos de foros/usuarios (para UX y contenido)

1. Confusión #1: transferencias entre cuentas propias (banco↔Nequi↔Daviplata) duplican
   consignaciones y obligan a declarar sin ser ingreso. La plataforma debería explicarlo
   y pedir extractos, no sumar ciegamente.
2. "Declarar ≠ pagar" es el miedo #1 del primerizo — mensaje clave de onboarding.
3. La exógena trae errores de terceros (NIT/valores duplicados): conciliar contra
   certificados, no copiarla — ya lo hacemos bien con la precarga + confirmación.
4. Dependientes: exigir soportes (registro civil, certificado de estudios 18-23,
   certificación de contador para cónyuge/padres sin ingresos) — advertirlo al capturar.
5. La queja típica con plataformas automáticas no es "calculó mal" sino "no me preguntó
   por X" (plata de terceros, venta de activos, cripto, residencia fiscal) — exactamente
   las brechas de la sección 3.
6. Sanciones que la plataforma podría calcular: extemporaneidad 5%/mes (10% tras
   emplazamiento), corrección 10%/20%, mínima 10 UVT.

## 5. Verificaciones pendientes (normativa)

- Decreto definitivo del componente inflacionario AG2025 (55,43%/28,35% estaba en
  proyecto; nuestro valor coincide con el proyecto).
- Resolución DIAN que prescriba el formulario 210 AG2025 (plantilla del borrador).
- Art. 311-1 tras Ley 2277: confirmar si el requisito de AFC/abono a hipoteca subsiste
  (Concepto DIAN 100208192-87 lo trata; fuentes secundarias divergen).
- No implementar "tasa mínima 15%" para personas naturales: aplica a jurídicas (240 par. 6).

## 6. Hoja de ruta propuesta

- **P0 — Honestidad (bajo esfuerzo, alto riesgo evitado):** bloque de "eventos del año"
  en la entrevista (venta de activos, herencias/donaciones, premios/apuestas, cripto,
  ingresos exterior/plataformas, activos en el exterior). Si aparece algo que el motor no
  liquida → marcar la declaración con advertencia visible y no entregar el borrador como
  completo. Campos nuevos en RespuestasEntrevista + flag en el resultado.
- **P1 — Plata del usuario:** AFC/FVP como renta exenta (constante ya existe; un campo +
  suma en rentas-trabajo dentro del límite 40%) + aporte voluntario RAIS como INCRNGO +
  plan complementario EPS aclarado en la pregunta de prepagada.
- **P2 — Motor GO:** ganancias ocasionales completas (casillas 82-88, tarifas 15/20%,
  exenciones 307/311-1, regla 2 años) y alimentar la comparación patrimonial con la GO
  real en vez de 0.
- **P3 — Perfiles nuevos:** independientes con costos (simulación 25% vs costos),
  cédula de dividendos con descuento 254-1, detección formulario 160.
- **P4 — Producto:** beneficio de auditoría (sugerir cuando el impuesto neto crece ≥25/35%),
  calculadora de sanción por extemporaneidad para atrasados, explicador de consignaciones
  Nequi/Daviplata en el onboarding.
