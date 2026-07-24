# Informe: Información exógena DIAN y documentos fuente para una plataforma de declaración de renta (persona natural, Colombia)

> Alcance: este informe consolida investigación web (DIAN oficial, referencia, Actualícese, Gerencie, prensa especializada) sobre los insumos que usa una plataforma tipo referencia para armar el borrador del formulario 210. Donde la fuente es secundaria o el dato varía por año gravable, lo señalo explícitamente.

---

## 1. La "Consulta de información reportada por terceros" (exógena) que descarga la persona natural

### Qué es

Es un reporte personalizado que la DIAN arma cada año con lo que **terceros** (empleadores, bancos, fiduciarias, fondos de pensiones y cesantías, notarías, comercios, aseguradoras, EPS, etc.) reportaron sobre el contribuyente en la información exógena tributaria (arts. 631 y ss. del E.T.). Se habilita típicamente a mediados de julio del año en que se declara y está disponible desde el año gravable 2014 en adelante.

### Cómo se accede (flujo exacto que tu plataforma debe instruir al usuario)

1. Ingresar a www.dian.gov.co → menú **Transaccional** → "Usuario Registrado", ingresando **"A nombre propio"** con cédula y contraseña (requiere estar inscrito en el RUT y tener cuenta habilitada).
2. En el tablero, opción **"Consultar información exógena / Información reportada por terceros"**.
3. Aceptar condiciones del servicio.
4. Seleccionar el **año gravable** y clic en "Consultar".
5. Clic en **Guardar**: se descarga un archivo **Excel (.xls/.xlsx)**.

Fuentes: [Micrositio DIAN – Información reportada por terceros](https://micrositios.dian.gov.co/renta-personas-naturales-ag-2021/informacion-reportada-por-terceros-informacion-exogena/), [DIAN AG2020](https://www.dian.gov.co/impuestos/personas/Renta-Personas-Naturales-AG-2020/Paginas/Informacion-reportada-por-terceros-Exogena.aspx), [referencia – blog exógena](https://www.plataforma de referencia), [referencia – ayuda exógena](https://www.plataforma de referencia), [La FM – paso a paso 2026](https://www.lafm.com.co/economia/declaracion-renta-2026-dian-descargar-informacion-exogena-405736).

### Estructura del Excel

Columnas del cuerpo del reporte (fuentes secundarias coinciden en ~este orden; valida contra un archivo real, porque la DIAN ha agregado columnas con los años):

| Columna                               | Contenido                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| NIT del informante                    | Quién reportó (banco, empleador...)                                                                                 |
| Nombre / razón social del informante  |                                                                                                                     |
| Identificación y nombre del reportado | El contribuyente                                                                                                    |
| **Concepto**                          | Código formato+concepto DIAN (p. ej. 1001/5063, 2276)                                                               |
| **Detalle** ("información reportada") | Texto legible: "Pagos por salarios", "Valor del movimiento cuenta de ahorros", "Consumos con tarjeta de crédito"... |
| **Valor**                             | Monto anual reportado                                                                                               |
| **Uso Declaración Sugerida**          | Renglón del 210 al que la DIAN lleva ese valor (R29, R32, R33, R58, R132... o "No aplica") — ver sección 3          |
| **Topes (1 a 5)**                     | Marcación de a cuál(es) de los 5 requisitos de obligados a declarar suma esa fila                                   |

Fuentes: [Leegales – consultar reporte de terceros](https://leegales.com/consultar-informacion-la-para-declaracion-de-renta/), [ConsultorContable](https://www.consultorcontable.com/informaci%C3%B3n-reportada-por-terceros/), [Colombia.com – exógena y topes](https://www.colombia.com/actualidad/economia/declaracion-de-renta-2026-dian-habilita-consulta-de-exogena-y-topes-593159), [Bluradio](https://www.bluradio.com/economia/declaracion-renta-2026-dian-consulta-informacion-exogena-topes-calendario-so35).

### Los "Topes 1–5"

Corresponden a los **5 requisitos concurrentes para NO estar obligado a declarar** (arts. 592, 594-3 E.T.): el archivo suma automáticamente lo reportado por cada dimensión y lo compara con el umbral. Superar **uno solo** obliga a declarar:

| Tope | Concepto                                                            | Umbral (AG 2025, UVT $49.799) |
| ---- | ------------------------------------------------------------------- | ----------------------------- |
| 1    | **Ingresos brutos** del año                                         | ≥ 1.400 UVT ($69.719.000)     |
| 2    | **Patrimonio bruto** a 31 de diciembre                              | ≥ 4.500 UVT ($224.096.000)    |
| 3    | **Consumos con tarjeta de crédito**                                 | > 1.400 UVT                   |
| 4    | **Consignaciones bancarias, depósitos o inversiones** (movimientos) | > 1.400 UVT                   |
| 5    | **Compras y consumos totales**                                      | > 1.400 UVT                   |

(Además: no ser responsable de IVA. Los valores en pesos cambian cada año con la UVT — tu plataforma debe parametrizarlos por año gravable. Nota: Tope 2 toma el mayor entre lo reportado del año y el patrimonio bruto declarado el año anterior.)

Fuentes: [El País – requisitos para no declarar](https://www.elpais.com.co/economia/declaracion-de-renta-2025-requisitos-para-no-declarar-ante-la-dian-en-2026-1700.html), [Colombia.com](https://www.colombia.com/actualidad/economia/declaracion-de-renta-2026-dian-habilita-consulta-de-exogena-y-topes-593159), [Gestión Legal Colombia](https://gestionlegalcolombia.com/entrar-a-la-dian-rut-clave-exogena/).

### Advertencias clave (importantes para el disclaimer de tu producto)

- La DIAN insiste: la exógena **"NO ES IMPRESCINDIBLE"** y **no reemplaza la realidad económica** del contribuyente; puede estar incompleta o con errores.
- La foto es **al corte de descarga**: los informantes corrigen/adicionan y el archivo cambia (correcciones visibles ~2 semanas después).
- Errores solo los corrige el **tercero informante**, no la DIAN.

Fuentes: [Micrositio DIAN](https://micrositios.dian.gov.co/renta-personas-naturales-ag-2021/informacion-reportada-por-terceros-informacion-exogena/), [ConsultorContable](https://www.consultorcontable.com/informaci%C3%B3n-reportada-por-terceros/).

---

## 2. Catálogo de formatos/conceptos de exógena relevantes para persona natural

Formatos que alimentan el reporte de terceros (con versión vigente reciente):

| Formato          | Qué reporta                                                              | Quién lo reporta                                               | "Detalles" típicos que verás en el Excel                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2276** (v3+)   | Rentas de trabajo y de pensiones (espejo del certificado 220)            | Empleadores / pagadores de rentas de trabajo y pensiones       | Pagos por salarios; honorarios; servicios; comisiones; prestaciones sociales; viáticos; gastos de representación; **cesantías e intereses efectivamente pagados**; **cesantías consignadas al fondo**; pensiones; **aportes obligatorios a salud**; **aportes obligatorios a pensión**; aportes voluntarios FVP; aportes AFC; **retenciones practicadas** |
| **1001** (v10)   | Pagos o abonos en cuenta y retenciones practicadas                       | Empresas pagadoras (aplica al usuario cuando fue beneficiario) | Conceptos 5001 salarios, 5002 honorarios, 5003 comisiones, 5004 servicios, 5005 arrendamientos, 5006 intereses causados, **5063 intereses y rendimientos financieros efectivamente pagados**, dividendos, compras                                                                                                                                         |
| **1003** (v7)    | Retenciones en la fuente que le practicaron                              | Agentes de retención                                           | Retefuente por salarios, honorarios, rendimientos, etc.                                                                                                                                                                                                                                                                                                   |
| **1019** (v9)    | **Movimientos y saldos de cuentas corrientes y de ahorro**               | Bancos                                                         | "Saldo a 31 de diciembre cuenta de ahorros/corriente", "Valor del movimiento (consignaciones)", intereses                                                                                                                                                                                                                                                 |
| **1020** (v8)    | Inversiones en **CDT**                                                   | Bancos                                                         | Valor inicial, saldo, rendimientos                                                                                                                                                                                                                                                                                                                        |
| **1021** (v7)    | **Fondos de inversión colectiva** (carteras colectivas, fiduciarias)     | Sociedades fiduciarias / comisionistas                         | Saldos a 31 dic, aportes, retiros, rendimientos                                                                                                                                                                                                                                                                                                           |
| **1022** (v9)    | Aportes a **fondos de pensiones voluntarias y cuentas AFC/AVC**          | AFP / bancos                                                   | Aportes del año, saldos, retiros con/sin requisitos                                                                                                                                                                                                                                                                                                       |
| **1023** (v6)    | **Consumos con tarjetas de crédito/débito**                              | Bancos emisores                                                | "Consumos con tarjeta de crédito" (alimenta Tope 3)                                                                                                                                                                                                                                                                                                       |
| **1024** (v6)    | Ventas con tarjetas (para comercios)                                     | Adquirentes                                                    | —                                                                                                                                                                                                                                                                                                                                                         |
| **1026** (v6)    | **Préstamos otorgados** (saldo de deudas)                                | Bancos                                                         | "Saldo del préstamo a 31 de diciembre" → deudas (R30)                                                                                                                                                                                                                                                                                                     |
| **2273**         | Títulos valores y **dividendos** depositados                             | Depósitos de valores (Deceval) / sociedades                    | Dividendos pagados, acciones poseídas                                                                                                                                                                                                                                                                                                                     |
| **2274** (v1–2)  | **Fondos de cesantías**: saldos y aportes por afiliado (art. 631-3 E.T.) | AFP de cesantías                                               | Cesantías consignadas, retiros, saldo a 31 dic                                                                                                                                                                                                                                                                                                            |
| **5247/5248...** | Facturación electrónica (compras del contribuyente identificado)         | Sistema de factura electrónica                                 | "Compras reportadas en facturación electrónica" (alimenta Tope 5 y la deducción del 1% del art. 336 num. 5)                                                                                                                                                                                                                                               |

Fuentes: [Wiki Numera – formatos exógena](https://wiki.esnumera.com/wiki/Informaci%C3%B3n_ex%C3%B3gena_tributaria_DIAN), [Siempre al Día – conceptos formato 1001](https://siemprealdia.co/colombia/impuestos/listado-conceptos-del-formato-1001/), [Actualícese – conceptos 5006/5063/5079](https://actualicese.com/exogena-2021-como-utilizar-los-conceptos-5006-5063-y-5079/), [Siempre al Día – formato 2276](https://siemprealdia.co/colombia/impuestos/formato-2276-informacion-exogena/), [Resolución 162 de 2023 (SUIN-Juriscol)](https://www.suin-juriscol.gov.co/viewDocument.asp?id=30050325), [DIAN – Presentación exógena](https://www.dian.gov.co/impuestos/sociedades/ExogenaTributaria/Presentacion/Paginas/default.aspx), [Alegra – guía formatos exógena](https://blog.alegra.com/colombia/formatos-de-informacion-exogena/).

Significado de los "Detalles" más frecuentes para el motor de tu plataforma:

- **"Pagos por salarios / prestaciones sociales / otros pagos laborales"** → ingreso bruto renta de trabajo.
- **"Cesantías consignadas al fondo"** → ingreso fiscal realizado (desde AG2017 se realizan al consignarse) + posible renta exenta num. 4 art. 206 E.T.
- **"Aportes obligatorios salud / pensión"** → ingreso no constitutivo de renta (INCR).
- **"Rendimientos financieros pagados" (5063)** → ingreso bruto renta de capital; su **componente inflacionario** es INCR (arts. 38-41 E.T., % anual por decreto).
- **"Saldo cuentas a 31 dic" / "saldo fondos"** → patrimonio bruto.
- **"Valor del movimiento"** → NO es ingreso ni patrimonio; solo sirve para el Tope 4 (error clásico del usuario que tu producto debe prevenir).
- **"Consumos tarjeta de crédito"** → solo Tope 3, no va a ningún renglón.
- **"Compras con factura electrónica"** → Tope 5 + insumo de la deducción del 1% (casilla 28/297 del 210).

---

## 3. Columna "Uso Declaración Sugerida": mapeo a renglones del formulario 210

**Confirmado**: los códigos "R##" corresponden a las **casillas del formulario 210** (versión AG2023 y siguientes, prescrita por la DIAN). Verificado contra el instructivo del 210 publicado por la DIAN ([PDF Formulario 210 e instructivo 2024](https://www.dian.gov.co/atencionciudadano/formulariosinstructivos/Formularios/2024/Formulario_210_2024.pdf), también [2025](https://www.dian.gov.co/atencionciudadano/formulariosinstructivos/Formularios/2025/Formulario_210_2025.pdf)):

| Código   | Casilla 210 (nombre oficial)                                                   | Qué llega ahí desde exógena                                                       |
| -------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **R29**  | Total patrimonio bruto                                                         | Saldos de cuentas a 31 dic (1019), CDT (1020), fondos (1021/1022), títulos (2273) |
| **R30**  | Deudas                                                                         | Saldos de préstamos (1026)                                                        |
| **R32**  | Ingresos brutos de las rentas de trabajo                                       | Salarios, prestaciones, cesantías pagadas/consignadas (2276)                      |
| **R33**  | Ingresos no constitutivos de renta – rentas de trabajo                         | Aportes obligatorios a salud y pensión (2276)                                     |
| **R35**  | Rentas exentas – aportes voluntarios AFC, FVP y AVC                            | Aportes 1022 / 2276                                                               |
| **R36**  | Rentas exentas – otras rentas exentas (rentas de trabajo)                      | Cesantías exentas num. 4 art. 206, indemnizaciones, etc.                          |
| **R43**  | Ingresos brutos rentas de trabajo sin relación laboral (honorarios con costos) | Honorarios/servicios (1001/2276)                                                  |
| **R58**  | Ingresos brutos de las rentas de capital                                       | Rendimientos financieros pagados (5063, 1019-1021)                                |
| **R59**  | Ingresos no constitutivos de renta – rentas de capital                         | Componente inflacionario de rendimientos                                          |
| **R74**  | Ingresos brutos de las rentas no laborales                                     | Ventas de bienes, otros ingresos                                                  |
| **R99**  | Ingresos brutos por rentas de pensiones                                        | Mesadas pensionales (2276)                                                        |
| **R112** | Ingresos por ganancias ocasionales                                             | Loterías, ventas de activos ≥2 años, herencias                                    |
| **R130** | Anticipo renta liquidado año gravable anterior                                 | (de la declaración anterior, no de exógena)                                       |
| **R131** | Saldo a favor del año anterior sin solicitud de devolución/compensación        | (de la declaración anterior)                                                      |
| **R132** | Retenciones año gravable a declarar                                            | Todas las retenciones reportadas (2276, 1003, 1001)                               |

Notas de implementación:

- Filas con "No aplica" en esa columna (movimientos, consumos TC, compras FE) **no** deben sumarse a ningún renglón.
- Este mapeo es exactamente el que usa la DIAN para prellenar la **declaración sugerida** y el SI de Diligenciamiento; es la "spec" natural del motor de tu plataforma. No hay un documento público de la DIAN que enumere la tabla completa R##→detalle; se reconstruye del propio Excel + instructivo del 210 (mantener la tabla por año gravable, pues la numeración del 210 cambia si la DIAN prescribe nuevo formulario).

Fuentes adicionales: [Gerencie – renglón de retenciones (132)](https://www.gerencie.com/qa/en-que-renglon-del-formulario-210-se-incluyen-las-retenciones-en-la-fuente-practicadas-1632/), [Siempre al Día – formulario 210](https://siemprealdia.co/colombia/impuestos/formulario-210-para-declaraciones-de-renta-de-personas-naturales-residentes/).

---

## 4. Certificado 220 (certificado de ingresos y retenciones por rentas de trabajo y pensiones)

Es el certificado anual que el **empleador** entrega al trabajador; su contenido es espejo del formato 2276 que ese mismo empleador reporta en exógena (deben cuadrar — validación clave para tu plataforma).

### Estructura de casillas (bloque 36–60)

⚠️ La numeración cambió con la Resolución 000022 de 2024 (AG2023+) y ajustes de la Resolución 000120 de 2024 (AG2024). Estructura por bloques:

**Bloque ingresos (36–52):**

- **36** Pagos por salarios
- 37–38: pagos con bonos/vales y "Valor del exceso de los pagos por alimentación mayores a 41 UVT, art. 387-1 E.T."
- 39-41: honorarios (incluye emolumentos eclesiásticos), servicios, comisiones
- 42-46: prestaciones sociales; viáticos; gastos de representación; compensaciones trabajo asociado cooperativo; otros pagos
- **47** Auxilio de cesantía e intereses **efectivamente pagados** al empleado
- **48** Auxilio de cesantía reconocido a trabajadores del **régimen tradicional del CST**
- **49** Auxilio de cesantía **consignado al fondo de cesantías**
- **50** Pensiones de jubilación, vejez o invalidez
- **51** Apoyos económicos educativos financiados con recursos públicos
- **52** Total ingresos brutos

**Bloque aportes (53–58):**

- **53** Aportes obligatorios a salud
- **54** Aportes obligatorios a pensión y fondo de solidaridad
- **55** Cotizaciones voluntarias RAIS
- **56** Aportes voluntarios a fondos de pensiones voluntarias (FVP)
- **57** Aportes a cuentas AFC
- **58** Aportes a cuentas **AVC**

**Bloque final:**

- **59** Ingreso laboral promedio de los últimos seis meses (para exención de cesantías, num. 4 art. 206)
- **60** Valor de la **retención en la fuente** por ingresos laborales y de pensiones

### Mapeo 220 → 210 (regla del motor)

| 220                                                                               | 210                                 |
| --------------------------------------------------------------------------------- | ----------------------------------- |
| Salarios + demás pagos + cesantías pagadas/consignadas (36–51)                    | Casilla **32** (o 99 si es pensión) |
| Aportes obligatorios salud + pensión (53-54)                                      | Casilla **33**                      |
| Aportes FVP + AFC + AVC (55-58)                                                   | Casilla **35**                      |
| Cesantías con exención parcial (usando casilla 59 y la tabla del num. 4 art. 206) | Casilla **36**                      |
| Retención (60)                                                                    | Casilla **132**                     |

Fuentes: [Bitakora – certificado vigente y cambios de casillas](https://recursos.bitakora.co/blog/certificado-ingresos-y-retenciones-vigente-dian/), [Actualícese – liquidador 220/2276 AG2024](https://actualicese.com/liquidador-certificado-de-ingresos-y-retenciones-plantilla-del-formulario-220-y-del-formato-2276-ag-2024/) y [AG2025](https://actualicese.com/liquidador-certificado-de-ingresos-y-retenciones-plantilla-del-formulario-220-y-del-formato-2276-ag-2025/), [Resolución 000120 de 2024 (DIAN)](https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000120%20de%2031-07-2024.Pdf), [referencia – certificado 220](https://www.plataforma de referencia).

**Recomendación de diseño**: parsear el 220 por **etiquetas de texto**, no por número de casilla, porque la numeración cambia entre resoluciones anuales.

---

## 5. Otros certificados fuente (checklist tipo referencia)

| Documento                                                                                                                                                                                                                                                                            | Emisor                                                                                              | Alimenta                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Certificado tributario bancario** (retenciones, rendimientos, GMF/4x1000, saldos)                                                                                                                                                                                                  | Cada banco                                                                                          | R29 (saldos), R58 (rendimientos), R59 (comp. inflacionario), R132 (retenciones), deducción 50% GMF                         |
| **Certificado de cesantías** ([FNA](https://www.plataforma de referencia), [Protección](https://www.plataforma de referencia), [Colfondos](https://www.plataforma de referencia)) | AFP cesantías / FNA                                                                                 | R29 (saldo), R32 (consignadas/retiradas), R36 (parte exenta), rendimientos                                                 |
| **Certificado de medicina prepagada / seguro de salud**                                                                                                                                                                                                                              | Prepagada / aseguradora                                                                             | Deducción hasta 16 UVT/mes                                                                                                 |
| **Soporte de dependientes**                                                                                                                                                                                                                                                          | Autodeclarado + certificaciones (registro civil, certificado de estudios, contador, Medicina Legal) | Deducción 10% hasta 32 UVT/mes y/o 72 UVT por dependiente hasta 4 (casillas 138/139)                                       |
| **Certificado de aportes FVP y AFC/AVC**                                                                                                                                                                                                                                             | AFP / banco                                                                                         | R35 (renta exenta 30%/3.800 UVT)                                                                                           |
| **Certificado de intereses de crédito hipotecario o leasing habitacional**                                                                                                                                                                                                           | Banco                                                                                               | Hasta 1.200 UVT/año; ICETEX hasta 100 UVT                                                                                  |
| **Predial / avalúo catastral / escrituras**                                                                                                                                                                                                                                          | Municipio / notaría                                                                                 | R29 (mayor entre costo y avalúo)                                                                                           |
| **Extractos brokers locales** (Comisionista, Fondo Uno, a2censo — vía fiduciarias/comisionistas)                                                                                                                                                                                                  | Comisionista/fiduciaria                                                                             | R29, R58, dividendos, R132; aparecen en exógena (1021/2273)                                                                |
| **Estados de cuenta brokers del exterior** (eToro, GBM, IBKR)                                                                                                                                                                                                                        | Broker (no reporta a DIAN)                                                                          | R29 (activos exterior a TRM 31 dic), R58/74; puede disparar **formato 160 – activos en el exterior** (si > 2.000 UVT)      |
| **Criptomonedas** (exchanges)                                                                                                                                                                                                                                                        | Exchange (no reporta a DIAN)                                                                        | R29 patrimonio (instructivo 210 menciona "criptoactivos" en casilla 29); utilidades → renta no laboral o GO según tenencia |
| **Certificado de dividendos**                                                                                                                                                                                                                                                        | Sociedad emisora / Deceval                                                                          | Cédula de dividendos                                                                                                       |
| **Certificado de pensión**                                                                                                                                                                                                                                                           | Pensiones Ejemplo/AFP                                                                                    | R99–R103                                                                                                                   |

Punto crítico: los documentos **no cubiertos por exógena** (activos y brokers del exterior, cripto, inmuebles, deudas privadas, gastos deducibles) son justamente lo que la declaración sugerida no ve — ahí está el valor agregado de pedir documentos al usuario.

---

## 6. La "declaración sugerida" de la DIAN

- **Qué es**: borrador del 210 pre-diligenciado automáticamente a partir de la exógena y datos históricos (anticipos, saldos a favor). Existe desde AG2018/2019; disponible en el SI de Diligenciamiento y la app "DIAN Personas".
- **Cómo se consulta**: [Trámites y servicios → Declaración sugerida](https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx) o al abrir el 210 en "Diligenciar y presentar".
- **No es obligatoria ni vinculante**; la responsabilidad sigue siendo del contribuyente.
- **Limitaciones** (los "gaps" que la plataforma debe cerrar):
  1. Solo ve lo reportado por terceros → omite ingresos no reportados, activos en el exterior, cripto, arriendos informales.
  2. Patrimonio: suele traer solo saldos financieros; no valora inmuebles ni vehículos.
  3. No optimiza: no aplica dependientes, medicina prepagada, ICETEX, elección costos vs. 25% en honorarios, GMF, etc.
  4. Duplicidades o errores del informante pasan directo al borrador.
  5. Aplica principalmente a asalariados/pensionados simples.

Fuentes: [DIAN – ¿Qué es la declaración sugerida?](https://www.dian.gov.co/impuestos/personas/Renta-Personas-Naturales-AG-2020/Paginas/Que-es-la-declaracion-sugerida-de-renta.aspx), [referencia – declaración sugerida](https://www.plataforma de referencia), [Infobae](https://www.infobae.com/colombia/2025/08/18/que-es-la-declaracion-de-renta-sugerida-para-que-sirve-y-a-quienes-les-aplica-en-2025-segun-lo-confirmado-por-la-dian/), [Portafolio](https://www.portafolio.co/economia/finanzas/como-funciona-la-declaracion-de-renta-sugerida-y-otras-respuestas-sobre-el-tema-587298).

---

## 7. Cómo se presenta la declaración (el "último kilómetro")

### Flujo del usuario en MUISCA

1. **RUT actualizado** (correo, celular, responsabilidad 05) — prerequisito.
2. **Firma electrónica (IFE)**: autogestionable en línea, gratis: Usuario Registrado → "Generar o gestionar mi firma electrónica" → código al correo del RUT → aceptar acuerdo → crear contraseña de firma. Obligatoria para presentar virtualmente. Fuentes: [DIAN – paso a paso firma](https://www.dian.gov.co/Prensa/Aprendelo-en-un-DIAN-X3/Paginas/Paso-a-Paso-Generacion-Firma-Electronica.aspx), [ABC firma electrónica (PDF DIAN)](https://www.dian.gov.co/impuestos/Documents/abc_firma_electronica_2020.pdf), [referencia – habilitar firma](https://www.plataforma de referencia).
3. **Diligenciamiento del 210**: "Diligenciar y presentar" → formulario 210 del año → (opcional) cargar valores sugeridos → digitar casilla por casilla → "Guardar borrador" → **Firmar** (contraseña IFE) → **Presentar** → PDF con marca "Presentado". Aquí el usuario **transcribe los valores** que la plataforma calculó (referencia entrega 210 diligenciado + guía con capturas casilla por casilla: [con saldo a pagar](https://www.plataforma de referencia), [sin saldo o a favor](https://www.plataforma de referencia)).
4. **Pago**: si hay saldo a pagar, **formulario 490** desde el mismo sistema; pago electrónico **PSE** o impreso en banco. PN paga en una sola cuota.

### ¿Existe API pública de la DIAN o presentación por terceros?

- **No existe API pública** para diligenciar/presentar el 210. Los únicos servicios sistematizados: SI de exógena por XML (para informantes) y APIs de factura electrónica. La presentación de renta PN es exclusivamente vía MUISCA con sesión y firma del contribuyente.
- **Mecanismos legales de presentación por terceros**: (1) **apoderado** inscrito en hoja 3 del RUT (casilla 98; el 210 lo referencia en la casilla 981), firma con su propia firma electrónica; (2) **firma de contador** solo si obligado a llevar contabilidad y >100.000 UVT (casillas 982-983).
- **Las plataformas NO usan canal especial**: elaboran la declaración y guían al usuario para transcribir/presentar en MUISCA (o un contador la presenta con autorización/credenciales del usuario). Implicación: el diferencial está en (a) parsing de documentos, (b) motor de reglas 210, (c) guía de cargue casilla-por-casilla, y opcionalmente (d) presentación asistida vía automatización de navegador con consentimiento.

---

## 8. RUT

- **Inscripción**: antes de la primera declaración; virtual y gratuita; la cuenta y la consulta de exógena se habilitan ~una semana después.
- **Actualización**: si cambian correo/teléfono/dirección, nueva actividad económica, o si la actividad del RUT no coincide con la que generó más ingresos (la **casilla 24 del 210 debe coincidir con las casillas 46/48/50 del RUT**).
- **Códigos de actividad económica para no comerciantes** (Res. DIAN 000114 de 2020):
  - **0010 – Asalariados** ✔
  - **0020 – Pensionados**
  - **0081 – Personas naturales sin actividad económica**
  - **0082 – Personas naturales subsidiadas por terceros**
  - **0090 – Rentistas de capital**
- **Responsabilidad** típica en casilla 53 del RUT: **05 – Impuesto sobre la renta y complementario, régimen ordinario**.

Fuentes: [Gerencie – códigos de actividades económicas](https://www.gerencie.com/codigos-de-actividades-economicas.html), [referencia – códigos CIIU](https://www.plataforma de referencia), [Gestión Legal Colombia – RUT/clave/exógena](https://gestionlegalcolombia.com/entrar-a-la-dian-rut-clave-exogena/).

---

## Síntesis para el diseño de la plataforma

1. **Pipeline de ingestión**: (a) Excel de exógena (parser de Concepto/Detalle/Valor/Uso sugerida/Topes — el documento más estructurado, esqueleto del borrador); (b) certificado 220 (PDF, parsear por etiquetas); (c) certificados bancarios/fondos/prepagada (PDFs heterogéneos por entidad); (d) extractos exterior/cripto (manual + TRM 31 dic).
2. **Motor de reglas**: tabla `detalle_exógena → casilla_210` por año gravable + reglas de depuración (INCR, exentas 25%/790 UVT, límite 40%/1.340 UVT, dependientes 72 UVT, GMF 50%, intereses vivienda 1.200 UVT, componente inflacionario anual).
3. **Reconciliación**: exógena vs. certificados (2276≡220; 1019/1020 ≡ certificados bancarios) con alertas de faltantes/duplicados.
4. **Salida**: 210 diligenciado + guía de cargue MUISCA paso a paso (firma electrónica → diligenciar → firmar/presentar → 490/PSE).
