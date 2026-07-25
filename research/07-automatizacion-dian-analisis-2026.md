# Automatización ante la DIAN: análisis técnico y legal (julio 2026)

> **Objetivo del documento**: decidir con información —no con supuestos— si TuRenta AI
> puede (a) conectarse a la cuenta DIAN del usuario para **descargar** su exógena y sus
> declaraciones anteriores, y (b) **presentar** el formulario 210 automáticamente.
>
> Actualiza y profundiza [`06-integracion-dian-referencia.md`](06-integracion-dian-referencia.md).

---

## 1. Los cinco hallazgos que definen la decisión

1. **No existe API oficial de la DIAN para renta de personas naturales** (verificado julio
   2026). Los servicios web de la DIAN cubren únicamente factura, nómina electrónica y
   RADIAN. La renta se presenta por el portal MUISCA con firma electrónica. Cualquier
   automatización es, necesariamente, **RPA sobre un portal diseñado para humanos**.

2. **La firma electrónica es "personal e intransferible"** (Decreto 1791 de 2007,
   Resolución DIAN 000070 de 2016). La norma es explícita: es responsabilidad del titular
   proteger su mecanismo de firma "al interior de la empresa **y respecto de terceros**".

3. **La responsabilidad por lo firmado siempre recae en el titular**, no en quien usó la
   contraseña. Esto protege a la plataforma frente a la DIAN… pero significa que **el
   usuario asume todo el riesgo** de lo que nuestro software haga con su firma.

4. **Actuar como mandatario acarrea responsabilidad solidaria** (art. 572-1 E.T.): los
   apoderados y mandatarios especiales "son **solidariamente responsables** por los
   impuestos, anticipos, retenciones, sanciones e intereses" del contribuyente. Es decir:
   si nos constituimos formalmente en mandatarios, la DIAN nos puede cobrar a nosotros.

5. **referencia SÍ automatiza la presentación en su plan self-service.** Verificado: en su
   plan "hazlo tú mismo" —el flujo equivalente al nuestro— _"recibes un borrador, lo revisas
   y si estás de acuerdo, **puedes presentar tu declaración a la DIAN con un clic**"_. En
   paralelo mantiene un plan asistido con 300+ contadores. Es decir: **existe precedente de
   mercado, a escala y con respaldo institucional** (inversión del grupo Bancolombia,
   alianza comercial con el banco), operando así desde hace años sin sanción pública
   conocida. Esto no vuelve el riesgo cero, pero sí lo hace **medible y acotado**.

---

## 2. Estado técnico

### 2.1 Qué se puede automatizar y cómo

| Operación                      | Ruta en MUISCA                                        | Naturaleza            | Dificultad      |
| ------------------------------ | ----------------------------------------------------- | --------------------- | --------------- |
| Descargar exógena              | Login → Consulta info. reportada por terceros → Excel | **Lectura**           | Media           |
| Descargar declaración anterior | Login → Consulta de declaraciones → PDF               | **Lectura**           | Media           |
| Diligenciar 210                | Login → Diligenciar/Presentar → 100+ casillas         | **Escritura**         | Alta            |
| Firmar y presentar             | Paso de firma con contraseña IFE                      | **Escritura + firma** | Alta y sensible |
| Generar recibo 490             | Tras presentar                                        | Lectura               | Baja            |

La única vía es un navegador headless (Playwright) manejando: login, cookies de sesión,
navegación por JSF/`.faces` (el MUISCA es JavaServer Faces con estado de vista), descargas
y, en el peor caso, captcha.

### 2.1.1 Estructura real del login (inspeccionada el 25-jul-2026)

`muisca.dian.gov.co/WebArquitectura/DefLogin.faces` **redirige** a un sistema de identidad
nuevo, tipo OAuth/STS: `muisca.dian.gov.co/WebIdentidadLogin/?ideRequest=<base64>` con
`clientId`, `redirect_uri`, `state` y `nonce`. La pantalla es **Angular + Material** (ya no
JSF), con estos controles:

| Control                      | Selector                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| Tipo de documento            | `mat-select` (Material, no `<select>` nativo)                      |
| Número de documento          | `input[name="numDocumento"]`                                       |
| Contraseña                   | `input[name="password"]`                                           |
| Aceptar tratamiento de datos | `input[name="aceptaTratamientoDatos"]` (checkbox, **obligatorio**) |
| Ingresar                     | `button` con texto "Ingresar"                                      |

**Modos de ingreso disponibles** (botones): _A nombre propio_, _**A nombre de un tercero**_,
_Servidor DIAN_, **_Autorizaciones / Poderes_**, _Organización no obligada a RUT_.

> 🔑 **Hallazgo decisivo para el futuro B2B**: la DIAN **ya ofrece** el ingreso "a nombre de
> un tercero" y por "autorizaciones/poderes". Un contador con poder registrado entra con
> **sus propias credenciales** y opera por su cliente — **sin que el cliente le comparta su
> contraseña**. Ese es el camino legalmente limpio para el modelo tipo Contadia, y evita por
> completo el problema de custodia de credenciales ajenas.

⚠️ El checkbox `aceptaTratamientoDatos` implica que alguien acepta el tratamiento de datos en
cada login: si lo marca nuestro RPA, lo hace en nombre del usuario, lo que refuerza la
necesidad de la autorización explícita previa.

### 2.1.2 Flujo de la exógena, verificado de punta a punta (25-jul-2026)

Mapeo asistido: el titular autenticó en pantalla y desde ahí se recorrió el flujo con
Playwright. **No se almacenó ninguna credencial** y el archivo descargado se descartó.

Tras el login se aterriza en `muisca.dian.gov.co/WebDashboard/DefDashboard.faces` — un
dashboard JSF/RichFaces. El enlace _"Consultar información Exógena — Información Reportada
por terceros"_ abre un `rich-modalpanel` (`…:aniosPanel`) con las condiciones de uso.

| Paso                   | Selector (id JSF, anclado por sufijo) | Notas                                    |
| ---------------------- | ------------------------------------- | ---------------------------------------- |
| 1. Aceptar condiciones | `[id$="btnBuscar"]`                   | `input[type=image]`; revela lo que sigue |
| 2. Año gravable        | `[id$="anioSel"]`                     | `<select>` con 2020–2025                 |
| 3. Generar reporte     | `[id$="btnExogenaGenerar"]`           | `input[type=image]`; envía por A4J AJAX  |
| 4. Descargar           | `[id$="lnkDescargarReporteExogena"]`  | `<a>` de 0×0 px → clic programático      |

**Resultado**: `reporteExogena2025.xlsx`. Detalles que importan para el adaptador:

- Los tres controles del paso 2 al 4 **existen en el DOM desde el inicio pero ocultos**;
  solo se vuelven visibles al aceptar las condiciones. Verificar presencia no basta:
  hay que verificar visibilidad.
- El enlace de descarga **no tiene contenido y mide 0×0 px**. No admite clic por
  coordenadas; su `onclick` arma el submit JSF (`_idcl`) que devuelve el archivo.
- Los campos ocultos `hddAnioSel` y `hddFechaProcesamientoSel` **se vacían tras la
  descarga** (el submit reinicia el panel): no sirven como señal de "reporte listo".
- El dashboard también expone **"Presentar Declaración de Renta"** — punto de entrada de la
  Fase 3.

### 2.1.3 Declaraciones presentadas, verificado de punta a punta (25-jul-2026)

El portal **no es una sola aplicación**: conviven el dashboard JSF/RichFaces y una SPA de
Angular para el 210. La ruta al histórico es:

```
Dashboard → [menú lateral] → Diligenciar / Presentar → Formulario 210
          → Declaraciones de renta presentadas
          → muisca.dian.gov.co/WebDilIngresoFormRenta210/#/ingreso/presentados
```

La tabla lista **No. formulario · Año/frecuencia · Concepto · Fecha de presentación** y, por
fila, iconos de acción: `descargar.png`, `corregir.png`, `pagar.png`. El PDF se descarga con
el nombre `<númeroFormulario>.pdf`.

| Elemento          | Selector                | Notas                             |
| ----------------- | ----------------------- | --------------------------------- |
| Barra del menú    | `#divMenuTd`            | **Requiere hover del ratón real** |
| Icono de descarga | `img[src*="descargar"]` | Anclado al archivo, no al tooltip |

> ⚠️ **El hallazgo que más cuesta descubrir**: el menú lateral **solo se despliega con hover
> del ratón real**. Un `element.click()` sintético sobre `#divMenuTd` no lo abre, y tampoco
> lo abre hacer clic en el texto "Mis actividades". Por eso el adaptador usa `hover()` de
> Playwright, que mueve el puntero de verdad. Sin esto, toda la Fase 2 es inalcanzable.

Otros detalles verificados:

- El árbol del menú **aparece y desaparece del DOM** según el estado del desplegable: buscar
  el enlace y activarlo deben ocurrir en la misma operación, o se pierde entre re-renders.
- Los `<a>` del menú traen `onclick` con ids JSF generados
  (`…_id32('…:id5043','seleccionar')`). **Ese id cambia entre sesiones**: hay que resolver el
  enlace por su texto, nunca por el id.
- Los iconos de acción usan `matTooltip`, que se refleja como `ng-reflect-message`
  **solo en modo desarrollo**. Anclarse a eso sería frágil; el `src` del icono es estable.
- La pantalla JSF _"Consultar documento Diligenciado"_ (`vistaImprimirFormualrioPDF:…`,
  con el typo incluido) también entrega el PDF, pero **exige conocer el número de
  declaración** de antemano, así que no sirve para descubrir el histórico.

### 2.2 Obstáculos técnicos reales

- **Fragilidad estructural**: el MUISCA cambia sin aviso ni versionado. Un selector roto en
  temporada de vencimientos = servicio caído en el peor momento.
- **Estado de sesión JSF**: `ViewState` por página, difícil de paralelizar; una sesión por
  usuario, sin reutilización.
- **Detección y bloqueo**: un pico de logins desde una misma IP hacia MUISCA es
  indistinguible de un ataque de credenciales. Riesgo real de bloqueo de la IP del servidor.
- **Escalabilidad en vencimientos**: los picos se concentran en pocos días (agosto-octubre);
  el RPA es caro en CPU/RAM y no se puede "acelerar" sin aumentar el riesgo de bloqueo.
- **Nuestra infraestructura hoy**: servidor doméstico tras CGNAT con IP dinámica. Es el
  peor perfil posible de reputación de red para hablar con la DIAN a nombre de terceros.

---

## 3. Marco legal: las cuatro normas que aplican

### 3.1 Ley 1273 de 2009, art. 269A — acceso abusivo a sistema informático

> "El que, **sin autorización o por fuera de lo acordado**, acceda en todo o en parte a un
> sistema informático protegido o no con una medida de seguridad […] incurrirá en pena de
> prisión de **48 a 96 meses** y multa de 100 a 1.000 SMLMV."

**Análisis honesto**: la autorización expresa del titular elimina el primer supuesto ("sin
autorización"). El riesgo vivo es el segundo: **"por fuera de lo acordado"**. Lo acordado
no lo define solo el usuario, sino también las condiciones de uso del portal y las normas
que declaran la firma _personal e intransferible_. Un fiscal podría argumentar que el
titular no puede autorizar lo que la norma le prohíbe delegar.

**Mitigación**: autorización escrita, específica, revocable y con evidencia (log firmado);
nunca acceso sin acción del usuario; nunca uso de la sesión para algo distinto a lo
autorizado.

### 3.2 Decreto 1791 de 2007 y Resolución DIAN 000070 de 2016 — firma electrónica

- La firma es personal e intransferible; el titular debe protegerla **respecto de terceros**.
- La responsabilidad de lo firmado recae siempre en el titular.

**Consecuencia**: si automatizamos la firma con su contraseña, el usuario queda expuesto y
nosotros quedamos con un deber de custodia altísimo sobre esa credencial.

### 3.3 Art. 572-1 E.T. — mandatarios: responsabilidad solidaria

Si nos constituimos en mandatarios formales, respondemos **solidariamente** por impuestos,
sanciones e intereses del usuario. Para una plataforma con miles de usuarios, es un pasivo
contingente inasumible sin respaldo asegurador.

### 3.4 Ley 1581 de 2012 + Circular SIC 2025 (fintech)

- Las credenciales de acceso a un sistema estatal son **dato personal de máxima
  sensibilidad**. Almacenarlas exige cifrado fuerte, control de acceso, trazabilidad y
  minimización.
- La SIC endureció en 2025 las reglas para servicios fintech: información clara al usuario,
  configuración de privacidad desde el diseño y sanciones por incumplimiento.
- Una filtración de contraseñas DIAN sería un incidente de seguridad reportable y,
  potencialmente, el fin del proyecto.

---

## 4. Los tres riesgos que hay que aceptar o mitigar

| Riesgo                                                | Probabilidad | Impacto     | Comentario                                                                                                                        |
| ----------------------------------------------------- | ------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Custodia de credenciales**                          | Media        | **Crítico** | Una brecha expone cuentas DIAN completas: firma, RUT, historial                                                                   |
| **Interpretación penal** ("por fuera de lo acordado") | Baja         | **Crítico** | Zona gris real, pero con precedente: referencia opera así desde hace años con respaldo de Bancolombia y sin sanción pública conocida |
| **Rotura del RPA en temporada**                       | **Alta**     | Alto        | El MUISCA cambia sin aviso; falla justo cuando más se usa                                                                         |

---

## 5. Modelos posibles

### Modelo A — RPA con credenciales almacenadas

La plataforma guarda usuario/contraseña y opera cuando quiera.
❌ Máxima exposición: custodia permanente + zona gris penal + responsabilidad reputacional.
**No recomendado** — y además innecesario: el Modelo B da el mismo resultado sin guardar nada.

### Modelo B — Sesión efímera asistida ("el usuario conduce") ← **el de referencia**

El usuario ingresa sus credenciales **en el momento**, en una sesión que vive en memoria y
se destruye al terminar; ve en vivo lo que ocurre y aprueba cada paso; **nunca se persisten**.
✅ Sin custodia permanente · ✅ Autorización contemporánea y demostrable · ✅ Precedente de
mercado · ⚠️ Sigue siendo RPA (fragilidad operativa).

### Modelo C — Ejecución en el equipo del usuario (extensión de navegador)

La automatización corre **en su navegador, con su sesión y su IP**. Nosotros solo enviamos
los datos a diligenciar; las credenciales nunca tocan nuestros servidores.
✅ Riesgo de custodia ≈ 0 · ✅ Es _el propio usuario_ accediendo · ❌ Solo escritorio · ❌ Más
esfuerzo de desarrollo y mantenimiento.

### Modelo D — Asistencia humana con contador (el modelo referencia)

Un contador con mandato prepara y presenta.
✅ Modelo probado y aceptado · ❌ Responsabilidad solidaria (art. 572-1) · ❌ No escala sin
contratar personas.

### Modelo E — Solo lectura (exógena + declaraciones anteriores)

Automatizar únicamente descargas, nunca firmar ni presentar.
✅ Sin firma = sin el riesgo mayor · ✅ Enorme valor percibido · ⚠️ Mantiene el tema de
credenciales (mitigable con Modelo B o C).

---

## 6. Recomendación

**Modelo B (sesión efímera), construido por fases de riesgo creciente.** Es el mismo
camino que ya validó el mercado, pero llegando a la escritura solo cuando la lectura esté
sólida:

1. **Fase 1 — Lectura: exógena + declaraciones anteriores (Modelos E + B).**
   "Conecta tu cuenta DIAN": credenciales solo en memoria, sesión destruida al terminar, el
   usuario ve el progreso en vivo. **Nunca se firma nada.** Entrega gran parte del valor con
   una fracción del riesgo y nos deja el RPA rodado antes de tocar la firma.

2. **Fase 2 — Botón "descargar mi última declaración"** (misma infraestructura).
   Alimenta la comparación patrimonial que ya construimos.

3. **Fase 3 — Presentación con un clic** (diligenciar 210 + firmar + acuse + recibo 490),
   con doble confirmación explícita y evidencia de autorización. Requiere antes: concepto de
   abogado tributarista y póliza de responsabilidad civil. **Nunca por el Modelo A.**

**Y en todos los casos, dejar siempre disponible la vía manual** (subir el archivo, transcribir
el 210 con nuestra guía): es el fallback que garantiza que el servicio nunca depende del RPA.

---

## 7. Preguntas abiertas (a resolver antes de la Fase 3)

1. ¿Los términos de uso del portal MUISCA prohíben explícitamente el acceso automatizado?
   _No fue posible localizar el texto por búsqueda; hay que revisarlo dentro del portal._
2. ¿Existe concepto DIAN sobre uso de RPA por terceros autorizados?
3. ¿Aceptaría la DIAN un esquema de "proveedor tecnológico" para renta PN, como en factura?
4. ¿Cuánto cuesta una póliza de RC profesional que cubra este riesgo en Colombia?

---

## 8. Fuentes

- Ley 1273 de 2009 (art. 269A): http://www.secretariasenado.gov.co/senado/basedoc/ley_1273_2009.html · https://normograma.dian.gov.co/dian//compilacion/docs/ley_1273_2009.htm
- Art. 572-1 E.T. (responsabilidad solidaria): https://estatuto.co/572-1
- Decreto 1791 de 2007 (firma digital, deber de custodia): https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1791_2007.htm
- Resolución DIAN 000070 de 2016: https://crconsultorescolombia.com/resolucion-000070-dian-la-se-reglamenta-uso-firma-electronica-los-servicios-informaticos.php
- Responsabilidad del titular de la firma: https://actualicese.com/archivo/obligaciones-del-representante-legal-frente-al-uso-de-su-firma-electronica-son-inalienables/
- Circular SIC 2025 sobre fintech y datos personales: https://www.perezllorca.com/es-co/actualidad/boletin/la-sic-expide-nueva-reglamentacion-para-tratar-datos-personales-en-servicios-fintech/
- Modelo de referencia (expertos humanos): https://www.plataforma de referencia
- Servicios digitales DIAN 2026: https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx
