# Plan: TuRenta para contadores

Objetivo: que un contador (o una firma) pueda llevar la temporada completa de renta
de sus clientes dentro de TuRenta, sin hojas de cálculo paralelas ni transcripción
manual, y con un nivel de control y de honestidad técnica que hoy no encuentra en
otra herramienta.

## 1. En qué somos fuertes hoy (esto es lo que hay que amplificar)

Antes de agregar funciones, lo que ya nos distingue y debe quedar en el centro del
producto para contadores:

1. **Motor determinista con respaldo normativo.** Cada regla vive en
   `normativa/ag2025/` citando fuente primaria (E.T., decretos, conceptos DIAN), y
   cada cifra tiene un caso dorado congelado como test. Un contador puede AUDITAR
   por qué salió cada casilla — no es una caja negra.
2. **Honestidad ante lo que no sabemos liquidar.** Detectamos eventos del año
   (ventas, herencias, premios, cripto, ingresos del exterior, retiros de AFC) y si
   algo no está soportado la declaración queda incompleta y NO se genera borrador.
   Para un contador esto no es una limitación: es una **red de seguridad** que le
   avisa "este cliente tiene un caso que exige tu criterio".
3. **Entrevista con IA que interroga, no que transcribe.** Pregunta lo que los
   documentos no dicen, confirma en vez de re-preguntar, y advierte cuando un valor
   viene solo de exógena (donde el certificado prevalece).
4. **Consentimiento DIAN con evidencia.** Autorización versionada, hasheada y
   guardada antes de tocar el portal; credenciales cifradas en bóveda aparte y
   revocables. Es la base sobre la que se puede construir el acceso por mandato.
5. **Cruce exógena vs certificados sin doble conteo.** Los certificados mandan; la
   exógena completa lo que falta y se marca como tal.

Todo lo que sigue debe apoyarse en estas cinco cosas, no reemplazarlas.

## 2. Fase A — El puesto de trabajo del contador (base)

Convertir "Clientes" de libreta de contactos en el tablero donde se trabaja.

### A1. Tablero de cartera

- Tabla con búsqueda (nombre/cédula), orden y filtros; paginación real.
- **Semáforo por cliente y año gravable**, ensamblando lo que ya existe:
  `fechaVencimiento` (plazo por últimos dígitos), `progreso.ts` (paso del wizard),
  `documentos-esperados` (qué falta), y los casos no soportados.
  Estados: sin iniciar · faltan documentos · lista para revisar · incompleta
  (requiere criterio del contador) · presentada.
- Ordenamiento por defecto: **vencimiento más cercano primero**, que es como el
  contador vive la temporada.
- Contadores de cabecera: cuántos vencen esta semana, cuántos esperan documentos,
  cuántos tienen casos que exigen revisión.

### A2. Ficha de cliente

- Historial multi-año (2024, 2025, 2026…) con el resultado de cada año y su estado.
- Datos de contacto, notas internas del contador y etiquetas libres
  (p. ej. "empleado", "independiente", "arrendador", "prioritario").
- Documentos del cliente en un solo lugar, con qué falta según su perfil.
- Acceso directo a "continuar declaración" y a comparar contra el año anterior.

### A3. Acciones en lote

- Selección múltiple para: pedir documentos, marcar como presentada, exportar.
- **Exportación de la cartera** (CSV/Excel): titular, año, estado, vencimiento,
  saldo a pagar/favor, casos pendientes. Un contador necesita esto para su propio
  control y para reportarle a su firma.

## 3. Fase B — Recolección de documentos sin fricción

Hoy el contador tiene que perseguir a cada cliente por WhatsApp y subir todo él.

- **Enlace de recolección por cliente**: token de un solo uso, con vencimiento,
  revocable, que abre una página mínima donde el cliente sube sus certificados sin
  crear cuenta. Los documentos llegan clasificados por la IA a la ficha correcta.
- **Checklist personalizado**: el enlace le muestra al cliente exactamente qué le
  falta (según su exógena y su año anterior), no una lista genérica.
- **Recordatorios automáticos** al cliente (email) con el estado de lo que falta, y
  aviso al contador cuando llega algo nuevo.
- Seguridad: los documentos tributarios son datos sensibles — tokens firmados, sin
  listar información del cliente antes de subir, expiración corta y bitácora de
  accesos.

## 4. Fase C — Revisión asistida (nuestro diferencial más fuerte)

Aquí es donde podemos ofrecer algo que no existe: no solo _elaborar_ la
declaración, sino **revisarla con criterio experto asistido**.

- **Panel de riesgos por declaración**, antes de presentar:
  - Diferencias entre exógena y lo declarado, renglón por renglón, con el origen de
    cada cifra (certificado / exógena / respuesta del cliente).
  - Comparación patrimonial: incremento vs capacidad de justificación (arts. 236-239)
    con la explicación de qué falta justificar.
  - Variación año contra año: ingresos, patrimonio, retenciones — lo que la DIAN
    cruza primero.
  - Beneficios no aprovechados: dependientes, AFC/FVP, factura electrónica, GMF,
    medicina prepagada, y cuánto cupo del límite del 40% quedó sin usar.
  - **Simulaciones que ya hace el motor**: costos vs 25% en independientes, y el
    efecto del anticipo.
- **Firma de revisión**: el contador marca "revisado por mí" y queda registrado
  quién y cuándo — trazabilidad para la firma contable.
- **Trazabilidad de cada casilla**: de dónde salió el número y qué norma lo respalda
  (ya lo tenemos en `normativa/`, falta exponerlo en la UI).

## 5. Fase D — Conexión DIAN por mandato (la más valiosa y la más delicada)

Hoy `server/dian/peticion.ts` rechaza deliberadamente el modo "tercero". Habilitarlo
es lo que le ahorra al contador el trabajo repetitivo de conseguir la exógena de
cada cliente.

- **Requisito legal previo (bloqueante):** el consentimiento debe ser del TITULAR,
  no del contador. El modelo ya lo previó (`AutorizacionDian` separa
  `titularIdentificacion` de `operadorUsuarioId`); falta el flujo donde el cliente
  autoriza expresamente a su contador, con evidencia hasheada y revocable, y con
  vigencia acotada.
- **Investigación previa obligatoria** (documento tipo `research/07`): mapeo del
  flujo de terceros en el portal, riesgo legal (art. 269A y habeas data), y política
  de manejo de credenciales de terceros. Sin esto no se escribe código.
- Alternativa intermedia mientras tanto: el enlace de la Fase B puede pedirle al
  propio cliente que conecte su cuenta DIAN una vez (él pone su clave, no el
  contador) y la exógena llega sola a la ficha. **Menos riesgo, casi el mismo
  ahorro** — probablemente sea el camino correcto incluso a largo plazo.

## 6. Fase E — Firma y equipo

- **Organizaciones**: varios contadores comparten cartera; hoy `usuarioId` es dueño
  único de todo. Conviene decidir el modelo temprano aunque se implemente después:
  migrar después cuesta mucho más.
- Roles: titular de la firma, contador, asistente (carga documentos, no presenta).
- Asignación de clientes a un responsable y vista "mis clientes" vs "los de la firma".
- Bitácora por cliente: quién hizo qué y cuándo.

## 7. Fase F — Planes y cobro

Modelo por volumen de clientes, con precios por debajo de la referencia del mercado
(~$270.000 por temporada ilimitada). Propuesta a validar:

| Plan          | Para quién                            | Precio temporada (COP) | Incluye                                         |
| ------------- | ------------------------------------- | ---------------------- | ----------------------------------------------- |
| Gratis        | Probar                                | $0                     | 1 declaración completa, con todas las funciones |
| Personal      | Quien declara lo suyo y de su familia | ~$49.000               | Hasta 3 titulares                               |
| Independiente | Contador que arranca                  | ~$99.000               | Hasta 15 clientes, tablero y recolección        |
| Profesional   | Contador establecido                  | ~$179.000              | Hasta 60 clientes, revisión asistida, exportes  |
| Firma         | Oficina contable                      | ~$239.000              | Clientes ilimitados, equipo y roles             |

Notas de diseño del cobro:

- Precio por **temporada** (año gravable), no suscripción mensual: es como el
  contador factura y como percibe su costo.
- Todos los planes incluyen el motor completo — nunca se degrada la calidad del
  cálculo por plan; lo que escala es la capacidad y las herramientas de gestión.
- El plan gratis debe permitir terminar UNA declaración de verdad (con borrador
  descargable), no una demo mutilada.
- Descuento por compra anticipada antes de que abra la temporada.

## 8. Mejoras propuestas más allá de lo obvio

Ideas que aprovechan lo que ya construimos y que aportarían valor real:

1. **Modo revisión de declaraciones ajenas.** Que un contador suba el 210 que hizo
   otra persona (o el borrador sugerido de la DIAN) y el motor le diga qué cambia y
   por qué. Ya sabemos leer un 210 presentado (`casillas-210.ts`) — es una puerta de
   entrada para captar contadores sin pedirles migrar toda su cartera.
2. **Comparador contra la declaración sugerida de la DIAN**, señalando renglón por
   renglón dónde y por qué diferimos.
3. **Cierre de temporada**: informe por cliente (qué se declaró, con qué soportes) y
   consolidado de la firma; útil para archivo y para responder requerimientos.
4. **Alertas de vencimiento** escalonadas (30/15/5 días) al contador y opcionalmente
   al cliente.
5. **Detección de clientes que quizá no están obligados a declarar**, con el cálculo
   de los topes — evita trabajo innecesario y da una conversación valiosa.
6. **Biblioteca de casos no soportados**: cuando marcamos una declaración como
   incompleta, ofrecerle al contador la referencia normativa del caso para que él lo
   resuelva — convertimos nuestra limitación en una ayuda.
7. **Plantillas de comunicación** al cliente (solicitud de documentos, entrega del
   borrador, instrucciones de pago) con los datos ya diligenciados.

## 9. Viabilidad y orden sugerido

- **Fase A**: alta viabilidad, sin riesgo tributario — es UI y consultas sobre
  modelos existentes. Máximo valor por esfuerzo.
- **Fase B**: viable; el diseño de seguridad de los tokens es lo delicado.
- **Fase C**: viable y es nuestro mayor diferencial; se apoya en datos que el motor
  ya produce.
- **Fase D**: la más valiosa para el contador y la de mayor riesgo; exige gate legal
  previo. La variante "el cliente conecta su propia cuenta" puede adelantar casi
  todo el beneficio con una fracción del riesgo.
- **Fase E**: decidir el modelo de datos temprano aunque se implemente tarde.
- **Fase F**: sin esto no hay negocio; puede ir en paralelo desde la Fase A.

Regla que se mantiene de `PLAN-COBERTURA.md`: ninguna función de gestión puede
degradar la exactitud del cálculo ni saltarse la detección de casos no soportados.
La confianza es el producto.
