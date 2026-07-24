# Informe técnico: Cómo funciona la integración de referencia (y competidores) con la DIAN

**Fecha:** julio 2026 · **Alcance:** declaración de renta de personas naturales (formulario 210) en Colombia

> **Nota sobre el método:** Ni referencia ni Contadia publican los detalles técnicos de su "conexión" con la DIAN. Todo lo marcado como **[Documentado]** proviene de sus propias páginas o de la DIAN; lo marcado como **[Inferencia]** es deducción técnica fundamentada (principalmente en el hecho de que la DIAN **no** ofrece API pública para renta de personas naturales, por lo que la única vía posible es la automatización del portal con las credenciales del usuario).

---

## 1. Resumen ejecutivo (lo esencial)

1. **No existe una API oficial de la DIAN para la declaración de renta de personas naturales.** Los servicios web (SOAP/REST) de la DIAN existen **únicamente** para **factura electrónica, nómina electrónica y RADIAN**, bajo el esquema de "proveedores tecnológicos habilitados". El MUISCA para renta es un portal web transaccional pensado para uso humano interactivo. **[Documentado / Inferencia fuerte]**

2. Por lo tanto, la "conexión con la DIAN" de referencia/Contadia para **descargar exógena** y para **presentar el 210** es, casi con certeza, **automatización del portal MUISCA (RPA / scraping con navegador headless) usando las credenciales del propio usuario** (tipo y número de documento + contraseña). No es OAuth ni un API oficial. **[Inferencia fuerte, no confirmada por las empresas]**

3. La cobertura legal es el **mandato** (art. 572 y 572-1 del Estatuto Tributario): el usuario autoriza a referencia/al experto a actuar y firmar en su nombre. Esto es lo que evita que caiga bajo la Ley 1273 de 2009 (acceso abusivo a sistema informático): hay **autorización del titular**. **[Documentado]**

4. referencia tiene **dos modelos**: en el plan "hazlo tú mismo" **el usuario transcribe y presenta** en el portal DIAN; en el plan asistido **un experto presenta la declaración directamente ante la DIAN** por el usuario. **[Documentado]**

---

## 2. Función 1 — Inicio de sesión / conexión para descargar exógena

### Qué dicen públicamente

- referencia: _"puedes conectarte con tu cuenta de la DIAN para que se cargue directamente en nuestra plataforma la información exógena tributaria que tienes reportada allí"_. **[Documentado]**
  Fuente: https://www.plataforma de referencia
- Contadia: _"Conexión automática a Muisca — Accede a la cuenta de tu cliente. La Conexión DIAN trae la exógena y la deja clasificada, así empiezas con la declaración ya armada sin transcribir nada."_ Y ofrecen fallback: _"¿Qué pasa si la Conexión DIAN falla? Puedes ingresar la información manualmente."_ **[Documentado]**
  Fuente: https://www.contadia.com/

### El proceso real en el MUISCA (lo que se automatiza)

La exógena se obtiene en el **Portal Transaccional** de la DIAN entrando "a nombre propio", en la opción **"Consultar Información Exógena / Información Reportada por Terceros"**, aceptando condiciones, eligiendo año gravable y descargando un **archivo Excel**. **[Documentado]**
Fuentes DIAN:

- https://www.dian.gov.co/impuestos/personas/Renta-Personas-Naturales-AG-2020/Paginas/Informacion-reportada-por-terceros-Exogena.aspx
- https://micrositios.dian.gov.co/renta-personas-naturales-ag-2025/2026/07/21/dian-habilita-consulta-informacion-exogena-2025/

### Interpretación técnica **[Inferencia]**

- No hay endpoint público documentado para esta consulta. El flujo (login → aceptar términos → seleccionar año → generar Excel) es exactamente el tipo de secuencia que se automatiza con **Playwright/Puppeteer/Selenium headless**: el software recibe documento + contraseña del usuario, hace el login en `muisca.dian.gov.co/WebIdentidadLogin/`, navega el menú y descarga el Excel/archivo, que luego parsea.
- **Alternativa documentada y explícita**: referencia también permite que el usuario **descargue el archivo manualmente y lo suba** a la plataforma (_"en referencia te pediremos el documento de la información exógena"_). Esto significa que la "conexión" automática es un **conveniencia opcional**, no un requisito. **[Documentado]**
- La DIAN unificó la contraseña: **la misma contraseña de ingreso sirve para la firma electrónica**. Esto es clave: con solo documento + contraseña, un bot puede tanto **leer** exógena como **firmar y presentar**. **[Documentado]**
  Fuente: https://www.dian.gov.co/Prensa/Paginas/NG-Cuenta-de-usuario-y-contrasena-DIAN-actualizada-y-facil-de-recordar.aspx

---

## 3. Función 2 — Presentar la declaración (formulario 210) automáticamente

### Qué dicen públicamente

- **referencia, plan asistido:** _"un experto generará tu declaración... te entrega un borrador para tu aprobación y luego presenta la declaración directamente a la DIAN"_ / _"el experto presenta tu declaración ante la DIAN por ti"_. **[Documentado]**
- **referencia, plan "hazlo tú mismo":** el usuario entra al portal DIAN con su usuario y contraseña, elige "Diligenciar y Presentar Formulario 210", **transcribe** las casillas que referencia le entrega, y firma/presenta él mismo. **[Documentado]**
  Fuente: https://www.plataforma de referencia (título "¿Cómo presentar la declaración de renta?")
- **Firma electrónica:** referencia indica _"Debes contar con firma electrónica en la DIAN, o de lo contrario, darnos la autorización para que te generemos una"_. **[Documentado]** — es decir, si el usuario no tiene IFE, **referencia la genera/habilita en su nombre** (otra operación automatizada en el MUISCA).
- **Contadia:** _"Presentas a la DIAN, generas el F490 y el link de pago... Presentación directa en Muisca. No tienes que transcribir el formulario 210."_ Presenta **210 y 110 directamente**. **[Documentado]**

### Interpretación técnica **[Inferencia]**

- La presentación asistida solo es posible de dos formas: (a) un humano operador entra al MUISCA con las credenciales del cliente y diligencia/firma/presenta, o (b) un bot lo hace. Dado el volumen y la promesa de "presentación directa sin transcribir", lo más probable es **automatización del diligenciamiento del formulario 210 + firma con la contraseña (IFE) + botón "Firmar/Presentar"**, generando el acuse (sello DIAN con fecha/hora) y el recibo **F490** para el pago. **[Inferencia fuerte]**
- La **firma electrónica (IFE)** de la DIAN reemplaza la firma manuscrita y es el único medio autorizado para presentar virtualmente. Como la contraseña de la IFE hoy coincide con la del usuario, automatizar la firma no requiere un certificado aparte, solo introducir la contraseña en el paso de firma. **[Documentado]**
  Fuente: https://www.plataforma de referencia

### Marco legal de la presentación por un tercero **[Documentado]**

- **Art. 572 E.T.** (literal): mandatarios/apoderados generales y especiales deben cumplir los deberes formales del representado, incluyendo **presentar declaraciones**.
- **Art. 572-1 E.T.**: _"podrán suscribir y presentar las declaraciones tributarias los apoderados generales y los mandatarios especiales que no sean abogados"_; y son **solidariamente responsables**.
- Doctrina DIAN: _"la obligación de firmar digitalmente puede ser encomendada al tercero mandatario, quien en virtud del mandato otorgado podrá firmar digitalmente en calidad de representante del sujeto obligado"_ (Oficios DIAN 908122/2021 y 908199/2021).
  Fuentes:
  - https://estatuto.co/572 · https://estatuto.co/572-1
  - https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_908122_2021.htm
  - https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_908199_2021.htm

En la práctica, el "botón de presentar" de referencia/Contadia se sostiene jurídicamente en un **mandato/autorización** que el usuario acepta en los términos de servicio.

---

## 4. Función 3 — ¿Existe una API oficial de la DIAN?

**Respuesta corta: para renta de personas naturales, NO. Para factura electrónica, SÍ.** Hay que separar los dos mundos:

| Ámbito                                                    | ¿API/Web service oficial? | Detalle                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Factura electrónica / nómina electrónica / RADIAN**     | **Sí**                    | La DIAN publica la _"Guía Herramienta para el Consumo de Web Services"_ y un esquema formal de **"proveedores tecnológicos habilitados"** (deben registrarse, cumplir requisitos, firmar convenios). Existen múltiples APIs comerciales (Factus, Yabi, NortServer, etc.). **[Documentado]** |
| **Declaración de renta PN (Form. 210/110), exógena, IFE** | **No (público)**          | No hay API/OAuth documentado. El único canal es el **portal transaccional MUISCA** interactivo. La "declaración sugerida" existe pero se consume **dentro del portal**, no vía API. **[Documentado / Inferencia]**                                                                          |

Fuentes:

- Guía Web Services DIAN (factura electrónica): https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia-Herramienta-para-el-Consumo-de-Web-Services.pdf
- Requisitos proveedores tecnológicos: https://www.dian.gov.co/impuestos/factura-electronica/Documents/Preguntas-y-respuestas-Proveedores-Tecnologicos-FE.pdf
- Declaración sugerida (dentro del portal): https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx
- Portal MUISCA renta: https://muisca.dian.gov.co/WebDilIngresoFormRenta210/

**Conclusión sobre "oficialidad":** La conexión de referencia/Contadia para renta **no es una integración oficial vía API**. Es **automatización no oficial del portal, con las credenciales del usuario y bajo mandato**. Es una práctica **tolerada** en tanto exista autorización del titular (no hay pronunciamiento público de la DIAN que la prohíba, ni un programa oficial de "software habilitado" para renta equivalente al de factura electrónica). **[Inferencia razonada]**

---

## 5. Función 4 — Riesgos técnicos y legales

### Legales

- **Ley 1273 de 2009, art. 269A (acceso abusivo a sistema informático):** pena de 48–96 meses de prisión para quien acceda _"sin autorización o por fuera de lo acordado"_. **El elemento que salva la operación es la autorización expresa del titular** (mandato). Sin ese consentimiento documentado, la automatización con credenciales ajenas podría configurar el delito. Diseño clave: **consentimiento explícito, trazable y revocable**. **[Documentado]**
  Fuentes: http://www.secretariasenado.gov.co/senado/basedoc/ley_1273_2009.html · https://www.policia.gov.co/normatividad-sobre-delitos-informaticos
- **Responsabilidad solidaria** del mandatario (art. 572-1): quien presenta responde solidariamente por impuestos, sanciones e intereses derivados de errores/incumplimientos. **[Documentado]**
- **Habeas Data (Ley 1581 de 2012):** tratamiento de datos personales y credenciales exige autorización, finalidad limitada y medidas de seguridad. referencia declara cifrado "con los más altos estándares" y no compartir con terceros no autorizados. **[Documentado]**

### Técnicos (del portal MUISCA)

- **Autenticación:** usuario/contraseña; la misma contraseña sirve para la firma electrónica. **[Documentado]**
- **¿2FA/MFA?** No hay evidencia pública de un segundo factor obligatorio (OTP por app/SMS) en el login del MUISCA para renta. Sí existe **verificación/enlace por correo** para habilitar cuenta o recuperar contraseña (vigencia ~24h) y **bloqueo tras varios intentos fallidos** (~30 min). Esto es un riesgo intermitente para la automatización (si la DIAN exige un enlace de correo, el bot se frena). **[Documentado, con matices]**
  Fuente: https://dian.com.co/como-ingresar-dian-crear-usuario-muisca-2026/
- **Captcha / detección de bots:** no documentado públicamente de forma consistente, pero el portal puede introducir captchas o cambios en cualquier momento. **[Inferencia]**
- **Fragilidad del portal:** el MUISCA cambia HTML/flujos con frecuencia (especialmente cada temporada de renta), lo que rompe los selectores del scraper. Es el mayor riesgo operativo. **[Inferencia fuerte]**
- **Manejo de credenciales:** el mayor riesgo de seguridad. Si se almacenan contraseñas de la DIAN, un breach comprometería tanto datos fiscales como la capacidad de firmar/presentar en nombre de miles de personas. **[Inferencia]**

**Riesgo de replicarlo:** técnicamente **factible**, pero **operacionalmente frágil y jurídicamente sensible**. Es replicable con bajo riesgo legal **si y solo si** hay mandato/autorización explícita y manejo impecable de credenciales; el riesgo real es operativo (portal cambiante, bloqueos, captchas) y de seguridad (custodia de credenciales).

---

## 6. Función 5 — Cómo lo hacen los competidores

- **Contadia:** confirma explícitamente **"conexión directa a la cuenta Muisca de cada cliente"**, extracción automática de exógena y certificados, y **presentación directa de 210/110 + F490** desde su plataforma. Mismo enfoque (automatización con credenciales del cliente) y con fallback manual. **[Documentado]** — https://www.contadia.com/
- **referencia:** conexión para cargar exógena + presentación asistida por experto (plan pago) o autoservicio (el usuario presenta). **[Documentado]**
- **SaraDeclara / otras:** no se encontró documentación técnica pública que confirme o niegue el mismo mecanismo; por el mismo motivo estructural (no hay API de renta) cualquier plataforma que ofrezca "conexión a la DIAN" para renta está, con alta probabilidad, automatizando el portal con credenciales del usuario. **[Inferencia]**

**Patrón común de la industria:** todas convergen en **RPA sobre el portal MUISCA con las credenciales del usuario**, porque no hay otra vía técnica. La única diferencia es UX (quién aprieta el botón de presentar) y quién asume el mandato.

---

## 7. Función 6 — Recomendación técnica para replicarlo de forma segura

Si se decidiera implementar, en orden de preferencia:

### Opción A (recomendada, menor riesgo) — Carga manual + declaración sugerida oficial

- El usuario **descarga su exógena** (Excel) y su **declaración sugerida** desde el MUISCA y las **sube** a tu plataforma; tú parseas, calculas y **le devuelves el 210 diligenciado** para que él lo presente. Cero custodia de credenciales, cero automatización del portal, riesgo legal mínimo. Es exactamente el "fallback manual" que referencia/Contadia ya ofrecen. **← Es lo que tu-renta-ai hace hoy en el MVP.**

### Opción B (paridad con competidores) — Automatización con credenciales efímeras

Si se necesita la "conexión" automática:

1. **Playwright headless** (mejor que Puppeteer para multi-navegador y auto-waiting; más robusto que Selenium para portales dinámicos). Contenedores aislados por sesión.
2. **Credenciales efímeras: NUNCA persistir la contraseña de la DIAN.** Recibirla por sesión, mantenerla solo en memoria del worker durante la ejecución, y descartarla al terminar. Si hay que reintentar, re-solicitarla al usuario.
3. **Mandato/autorización explícita y trazable** antes de cualquier acceso (checkbox + registro con timestamp, IP, versión de términos). Esto es lo que blinda frente a la Ley 1273.
4. **Aislar la operación de firma/presentación** detrás de una confirmación explícita del usuario sobre el borrador (como hace referencia), para no presentar sin aprobación.
5. **Manejo de fallos del portal:** detectar cambios de DOM, captchas, enlaces de correo y bloqueos; degradar con gracia al flujo manual (Opción A) en lugar de fallar en silencio.
6. **Monitoreo y "self-healing":** alertas cuando cambian los selectores (cada temporada de renta); pruebas de humo diarias contra el portal.
7. **Cumplimiento de datos:** cifrado en tránsito y reposo de los datos fiscales, minimización, retención limitada, y política de Habeas Data.

### Opción C (no viable hoy) — API oficial

No existe para renta PN. Sí conviene monitorear iniciativas de la DIAN, pero **no se puede construir sobre un API oficial de renta que no está publicado**. La única API oficial real es la de **factura electrónica** (otro producto).

**Recomendación final:** empezar por la **Opción A** (descarga/subida manual + apoyarse en la declaración sugerida oficial), que entrega el 80% del valor sin los riesgos legales/operativos, y considerar la Opción B solo si la competencia por UX lo exige, con custodia efímera de credenciales y mandato explícito como requisitos no negociables.

---

## Fuentes principales

- referencia: [exógena](https://www.plataforma de referencia) · [cómo presentar](https://www.plataforma de referencia) · [firma electrónica](https://www.plataforma de referencia) · [planes](https://www.plataforma de referencia)
- Contadia: https://www.contadia.com/
- DIAN renta/exógena/MUISCA: [exógena](https://www.dian.gov.co/impuestos/personas/Renta-Personas-Naturales-AG-2020/Paginas/Informacion-reportada-por-terceros-Exogena.aspx) · [declaración sugerida](https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx) · [MUISCA 210](https://muisca.dian.gov.co/WebDilIngresoFormRenta210/) · [contraseña unificada](https://www.dian.gov.co/Prensa/Paginas/NG-Cuenta-de-usuario-y-contrasena-DIAN-actualizada-y-facil-de-recordar.aspx)
- DIAN factura electrónica (API oficial, contraste): [guía web services](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia-Herramienta-para-el-Consumo-de-Web-Services.pdf) · [proveedores tecnológicos](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Preguntas-y-respuestas-Proveedores-Tecnologicos-FE.pdf)
- Marco legal: [art. 572](https://estatuto.co/572) · [art. 572-1](https://estatuto.co/572-1) · [Oficio DIAN 908122/2021](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_908122_2021.htm) · [Ley 1273/2009](http://www.secretariasenado.gov.co/senado/basedoc/ley_1273_2009.html)

---

### Advertencia de honestidad intelectual

El punto más importante y **no confirmado oficialmente** es el mecanismo exacto de la "conexión": **ninguna de las empresas publica si usan navegador headless, RPA propietario u operadores humanos**, ni cómo custodian las credenciales. La conclusión de que es automatización del portal con credenciales del usuario es **inferencia técnica sólida** basada en la ausencia demostrable de un API oficial de la DIAN para renta de personas naturales, no en documentación de referencia/Contadia. Para confirmarlo con certeza haría falta inspeccionar el tráfico de red de sus plataformas durante una conexión real.
