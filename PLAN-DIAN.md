# Plan de desarrollo — Conexión con la DIAN

> Basado en [`research/07-automatizacion-dian-analisis-2026.md`](research/07-automatizacion-dian-analisis-2026.md).
> **Modelo elegido: B — sesión efímera asistida** (un modelo de sesión efímera asistida usado
> en el mercado). Las credenciales del usuario **nunca se almacenan**: viven en memoria
> durante la operación y se destruyen al terminar.

## 1. Principios innegociables

1. **Cero persistencia de credenciales.** Ni en base de datos, ni en disco, ni en logs, ni
   en el estado del wizard. Solo memoria del proceso, con borrado explícito al cerrar.
2. **El usuario conduce.** Cada operación arranca por una acción suya, ve el progreso en
   vivo y —para presentar— confirma dos veces. Nunca operamos "en background".
3. **Autorización explícita y con evidencia.** Antes de cada conexión, un consentimiento
   específico (qué haremos, con qué alcance, por cuánto tiempo), registrado con fecha, hora,
   IP y hash del texto aceptado. Revocable siempre.
4. **La vía manual nunca desaparece.** Subir el archivo y transcribir el 210 con nuestra
   guía siguen disponibles: si el RPA falla, el servicio no se cae.
5. **Lectura antes que escritura.** No se toca la firma electrónica hasta que la conexión de
   solo lectura esté probada en producción con usuarios reales.

## 2. Arquitectura

```
apps/web  →  core (puerto ConexionDianPort)  →  adaptadores/dian (Playwright)
                                                      ↓
                                            proceso worker aislado
                                            (sin acceso a la BD)
```

**Decisión con vista al futuro B2B (contadores, tipo Contadia)**: el puerto se diseña con
un **titular explícito** (la cédula de quien declara) separado de **quién opera** (el usuario
autenticado en nuestra plataforma). Hoy coinciden; mañana, cuando un contador conecte la
cuenta de su cliente, solo cambia quién autoriza — no la arquitectura. Por eso las
operaciones reciben `titular` como parámetro desde el primer día y la evidencia de
autorización registra **ambas identidades**.

- **Puerto en `core`**: `ConexionDianPort` con `descargarExogena`, `descargarDeclaracion`,
  `presentarDeclaracion`. El dominio no sabe que existe un navegador.
- **Adaptador en `adaptadores/dian`**: Playwright encapsulado. Es el único que ve las
  credenciales.
- **Worker aislado**: proceso separado sin credenciales de BD ni acceso a otros datos. Si
  algo se compromete ahí, no arrastra la plataforma.
- **Transporte**: las credenciales viajan de la UI al worker por HTTPS y una sesión de un
  solo uso identificada por token efímero; se limpian con `finally` garantizado.

**Declaraciones de terceros (19-sep-2026)**: se habilita conectar la cuenta de otra persona
**con sus propias credenciales** (en MUISCA es "A nombre propio" de esa persona; el robot no
cambia). El operador nunca firma "soy el titular": el texto de autorización v3 tiene una
variante donde declara que la persona le entregó su usuario y contraseña y lo autorizó, y esa
variante queda en la huella de la evidencia. El servidor verifica la titularidad antes de tocar
el portal (`errorDeTitularidad` en core): con la cédula propia solo la cuenta propia, y con la
de otra persona solo alguien para quien el usuario ya elabora una declaración. El ingreso "A
nombre de un tercero" (el operador con SUS credenciales como representante) sigue sin mapear.

## 3. Fases

### Fase 1 — Conexión de solo lectura: exógena

**Alcance**: "Conectar mi cuenta DIAN" en el paso 1 del wizard. El usuario ingresa documento
y contraseña, ve el progreso paso a paso, y la exógena entra al flujo actual como si la
hubiera subido a mano.

- ✅ **Adaptador Playwright calibrado contra el portal real** (25-jul-2026): login, aceptar
  condiciones, seleccionar año, generar y descargar el Excel. Selectores verificados en
  [`research/07…`](research/07-automatizacion-dian-analisis-2026.md) §2.1.2.
- Pantalla de consentimiento previo con registro de evidencia.
- Manejo honesto de errores: credenciales inválidas, portal caído, cambio de estructura,
  captcha → mensaje claro + "descárgala manualmente" con la guía de siempre.
- Nunca se guarda el archivo original (coherente con la decisión de privacidad ya tomada:
  solo datos extraídos).

**Estado (25-jul-2026)**: implementada y cableada en el wizard. "Conectar con la DIAN"
es la opción principal del paso 1 y la subida manual queda siempre visible al lado.

**Criterio de salida**: 20 conexiones reales exitosas y fallback probado.

### Fase 2 — Descargar declaraciones anteriores

**Alcance**: botón "Traer mi última declaración". Alimenta lo que ya construimos: patrimonio
líquido anterior, impuesto neto y anticipo (comparación patrimonial del art. 236).

- ✅ **Adaptador calibrado contra el portal real** (25-jul-2026): descarga el PDF de la
  declaración presentada del año pedido. Ruta y selectores en
  [`research/07…`](research/07-automatizacion-dian-analisis-2026.md) §2.1.3.
- Misma infraestructura de Fase 1, distinta ruta del portal (SPA de Angular, no JSF).
- El PDF pasa por el extractor `declaracion_anterior` que ya existe.
- Si la cuenta no tiene declaración de ese año, el puerto responde `sin_declaracion`: no es
  un error, es el caso normal de quien declara por primera vez.
- **Estado (25-jul-2026)**: implementada. Botón "Traer mi última declaración" en el bloque de
  declaración anterior, con ruta `/api/dian/declaracion`.

### Fase 3 — Presentar el 210 con un clic

**Implementado en local (19-sep-2026), pendiente de estrenar contra una cuenta real.**
El mapeo del portal está en [`research/09`](research/09-presentacion-210-muisca.md).

**Requisitos previos (bloqueantes antes de ofrecerlo a terceros)**:

- [ ] Concepto de abogado tributarista sobre el modelo y los textos de autorización
- [ ] Póliza de responsabilidad civil profesional
- [ ] Revisión de las condiciones de uso del portal MUISCA (leerlas dentro del portal)

**Requisito del titular**: firma electrónica vigente. Sin ella el portal no abre siquiera
el formulario y TuRenta responde `sin_firma_electronica` con las instrucciones para
generarla. No es algo que el robot pueda resolver: el código va al correo/celular del RUT.

**Flujo** (`presentarDeclaracion` → `llegarAFirma210` + `firmar-210-muisca.ts`):

1. Diligencia las 15 secciones y compara TODO lo que calcula el portal.
2. No guarda si el recorrido quedó incompleto (anclas 31, 91 y 111) o si hay diferencias.
3. Guarda, pulsa "Guardar y continuar" y abre la firma.
4. Firma con la contraseña de la cuenta —que la DIAN unificó con la de la firma electrónica
   desde sep-2023— y con el código dinámico solo si el portal lo exige. Si lo exige y no lo
   tenemos, NO firma: lo solicita y TuRenta se lo pide al usuario.
5. Presenta (paso aparte de firmar) y descarga el acuse.
6. Sin acuse no se da por presentada: Resolución 000227 de 2025, art. 1.7.4.2 num. 7.

- Doble confirmación: autorización con alcance `presentar_declaracion` + resumen "esto es
  definitivo" antes de radicar.
- Descarga inmediata del acuse; el 490 (pago) queda pendiente para quien tenga saldo a pagar.
- Registro de auditoría: `AutorizacionDian` con hash del texto aceptado y desenlace.

## 4. Seguridad (transversal)

| Medida                  | Estado | Detalle                                                                        |
| ----------------------- | ------ | ------------------------------------------------------------------------------ |
| Credenciales en memoria | ✅     | Tipo `Secreto`: `toString`/`toJSON`/`inspect` devuelven `[REDACTADO]`          |
| Sin logs                | ✅     | `detalleSeguro` descarta el volcado de Playwright; test estático lo vigila     |
| Aislamiento             | ✅     | `apps/worker-dian` en contenedor propio, sin `DATABASE_URL` ni secretos        |
| Rate limiting           | ✅     | Por fallos, usuario, documento y global, más portón de concurrencia            |
| Auditoría               | ✅     | Modelo `AutorizacionDian`: hash del texto, IP, alcances y desenlace            |
| Sesión de un uso        | ❌     | Descartado: la credencial ya viaja en un único POST; el token no añadiría nada |
| Salida de red           | ❌     | Pendiente del VPS con IP fija (ver §9 y el riesgo de CGNAT del informe)        |

## 5. Textos legales a redactar

1. **Consentimiento de conexión** (por sesión): qué haremos, con qué alcance, cuánto dura,
   que no guardamos la contraseña, cómo revocar.
2. **Consentimiento de presentación** (Fase 3): que el usuario es el declarante y firmante,
   que la responsabilidad de lo declarado es suya, que revisó el borrador.
3. **Actualización de Términos y Privacidad**: sección de conexión con la DIAN.

El texto 2 ya está redactado en `core/dian/autorizacion.ts` (alcance `presentar_declaracion`,
versión v4): incluye que la declaración quedará presentada y que solo se corrige con una
declaración de corrección. Falta la revisión de abogado antes de abrirlo a terceros.

## 6. Lo que NO haremos

- ❌ Guardar credenciales para "reconectar automáticamente"
- ❌ Operar sin que el usuario esté presente
- ❌ Constituirnos en mandatarios (evita la responsabilidad solidaria del art. 572-1)
- ❌ Generar la firma electrónica del usuario en su nombre
- ❌ Prometer que la conexión siempre funcionará (el MUISCA cambia sin aviso)

## 7. Riesgos asumidos conscientemente

| Riesgo                                               | Mitigación                                               | Residual       |
| ---------------------------------------------------- | -------------------------------------------------------- | -------------- |
| Zona gris del art. 269A ("por fuera de lo acordado") | Autorización expresa + evidencia + precedente de mercado | Bajo pero real |
| MUISCA cambia y rompe el RPA                         | Fallback manual siempre visible + monitoreo              | Medio          |
| Bloqueo de IP por parte de la DIAN                   | Rate limiting + IP dedicada                              | Medio          |
| Filtración de credenciales                           | No se almacenan: no hay qué filtrar                      | Muy bajo       |

## 8. Futuro B2B — contadores (fuera del alcance de estas fases)

Referencia de mercado: **Contadia** ($270.000/año, ilimitado) ofrece a contadores "conexión
automática de la cuenta de Muisca de tu cliente", "presentación directa sin transcripciones"
y "garantía ante sanciones de la DIAN por cálculos en la app".

Lo que se decide **ahora** para no bloquearlo después:

- El puerto separa titular de operador (ver §2).
- La entidad `Persona` (clientes) ya existe y soporta múltiples titulares por cuenta.
- La evidencia de autorización guarda quién autorizó y a nombre de quién se operó.

Lo que quedará pendiente cuando llegue el momento: mandato del cliente hacia el contador,
facturación por suscripción, y roles/permisos dentro de una misma cuenta.

## 9. Orden sugerido

Fase 1 → probar una temporada → Fase 2 → validación legal → Fase 3.

**Nota de infraestructura**: antes de Fase 1 conviene mover la app a un VPS con IP fija y
reputada. El servidor doméstico tras CGNAT funciona para la beta, pero no es el origen
adecuado para conectarse a la DIAN a nombre de terceros.

## 10. Cómo desplegarlo

```bash
# Un token compartido entre la app y el worker (no es una contraseña de usuario)
export WORKER_DIAN_TOKEN="$(openssl rand -hex 32)"
docker compose -f docker-compose.prod.yml up -d --build
```

**En local, igual que en producción** (misma imagen de Playwright, mismo aislamiento):

```bash
# .env.dian.local (gitignored) — solo lo lee el contenedor del worker:
#   WORKER_DIAN_TOKEN=<openssl rand -hex 32>
#   DIAN_CRED_KEY=<openssl rand -hex 32>
# .env.local — la web: WORKER_DIAN_URL=http://127.0.0.1:8787 y el mismo WORKER_DIAN_TOKEN
docker compose --profile dian up -d --build worker-dian
```

Variables que lee `apps/web`:

| Variable            | Efecto                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `WORKER_DIAN_URL`   | Sin ella, la conexión automática queda deshabilitada (no rompe nada) |
| `WORKER_DIAN_TOKEN` | Debe coincidir con la del worker                                     |

El worker **no recibe** `DATABASE_URL` ni ningún otro secreto de la aplicación: es
deliberado, no un olvido.

## 11. Cómo se prueba

```bash
pnpm test                                        # dominio, adaptadores y guardianes
pnpm --filter @turenta/adaptadores test:navegador # flujo completo contra un MUISCA falso
pnpm --filter @turenta/worker-dian test:navegador # integración HTTP → Chromium → portal falso
```

Los de navegador necesitan Chromium (`pnpm exec playwright install chromium`) y van aparte
para no romper máquinas sin navegador; en CI deben ser **bloqueantes**.

**Lo que estos tests NO cubren, dicho sin adornos**: las fixtures congelan lo que _nosotros_
creemos del portal, no lo que el portal es. Si la DIAN renombra un control, siguen en verde y
producción se cae igual. Son regresión de nuestro código, no un contrato con la DIAN. Tampoco
cubren el salto OAuth/STS real, el `ViewState` de JSF, captcha, MFA ni la latencia del portal.
