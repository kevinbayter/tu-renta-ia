# Plan de cobertura completa del flujo de declaración — AG2025

Origen: `research/08-cobertura-flujo-declaracion-ag2025.md` (auditoría de código ×
investigación externa, 2026-08-04).

## Principios innegociables

1. **Normativa primero, código después.** Ninguna regla entra al motor sin su documento
   en `normativa/ag2025/` citando la fuente PRIMARIA vigente: texto actual del artículo
   del E.T. (secretariasenado), decreto reglamentario en firme o concepto DIAN
   (normograma). Fuentes secundarias (Actualícese, Gerencie) solo orientan la búsqueda.
2. **Solo normativa vigente.** Nada de proyectos de ley, proyectos de decreto ni normas
   caídas (ley de financiamiento archivada dic-2025, emergencia económica inexequible).
   Si una cifra depende de un decreto aún no expedido, la funcionalidad espera o se
   marca explícitamente como "pendiente de decreto" en la UI — nunca se asume.
3. **Nada mockeado ni simulado.** Todo lo que la UI muestre sale del motor determinista
   con sus tests. Lo que el motor aún no liquide NO se muestra como calculado: se
   detecta, se advierte y se excluye del borrador con aviso visible. "Simular
   alternativas" (25% vs costos) significa calcular AMBAS de verdad y elegir — no
   aproximar.
4. **Cada regla nueva llega con caso dorado.** Un ejemplo numérico completo, calculado a
   mano desde la norma y contrastado con un liquidador externo confiable, congelado como
   test (como `test/caso-dorado.test.ts` hoy).
5. **Toda cifra vive en `constantes/ag2025.ts`** con comentario de fuente; ninguna
   constante embebida en la lógica.

## Fase 0 — Gate normativo (bloquea a las demás) — ~2 días

Resolver con fuente primaria y documentar en `normativa/ag2025/`:

- [ ] Decreto definitivo del componente inflacionario AG2025 (¿55,43%/28,35% quedó en
      firme?). Si no está expedido: banner en el resultado indicando que el valor usa el
      proyecto de decreto y la declaración no debe presentarse hasta el decreto final.
- [ ] Resolución DIAN que prescribe el formulario 210 AG2025 (validar que nuestras
      casillas coincidan con el formulario oficial del año).
- [ ] Texto vigente del art. 311-1 (exención venta de vivienda): confirmar 5.000 UVT y
      si subsiste el requisito AFC/abono a hipoteca (Concepto DIAN 100208192-87).
- [ ] Texto vigente de: 126-1, 126-4, 55, 302-317 (GO), 242/254-1 (dividendos), 689-3
      (beneficio auditoría), 641-644 (sanciones). Un archivo por tema con el texto y la
      lectura que haremos.

Entregable: documentos en `normativa/ag2025/` — sin esto no se escribe código de las
fases 2+.

## Fase 1 — Detección honesta de eventos (P0) — ~3-4 días

Objetivo: nunca entregar un borrador incompleto en silencio. No hay matemática
tributaria nueva, solo detección y honestidad; por eso puede ir antes del gate.

- Nuevos campos estructurados en `RespuestasEntrevista` (booleans/montos):
  `vendioActivos`, `recibioHerenciaODonacion`, `ganoPremiosOApuestas`, `tieneCripto`,
  `tieneActivosExterior`, `tieneIngresosPlataformasOExterior`, `recibioDividendos`.
- Prompt de la entrevista: bloque "eventos del año" que pregunta cada uno una sola vez
  (con ejemplos coloquiales: BetPlay, Airbnb, YouTube, Binance, Wise…).
- El motor NO los liquida en esta fase: `construirPerfilFiscal` los traduce a
  `casosNoSoportados: CasoNoSoportado[]` en el resultado.
- UI: si hay casos no soportados, el paso Resultado muestra advertencia prominente
  ("Tu declaración incluye X, que TuRenta aún no liquida — este borrador está
  incompleto; consulta un contador antes de presentar"), el PDF del borrador lleva la
  misma marca de agua/nota, y el estado de la declaración queda "incompleta", no
  "completada".
- Tests: captura de campos, generación del flag, presencia del aviso en el borrador.

Criterio de aceptación: un usuario con herencia/venta/premio/cripto NUNCA recibe un
borrador que parezca terminado.

## Fase 2 — Beneficios vigentes que faltan (P1) — ~4-5 días

Con el gate de Fase 0 cerrado para 126-1/126-4/55/387-1:

- **AFC/FVP (renta exenta, dentro del límite 40%)**: campo con certificado del fondo;
  tope conjunto 30% del ingreso / 3.800 UVT (la constante `afcFvp` ya existe, hoy sin
  uso); entra a `rentas-trabajo.ts` como renta exenta sujeta al límite global.
  Retiros sin requisitos: fuera de alcance → detección Fase 1 (aviso), no cálculo.
- **Aporte voluntario a pensión obligatoria (RAIS)** como INCRNGO (art. 55: 25% del
  ingreso / 2.500 UVT), separado del 126-1 en la entrevista para no confundirlos.
- **Prepagada**: aclarar en la pregunta que planes complementarios de EPS y pólizas de
  salud cuentan (387-1); prorrateo por meses si aplica según el texto vigente.
- Entrevista: preguntas nuevas + regla de oro de no re-preguntar lo precargado.
- Caso dorado nuevo: asalariado con AFC + aporte voluntario RAIS + dependientes,
  verificando interacción con el límite 40%/1.340 y el orden de depuración.

## Fase 3 — Ganancias ocasionales (P2) — ~2 semanas

La brecha grande. Solo tras documentar 302-317 y 311-1 en Fase 0.

- Modelo: `GananciaOcasionalInput[]` con categorías:
  1. Venta de activo fijo poseído ≥2 años (utilidad = precio − costo fiscal; si <2 años
     va a renta ordinaria — el motor decide por fechas, no el usuario).
  2. Herencias/legados/donaciones (al costo fiscal del causante; exenciones art. 307
     por concepto: 13.000/6.500/3.250/20%-1.625 UVT).
  3. Loterías, rifas, apuestas (tarifa 20%, retención 20% >48 UVT como abono).
  4. Venta de vivienda de habitación: exención 5.000 UVT según lo que resuelva el gate
     del 311-1.
- Liquidación: tarifas 15%/20% separadas de la tabla 241; casillas del bloque GO del
  210 según el formulario oficial validado en Fase 0.
- Integración: `gananciaOcasionalNeta` real en la comparación patrimonial (hoy va 0);
  las retenciones de GO al total de retenciones.
- Entrevista: los eventos detectados en Fase 1 ahora capturan los datos duros (fechas,
  precios, costo fiscal, parentesco) en lugar de solo advertir. La advertencia se
  retira SOLO para las categorías ya implementadas.
- Casos dorados: uno por categoría, calculados a mano desde la norma + contraste con
  liquidador externo.

## Fase 4 — Perfiles nuevos (P3) — ~2-3 semanas

- **Independiente con costos**: ingresos por honorarios con costos y gastos procedentes
  (facturación electrónica, art. 107) EXCLUYENTE con la renta exenta del 25% (par. 5
  art. 206). El motor calcula ambas depuraciones completas y aplica la más favorable,
  mostrando la comparación al usuario. PILA del independiente como INCRNGO.
- **Cédula de dividendos**: no gravados a la tabla 241 con descuento 254-1 (19% sobre
  exceso de 1.090 UVT); gravados primero al 35%; certificado del emisor como fuente.
  Retención de dividendos al total de retenciones.
- **Activos en el exterior**: detección del umbral (2.000 UVT a 1-ene) y guía del
  formulario 160 con su plazo — NO diligenciamos el 160 en esta fase; aviso claro de
  esa obligación separada.
- Casos dorados por perfil.

## Fase 5 — Confiabilidad como producto (P4) — ~1 semana

- **Beneficio de auditoría (689-3, vigente AG2025)**: con el impuesto neto del año
  anterior ya capturado, calcular si el usuario queda en firmeza de 6/12 meses y
  mostrarle qué tan cerca está del umbral (35%/25%, base ≥71 UVT). Solo información
  calculada — jamás sugerir inflar impuesto.
- **Sanción por extemporaneidad** (641/642 + mínima 10 UVT del año de presentación):
  para quien declara tarde, cálculo real por meses de retraso.
- **Onboarding educativo**: explicador de consignaciones (transferencias entre cuentas
  propias, plata de terceros), "declarar ≠ pagar", soportes de dependientes.

## Verificación transversal (toda fase)

- `pnpm typecheck && pnpm lint && pnpm test` en verde + casos dorados nuevos.
- Revisión cruzada de cada cifra contra el doc de `normativa/` (el test cita el doc).
- Prueba end-to-end del wizard con el perfil de la fase (real, sin datos inventados en
  el código; fixtures de test claramente marcados como tales).
- El borrador 210 solo marca "Completada" cuando ningún `casoNoSoportado` queda activo.

## Orden y dependencias

```
Fase 0 (gate normativo)
  ├─ Fase 1 (no depende del gate — puede ir en paralelo)
  ├─ Fase 2 ← gate de 126-1/126-4/55/387-1
  ├─ Fase 3 ← gate de 302-317/311-1 + formulario 210 oficial
  ├─ Fase 4 ← gate de 242/254-1 + Fase 3 (comparte captura de eventos)
  └─ Fase 5 ← gate de 689-3/641-644 (independiente de 3 y 4)
```

Estimación total: ~6-8 semanas de trabajo efectivo. Cada fase termina desplegada y
usable por sí sola; ninguna deja estados intermedios visibles al usuario.
