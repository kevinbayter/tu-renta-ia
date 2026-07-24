# Informe técnico: Cómo funciona la integración de referencia (y competidores) con la DIAN

**Fecha:** julio 2026 · **Alcance:** declaración de renta de personas naturales (formulario 210) en Colombia

> **Nota sobre el método:** Ni referencia ni Contadia publican los detalles técnicos de su "conexión" con la DIAN. Todo lo marcado como **[Documentado]** proviene de sus propias páginas o de la DIAN; lo marcado como **[Inferencia]** es deducción técnica fundamentada (principalmente en el hecho de que la DIAN **no** ofrece API pública para renta de personas naturales, por lo que la única vía posible es la automatización del portal con las credenciales del usuario).

---

## 1. Resumen ejecutivo

1. **No existe una API oficial de la DIAN para la declaración de renta de personas naturales.** Los servicios web (SOAP/REST) de la DIAN existen **únicamente** para **factura electrónica, nómina electrónica y RADIAN**, bajo el esquema de "proveedores tecnológicos habilitados". El MUISCA para renta es un portal web transaccional pensado para uso humano interactivo. **[Documentado / Inferencia fuerte]**

2. La "conexión con la DIAN" de referencia/Contadia para **descargar exógena** y para **presentar el 210** es, casi con certeza, **automatización del portal MUISCA (RPA / scraping con navegador headless) usando las credenciales del propio usuario** (tipo y número de documento + contraseña). No es OAuth ni un API oficial. **[Inferencia fuerte, no confirmada por las empresas]**

3. La cobertura legal es el **mandato** (arts. 572 y 572-1 del Estatuto Tributario): el usuario autoriza a referencia/al experto a actuar y firmar en su nombre. Esto es lo que evita que caiga bajo la Ley 1273 de 2009 (acceso abusivo a sistema informático): hay **autorización del titular**. **[Documentado]**

4. referencia tiene **dos modelos**: en el plan "hazlo tú mismo" **el usuario transcribe y presenta** en el portal DIAN; en el plan asistido **un experto presenta la declaración directamente ante la DIAN** por el usuario. **[Documentado]**

---

## 2. Función 1 — Conexión para descargar exógena

### Qué dicen públicamente

- referencia: _"puedes conectarte con tu cuenta de la DIAN para que se cargue directamente en nuestra plataforma la información exógena tributaria que tienes reportada allí"_. **[Documentado]**
  https://www.plataforma de referencia
- Contadia: _"Conexión automática a Muisca — Accede a la cuenta de tu cliente. La Conexión DIAN trae la exógena y la deja clasificada"_. Con fallback: _"¿Qué pasa si la Conexión DIAN falla? Puedes ingresar la información manualmente."_ **[Documentado]** — https://www.contadia.com/

### El proceso real en el MUISCA (lo que se automatiza)

Portal Transaccional → ingresar "a nombre propio" → **"Consultar Información Exógena / Información Reportada por Terceros"** → aceptar condiciones → elegir año → descargar **Excel**. **[Documentado]**

- https://www.dian.gov.co/impuestos/personas/Renta-Personas-Naturales-AG-2020/Paginas/Informacion-reportada-por-terceros-Exogena.aspx
- https://micrositios.dian.gov.co/renta-personas-naturales-ag-2025/2026/07/21/dian-habilita-consulta-informacion-exogena-2025/

### Interpretación técnica **[Inferencia]**

- No hay endpoint público. El flujo (login en `muisca.dian.gov.co/WebIdentidadLogin/` → menú → descarga) se automatiza con **Playwright/Puppeteer/Selenium headless** usando las credenciales del usuario.
- **Alternativa documentada**: referencia también acepta que el usuario **descargue el archivo y lo suba** — la "conexión" automática es conveniencia opcional, no requisito. **[Documentado]**
- **Dato clave**: la DIAN unificó la contraseña — **la misma contraseña de ingreso sirve para la firma electrónica**. Con documento + contraseña, un bot puede tanto leer exógena como firmar y presentar. **[Documentado]**
  https://www.dian.gov.co/Prensa/Paginas/NG-Cuenta-de-usuario-y-contrasena-DIAN-actualizada-y-facil-de-recordar.aspx

---

## 3. Función 2 — Presentar el 210 automáticamente

### Qué dicen públicamente

- **referencia plan asistido:** _"un experto... presenta la declaración directamente a la DIAN"_. **[Documentado]**
- **referencia plan autoservicio:** el usuario transcribe las casillas en "Diligenciar y Presentar Formulario 210" y firma/presenta él mismo. **[Documentado]**
  https://www.plataforma de referencia
- **Firma electrónica:** _"Debes contar con firma electrónica en la DIAN, o de lo contrario, darnos la autorización para que te generemos una"_ — referencia genera/habilita la IFE en nombre del usuario (otra operación automatizada). **[Documentado]**
- **Contadia:** _"Presentación directa en Muisca. No tienes que transcribir el formulario 210"_ + generación del F490 y link de pago. **[Documentado]**

### Interpretación técnica **[Inferencia fuerte]**

Automatización del diligenciamiento del 210 + firma con la contraseña (IFE) + "Firmar/Presentar", generando acuse con sello DIAN y recibo **F490**. La IFE es el único medio para presentar virtualmente, y su contraseña coincide con la del usuario.

### Marco legal de la presentación por un tercero **[Documentado]**

- **Art. 572 E.T.**: mandatarios/apoderados cumplen deberes formales del representado, incluida la presentación de declaraciones.
- **Art. 572-1 E.T.**: apoderados generales y mandatarios especiales (no requieren ser abogados) pueden **suscribir y presentar** declaraciones; son **solidariamente responsables**.
- Doctrina DIAN (Oficios 908122/2021 y 908199/2021): la firma digital puede encomendarse al mandatario.
  - https://estatuto.co/572 · https://estatuto.co/572-1
  - https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_908122_2021.htm
  - https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_908199_2021.htm

---

## 4. ¿Existe API oficial de la DIAN?

**Para renta de personas naturales: NO. Para factura electrónica: SÍ.**

| Ámbito                                            | ¿API oficial?    | Detalle                                                                                                  |
| ------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| Factura electrónica / nómina electrónica / RADIAN | **Sí**           | "Guía Herramienta para el Consumo de Web Services" + esquema de proveedores tecnológicos habilitados     |
| Declaración de renta PN (210/110), exógena, IFE   | **No (público)** | Único canal: portal MUISCA interactivo. La declaración sugerida se consume dentro del portal, no vía API |

- https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia-Herramienta-para-el-Consumo-de-Web-Services.pdf
- https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx
- https://muisca.dian.gov.co/WebDilIngresoFormRenta210/

**Conclusión:** la conexión de referencia/Contadia **no es integración oficial**; es automatización no oficial del portal, con credenciales del usuario y bajo mandato. Práctica **tolerada** (sin pronunciamiento público de la DIAN que la prohíba, ni programa de "software habilitado" para renta). **[Inferencia razonada]**

---

## 5. Riesgos técnicos y legales

### Legales

- **Ley 1273/2009 art. 269A** (acceso abusivo, 48–96 meses de prisión): el elemento que salva la operación es la **autorización expresa del titular** (mandato). Diseño clave: consentimiento explícito, trazable y revocable.
- **Responsabilidad solidaria** del mandatario (art. 572-1) por impuestos, sanciones e intereses.
- **Habeas Data (Ley 1581/2012)**: autorización, finalidad limitada, seguridad en el manejo de credenciales.

### Técnicos (MUISCA)

- Autenticación con usuario/contraseña; misma contraseña para firma electrónica. **[Documentado]**
- **Sin evidencia pública de 2FA obligatorio** en el login; sí verificación por correo para habilitar cuenta/recuperar contraseña (~24h) y **bloqueo tras intentos fallidos** (~30 min). **[Documentado con matices]**
- Captchas/detección de bots: no documentado consistentemente; pueden aparecer en cualquier momento. **[Inferencia]**
- **Fragilidad**: el MUISCA cambia HTML/flujos cada temporada — el mayor riesgo operativo. **[Inferencia fuerte]**
- **Custodia de credenciales**: el m
