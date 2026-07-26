# Seguridad

Registro de la revisión de seguridad ofensiva del 2026-07-26 sobre la
plataforma en producción (turenta.tax) y de las correcciones aplicadas.

La metodología combinó **revisión de código** (auth, cifrado de credenciales
DIAN, control de acceso, inyección, manejo de secretos) con **sondeo dinámico
no destructivo** contra producción (cabeceras, verificación de autenticación por
endpoint). No se ejecutaron pruebas destructivas (DoS, fuzzing masivo, borrado)
contra el entorno con datos reales.

## Hallazgos y correcciones

Todos corregidos en el commit de esta revisión. Cada uno tiene un test de
regresión salvo donde se indica.

### 1. Rate limiter burlable por `X-Forwarded-For` — Alta

- **Dónde:** `apps/web/server/rate-limit.ts`.
- **Problema:** la clave del limitador salía del primer valor de
  `x-forwarded-for`, que lo pone el cliente. Enviando esa cabecera con un valor
  distinto en cada petición, **todos** los límites (OTP, correo) quedaban
  anulados.
- **Impacto:** habilitaba fuerza bruta del OTP y bombardeo de correo (ver 2 y 3).
- **Corrección:** se usa `cf-connecting-ip` (la establece Cloudflare y el cliente
  no puede falsificarla); `x-forwarded-for` solo como respaldo local. Es la misma
  decisión que ya tomaba el flujo DIAN.
- **Test:** `test/seguridad.test.ts` — rota el XFF y comprueba que la cuota no
  crece.
- **Supuesto residual:** el origen no es alcanzable saltándose Cloudflare (está
  tras Traefik + Tailscale/CGNAT). Si eso cambia, hace falta una allowlist de
  proxies.

### 2. Fuerza bruta del código OTP — Alta

- **Dónde:** `apps/web/app/api/auth/verificar/route.ts`,
  `packages/adaptadores/src/persistencia/repositorio-prisma.ts`.
- **Problema:** OTP de 6 dígitos con tres debilidades combinadas: un intento
  fallido no invalidaba nada, cada reenvío creaba un código nuevo **sin borrar
  los anteriores** (varios válidos a la vez), y el único límite era por IP
  (burlable, ver 1). No había tope por cuenta.
- **Impacto:** con el límite de IP anulado, apropiación de cuenta por adivinación
  del código dentro de su vigencia de 10 min.
- **Corrección:**
  - `guardarOtp` invalida en transacción los códigos previos no usados: como
    máximo uno vivo a la vez.
  - `verificar` añade un tope **por email** (5 intentos / 15 min), que no depende
    de la IP y por tanto no se puede falsear.
- **Test:** invalidación cubierta por lógica de transacción; el tope por email
  reutiliza el limitador ya probado.

### 3. Bombardeo de correo / agotamiento de cuota Brevo — Alta

- **Dónde:** `apps/web/app/api/auth/solicitar/route.ts`.
- **Problema:** con el límite de IP burlable, se podía pedir OTP ilimitados a
  cualquier dirección: acoso a la víctima (inbox inundado) y agotamiento de la
  cuota de correo, que además es el canal de acceso de los usuarios legítimos.
- **Corrección:** tope **por dirección de correo** (4 / hora), independiente de
  la IP. Responde `200` igualmente para no filtrar el límite ni la existencia de
  la cuenta.

### 4. Endpoints con LLM sin autenticación — Alta

- **Dónde:** `apps/web/app/api/entrevista/route.ts`,
  `apps/web/app/api/documentos/route.ts`.
- **Problema:** ambos invocaban el modelo (el de documentos, visión — caro) sin
  validar sesión, sin límite y `documentos` sin tope de tamaño. Confirmado en
  vivo: `POST` sin cookie devolvía 400/500, no 401. `asistente`, en cambio, sí
  exigía sesión.
- **Impacto:** cualquiera podía quemar tokens del modelo y memoria/CPU del
  servidor sin coste ni autenticación.
- **Corrección:** ambos exigen sesión y añaden límite por usuario;
  `documentos` rechaza archivos > 15 MB.
- **Nota:** el wizard que los usa ya es un flujo autenticado (guarda en
  `/api/borrador`), así que exigir sesión no cambia la experiencia.

### 5. Resultados de documentos sin dueño — Media

- **Dónde:** `apps/web/server/documentos/tareas.ts`.
- **Problema:** el resultado de leer un documento (datos fiscales extraídos) se
  guardaba por UUID sin atarlo al usuario. El UUID no es adivinable, pero si se
  filtraba, cualquiera podía leerlo.
- **Corrección:** cada tarea guarda su `usuarioId` y `consultarTarea` solo la
  devuelve a su dueño. La lectura de actividad ya no depende de `leerSesion`
  después de responder (frágil): el `usuarioId` se pasa al proceso en segundo
  plano.
- **Test:** `test/seguridad.test.ts` — otro usuario recibe `null`.

### 6. Cabeceras de seguridad ausentes — Media

- **Dónde:** `apps/web/next.config.ts`.
- **Problema:** producción no enviaba ninguna cabecera de seguridad (verificado
  con `curl -I`): sin `Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy` ni
  `Permissions-Policy`. Expuesto a clickjacking y sniffing de tipo MIME.
- **Corrección:** `headers()` aplica todas a `/:path*`. La CSP es estricta
  (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`); mantiene
  `'unsafe-inline'` en scripts/estilos porque Next inyecta hidratación en línea y
  Tailwind estilos en línea, y sin middleware no hay nonce que lo sustituya.

### 7. Avatar aceptaba SVG (XSS almacenado) — Media

- **Dónde:** `apps/web/app/api/avatar/route.ts`, `apps/web/lib/imagen.ts`.
- **Problema:** la subida validaba el MIME que envía el cliente
  (`image/*`), que admite `image/svg+xml`; un SVG puede llevar script.
- **Corrección:** se valida por **bytes mágicos** reales — solo PNG, JPEG y WebP;
  el SVG y cualquier otro formato se rechazan. Sumado a `X-Content-Type-Options:
nosniff` (hallazgo 6), cierra el vector.
- **Test:** `test/seguridad.test.ts` — acepta raster, rechaza SVG.

### 8. JWT sin fijar algoritmo — Baja (endurecimiento)

- **Dónde:** `apps/web/server/sesion.ts`.
- **Corrección:** `jwtVerify` fija `algorithms: ['HS256']`; nunca deja que la
  cabecera del token elija cómo se verifica. Riesgo bajo por ser HMAC simétrico,
  pero es la práctica correcta.

## Lo que se revisó y estaba bien

- **Aislamiento por inquilino:** las consultas Prisma filtran por `usuarioId`
  (`findFirst`/`deleteMany` con `usuarioId`), sin IDOR en declaraciones,
  personas ni actividad.
- **Cifrado de credenciales DIAN:** AES-256-GCM autenticado, con la clave solo en
  el worker aislado y el cifrado solo en la base; ninguna mitad basta por sí sola.
- **Inyección en correo:** el email va como JSON al API de Brevo y el OTP es
  numérico; no hay inyección de cabeceras ni de HTML.
- **Sin secretos en el repo:** `.env*` ignorado; no hay claves incrustadas.
- **Sesión:** cookie `httpOnly`, `sameSite=lax`, `secure` en producción, firmada.
- **Flujo DIAN:** buen limitador (por usuario + documento) y evidencia previa
  obligatoria.

## Pendientes / recomendaciones

- El limitador y el almacén de tareas son **en memoria por instancia**. Con
  varias instancias hay que migrar a Redis/Upstash para que los límites sean
  globales.
- Registrar el webhook de despliegue del worker en GitHub si se quiere que
  también se auto-despliegue (hoy es manual, por decisión).
- Considerar 2FA opcional para cuentas con accesos DIAN guardados.
