# Plan de rediseño — TuRenta AI como aplicación completa (shell + dashboard)

> Objetivo: llevar la plataforma al diseño del mockup aprobado (sidebar + topbar +
> dashboard + panel derecho) con **todas las opciones 100% funcionales** y **datos
> siempre honestos** (nada mockeado, nada inventado, ningún "Pendiente de pago $0").
> Regla de oro: **mejoras y no retroceso** — el motor fiscal, el wizard probado contra
> el caso dorado y la extracción con doble pasada NO se tocan.

## 1. Decisiones de producto (confirmadas con el equipo, 2026-07-24)

| Tema               | Decisión                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pasos del wizard   | **5 pasos** (Exógena → Documentos → Entrevista → Revisión → Resultado): primero la exógena sola y el paso de documentos pide exactamente lo que ella anuncia. El progreso muestra "Paso X de 5" y % real derivado del estado. |
| Facturación / Plan | Plan único **"Beta gratuita"** con páginas reales (plan actual, beneficios, historial de facturación vacío). Wompi llega en Fase 6 sin rehacer nada.                                                                          |
| Clientes           | **Personas administradas**: fichas simples (nombres, apellidos, cédula, email/teléfono opcionales) vinculadas a sus declaraciones.                                                                                            |
| IA Fiscal          | Chat **personalizado** (contexto de las declaraciones del usuario) + **"Simular mi declaración"** con el motor determinista (la IA nunca calcula impuestos). Disclaimers legales siempre.                                     |
| Documentos         | **Solo datos extraídos** (no se almacenan los archivos originales — más privacidad, cero almacenamiento de PII binaria).                                                                                                      |
| Notificaciones     | **In-app (campana)** + **email vía Brevo solo para críticas**: vencimiento a 30/15/5 días.                                                                                                                                    |
| Tema               | El nuevo diseño funciona en **claro y oscuro** con los tokens existentes; el mockup define el look del claro.                                                                                                                 |
| Avatar             | **Iniciales por defecto** + foto opcional subible en Configuración (pequeña, guardada en BD).                                                                                                                                 |

## 2. Principios innegociables

1. **Datos honestos**: estados de declaración = `En progreso` | `Saldo a favor +$X` |
   `A pagar $X` (solo si X > 0) | `Sin saldo` (impuesto y saldo en 0). El % de
   confiabilidad y las recomendaciones salen de reglas deterministas verificables.
2. **Hexagonal intacta**: dominio en `core`/`motor-fiscal`, nada de lógica de negocio
   en componentes; los tests de arquitectura siguen mandando.
3. **Reglas de código**: max-depth 1, 25 líneas por función (.ts) / 80 (.tsx),
   400 líneas por archivo, sin else-if, imports ordenados.
4. **Caso dorado intacto**: los 61+ tests actuales siguen verdes en cada etapa.
5. La **landing pública no cambia** (ya aprobada); el rediseño aplica a la app autenticada.

## 3. Sistema de diseño

- **Tokens**: se reutilizan los existentes (verde primario, marino, suave, borde,
  error/alerta/éxito) + nuevos: `--fondo-app` (gris verdoso claro tipo mockup,
  variante oscura), sombras de tarjeta, radios (2xl tarjetas, xl chips).
- **Tipografía**: Inter vía `next/font` (look del mockup).
- **Iconos**: `lucide-react` (línea fina como el mockup; reemplaza emojis en la app
  autenticada). Dependencia pequeña y estándar.
- **Componentes UI nuevos** (`components/ui/`): `Tarjeta`, `Insignia` (badges de
  estado), `BarraProgreso`, `MenuDesplegable` (⋮ y usuario), `PaletaComandos` (⌘K,
  con `cmdk`), `Avatar` (iniciales/foto), `Tooltip`, `Toast` (feedback de acciones),
  y el `DialogoConfirmar` ya creado.
- **Responsive**: sidebar colapsa a drawer con hamburguesa en móvil; panel derecho
  baja debajo del contenido; stat cards en grid 2×2 → 1 columna.

## 4. Rutas y layout

```
app/
├─ (publica)/          → landing, /terminos, /privacidad, /ingresar (sin cambios)
└─ (app)/              → layout con Sidebar + Topbar + guard de sesión
   ├─ panel            → Dashboard (nuevo home autenticado; redirect post-login)
   ├─ declaraciones    → historial rediseñado (misma data, nuevo look + progreso)
   ├─ declaracion      → wizard actual DENTRO del shell (lógica intacta)
   ├─ clientes         → personas administradas (CRUD)
   ├─ documentos       → todos los documentos procesados (datos extraídos)
   ├─ ia-fiscal        → chat asistente + simulador
   ├─ calendario       → calendario tributario completo
   ├─ facturacion      → historial de pagos (Beta: vacío real)
   ├─ plan             → plan y suscripción (Beta gratuita)
   ├─ configuracion    → perfil, avatar, notificaciones, eliminar cuenta
   └─ ayuda            → centro de ayuda (FAQ + contacto)
```

El flujo anónimo del wizard sigue existiendo (probar sin cuenta); el shell muestra
la invitación a ingresar como hoy.

## 5. Modelo de datos (Prisma — migraciones aditivas, sin romper lo existente)

- `Usuario` += `fotoAvatar Bytes?`, `preferencias Json` (widgets visibles del
  dashboard, emails de vencimiento on/off).
- **`Persona`** (clientes): `id, usuarioId, nombres, apellidos, identificacion,
email?, telefono?, @@unique([usuarioId, identificacion])`. Al guardar una
  declaración de tercero se hace upsert de su Persona automáticamente (los terceros
  existentes se migran con un backfill).
- **`Actividad`**: `id, usuarioId, tipo, descripcion, declaracionId?, creadaEn`.
  Tipos: declaración creada/guardada/eliminada, exógena importada, documento
  procesado, borrador descargado, persona creada, simulación realizada.
- **`Notificacion`**: `id, usuarioId, tipo, titulo, cuerpo, leidaEn?, emailEnviado,
claveIdempotencia @unique, creadaEn`. La clave evita duplicar la de "vencimiento
  a 30 días" aunque se evalúe muchas veces.
- `Declaracion` no cambia de esquema (el progreso se deriva del `estado` JSON).

## 6. APIs nuevas (todas con sesión requerida)

| Ruta                           | Función                                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/panel`               | Métricas del dashboard en una sola llamada: conteo de declaraciones del año, saldo total (suma de resultados), próximo vencimiento + días restantes, personas administradas, actividad reciente (5), recomendaciones + confiabilidad por declaración. |
| `GET/POST /api/notificaciones` | Listar, marcar leídas; al consultar se evalúan las reglas de vencimiento (idempotente) y se disparan los emails críticos pendientes.                                                                                                                  |
| `CRUD /api/personas`           | Personas administradas; eliminar exige confirmar (diálogo propio) y no borra sus declaraciones sin avisar.                                                                                                                                            |
| `GET /api/actividad`           | Actividad completa paginada.                                                                                                                                                                                                                          |
| `POST /api/asistente`          | Chat IA Fiscal: Kimi (esfuerzo low) con system prompt que incluye SOLO datos del usuario autenticado (resumen de sus declaraciones/documentos) + disclaimers.                                                                                         |
| `POST /api/simulador`          | Recibe 4-5 campos (ingresos laborales año, retenciones, ¿dependientes?, prepagada, ¿vivienda?) → construye un perfil mínimo → `liquidarDeclaracion` → estimación con desglose. Determinista 100%.                                                     |
| `GET /api/busqueda?q=`         | Búsqueda global: declaraciones (titular/año), personas, secciones y acciones ("nueva declaración", "descargar borrador").                                                                                                                             |
| `PATCH /api/preferencias`      | Personalizar vista + preferencias de email.                                                                                                                                                                                                           |
| `POST /api/avatar`             | Subir/quitar foto (límite 200 KB, se guarda en BD).                                                                                                                                                                                                   |

## 7. Funcionalidad sección por sección (para que "100% funcional" sea verdad)

### Topbar

- **Búsqueda ⌘K**: paleta de comandos (cmdk) — declaraciones, personas, navegación
  y acciones rápidas. Atajo ⌘K/Ctrl+K y clic.
- **Campana**: badge con no-leídas reales; panel con lista, "marcar todas leídas".
- **Menú usuario**: avatar (iniciales/foto), nombre + rol "Administrador" (dueño de
  la cuenta), opciones: Configuración, Centro de ayuda, Salir.

### Dashboard (`/panel`)

- Saludo "Hola, {nombres} 👋" real.
- **4 stat cards** (fórmulas): declaraciones del año gravable; saldo total neto
  (suma de saldos a favor − saldos a pagar, con signo y etiqueta correcta); próximo
  vencimiento entre TODAS tus declaraciones (fecha + "faltan N días" calculado);
  personas administradas ("Tú y N más").
- **Personalizar vista**: modal con switches para ocultar/mostrar widgets
  (recomendaciones, actividad, vencimientos, asistente). Persistido en preferencias.
- **Mis declaraciones (resumen)**: hasta 3 filas con avatar de iniciales, badge
  Titular/C.C., año, vencimiento, estado honesto, **progreso real**: hitos =
  [exógena cargada, certificados, entrevista completa, resultado calculado] →
  "Paso X de 4" + % (0/25/50/75/100). Botón Continuar (carga y navega), menú ⋮
  (continuar, descargar borrador si hay resultado, eliminar con diálogo propio).
- **Recomendaciones de tu IA Fiscal**: banda con las 3 primeras + página/modal
  "Ver recomendaciones". Motor de reglas determinista (§8).
- **FAB "+"**: nueva declaración (propia o de tercero, mismo flujo actual).

### Panel derecho

- **Asistente Fiscal IA**: 4 chips de preguntas frecuentes → abren `/ia-fiscal`
  con la pregunta ya enviada; botón "Hacer una pregunta".
- **Próximos vencimientos**: 3 más cercanos entre tus titulares; link al calendario.
- **Actividad reciente**: últimos 3 eventos reales; link a la lista completa.

### Mis declaraciones (`/declaraciones`)

Rediseño visual de la tabla actual con progreso y estados honestos. Misma lógica
de cargar/continuar/eliminar (ya corregida y con diálogo propio).

### Clientes (`/clientes`)

Lista de personas con: declaraciones por año, estado de cada una, acciones (nueva
declaración para esta persona, editar datos, eliminar). Crear persona desde aquí o
automáticamente al declarar por un tercero.

### Documentos (`/documentos`)

Agregador: todos los documentos procesados en tus declaraciones — tipo, titular,
declaración a la que pertenecen, valores extraídos, estado de doble verificación
(✓ o discrepancias). Sin archivos originales (decisión de privacidad).

### IA Fiscal (`/ia-fiscal`)

- Chat con contexto personal (exógena, certificados, resultados del usuario).
- Reglas del prompt: nunca calcular impuestos (remite al motor/simulador), citar
  de dónde sale cada dato, disclaimer "orientación, no asesoría profesional".
- **Simulador**: formulario corto → motor determinista → estimación con desglose
  y CTA "Hacer mi declaración real".

### Calendario tributario (`/calendario`)

Las 50 fechas oficiales AG2025 que ya viven en `motor-fiscal` (vista lista por
mes), con TUS fechas destacadas (tu cédula y las de tus personas administradas).

### Facturación (`/facturacion`) y Plan (`/plan`)

Plan actual "Beta gratuita" (beneficios reales: declaraciones ilimitadas, IA
incluida). Facturación: historial real (vacío hasta Fase 6 Wompi) — sin datos
fingidos. Card del sidebar refleja "Plan Beta".

### Configuración (`/configuracion`)

Datos personales (nombres/apellidos/cédula — ya existen), foto de avatar,
preferencias de notificaciones por email, y eliminar cuenta (flujo ya existente,
ahora con el diálogo propio).

### Centro de ayuda (`/ayuda`)

FAQ (las de la landing + operativas) y contacto por correo.

## 8. Recomendaciones y % de confiabilidad (100% deterministas)

Reglas evaluadas sobre cada declaración (en `core`, con tests):

1. Documentos esperados de la exógena sin cargar (ya implementado) → "Te faltan N
   certificados: …".
2. Discrepancias de doble lectura sin resolver → "Revisa X valores del certificado Y".
3. Exógena de otra cédula → crítica.
4. Deducciones en $0 con señal disponible (sin dependientes marcados, GMF menor a la
   suma de certificados bancarios, prepagada sin valor con certificado cargado).
5. Entrevista incompleta / resultado sin calcular / borrador sin descargar.
6. Posible doble conteo anticipo vs saldo a favor (ya implementado).

**Confiabilidad** = 100 − penalizaciones ponderadas de las reglas incumplidas
(fórmula documentada en el código y testeada). Nunca se muestra un % que no se
pueda explicar: el detalle lista exactamente qué sumó y qué restó.

## 9. Notificaciones y emails

- Generación idempotente al consultar la campana / cargar el panel: vencimiento a
  60/30/15/5 días por titular, documentos pendientes, declaración sin terminar.
- Email Brevo SOLO en 30/15/5 días (plantilla propia, respetando la preferencia del
  usuario). `claveIdempotencia` garantiza un solo envío por umbral.

## 10. Etapas de implementación (cada una termina verde y commiteada)

| Etapa                                        | Contenido                                                                                                                                                                           | Resultado visible                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **1. Shell + Dashboard**                     | Layout (app), sidebar, topbar, tokens/Inter/lucide, `/panel` con stat cards + lista declaraciones con progreso + estados honestos, wizard envuelto en el shell sin tocar su lógica. | La app ya se ve y navega como el mockup.                       |
| **2. Personas + Actividad + Notificaciones** | Tablas Prisma, backfill de terceros, `/clientes`, campana funcional, registro de eventos en los flujos existentes.                                                                  | Clientes y campana reales.                                     |
| **3. IA Fiscal + Recomendaciones**           | `/ia-fiscal` (chat + simulador), motor de reglas + confiabilidad, banda de recomendaciones y widget del panel derecho.                                                              | El asistente y las recomendaciones funcionan con datos reales. |
| **4. Secciones restantes**                   | Calendario, Documentos, Plan, Facturación, Configuración (avatar/preferencias), Ayuda, búsqueda ⌘K, Personalizar vista, FAB.                                                        | Todos los ítems del sidebar operativos.                        |
| **5. Emails + pulido**                       | Emails de vencimiento (Brevo), responsive fino, revisión visual contra el mockup, capturas de revisión.                                                                             | Paridad total con el diseño.                                   |

## 11. Qué NO se toca

Motor fiscal y sus 40 tests, parser de exógena, extracción con doble pasada,
prompt de la entrevista, construcción del perfil, generación del PDF 210 + resumen,
APIs del wizard, landing pública, flujo de auth OTP.

## 12. Riesgos y mitigaciones

- **Regresión del wizard** → se envuelve en el shell sin modificar sus componentes;
  el caso dorado corre en cada etapa.
- **Páginas nuevas con lógica en UI** → toda regla vive en `core` con tests; los
  tests de arquitectura ya impiden importar dominio en componentes.
- **Privacidad del chat IA** → el contexto se arma server-side solo con datos del
  usuario de la sesión; nunca datos de otros usuarios; sin retención del proveedor.
- **Rendimiento del panel** → `/api/panel` agrega todo en una consulta por tabla;
  sin N+1.
