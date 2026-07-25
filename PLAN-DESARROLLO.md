# Plan de Desarrollo — tu-renta-ai

Plataforma de declaración de renta para personas naturales en Colombia (tipo referencia), con IA para extracción de documentos y entrevista conversacional, y motor de cálculo 100% determinista.

> Base de conocimiento: carpeta [`research/`](research/README.md) (normativa AG2025, exógena, legal, mercado, APIs de IA) y caso de prueba dorado en [`research/00-caso-dorado-ag2025.md`](research/00-caso-dorado-ag2025.md).

---

## 1. Objetivo y criterio de éxito del MVP

Construir una web-app donde el usuario:

1. Sube su **exógena** (Excel DIAN) y sus **certificados** (PDF: 220, bancarios, prepagada, etc.).
2. La IA extrae y clasifica los datos, y una **entrevista conversacional** pide lo que falta (dependientes, bienes, deducciones).
3. El **motor fiscal determinista** liquida el formulario 210 (AG2025).
4. Recibe su **borrador del 210 + guía paso a paso** para presentarlo en MUISCA.

**Criterio de éxito absoluto del MVP**: reproducir exactamente la declaración del caso dorado — impuesto neto **$1.217.000**, saldo a favor **$1.401.000**, RLG cédula general **$60.689.000**, patrimonio **$69.875.000** — a partir de los documentos reales de `/docs`.

Alcance MVP: residentes fiscales, cédula general (trabajo + capital) + patrimonio + retenciones + anticipo. Fuera del MVP: pensiones, dividendos, ganancias ocasionales, activos en el exterior, no-residentes (se agregan por fases; el motor los deja modelados desde el inicio).

---

## 2. Decisiones tecnológicas

| Área                       | Decisión                                                                                   | Justificación                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Lenguaje                   | **TypeScript estricto** en todo (front, back, motor)                                       | Un solo lenguaje, tipos compartidos con Zod                                      |
| Framework web              | **Next.js 15 (App Router) + React 19**                                                     | UI moderna tipo referencia, SSR, API routes como adaptador de entrada               |
| UI                         | **Tailwind CSS 4 + shadcn/ui + Radix**                                                     | Design system moderno, accesible, responsive mobile-first                        |
| IA                         | **Kimi K3 vía OpenCode Zen** (API compatible OpenAI)                                       | Decisión del usuario; ver §5                                                     |
| SDK de IA                  | **Vercel AI SDK** (`createOpenAICompatible` + `generateObject`/`streamText` con Zod)       | Structured output validado, streaming de la entrevista, proveedor intercambiable |
| Base de datos              | **PostgreSQL + Prisma**                                                                    | Relacional, migraciones versionadas                                              |
| Almacenamiento de archivos | Local en dev / S3-compatible en prod (cifrado at-rest)                                     | Documentos tributarios sensibles                                                 |
| Monorepo                   | **pnpm workspaces + Turborepo**                                                            | Separa motor puro de la app                                                      |
| Parsing PDF/Excel          | `pdf-parse`/`unpdf` (texto embebido) + visión Kimi K3 (escaneados); `exceljs` para exógena | Cascada barata→cara (ver research/05 §3)                                         |
| Testing                    | **Vitest** (unit + golden tests) + Playwright (e2e)                                        | Golden test = caso dorado                                                        |
| Calidad                    | ESLint flat config estricto (adaptado de un proyecto interno) + Prettier + Husky + lint-staged + CI | Ver §6                                                                           |

---

## 3. Arquitectura: hexagonal (puertos y adaptadores)

**Recomendación: hexagonal, no "Clean Architecture" completa.** Razones:

- Comparten el principio esencial (dominio puro en el centro, dependencias apuntando hacia adentro), pero Clean agrega ceremonias (interactors, presenters, boundaries por caso de uso) que en un producto de este tamaño solo agregan fricción.
- Hexagonal es exactamente lo que ya usa y hace cumplir `un proyecto interno` con ESLint (`domain / application / infrastructure` + `import/no-restricted-paths`) — reutilizamos reglas y disciplina ya probadas por ti.
- El activo más valioso del proyecto es el **motor fiscal**: debe ser un paquete TypeScript **100% puro** (cero dependencias de framework, BD o IA), testeable con el caso dorado, auditable para la garantía legal, y portable (año gravable como parámetro). Hexagonal lo protege con la mínima burocracia.

### 3.1 Estructura del monorepo

```
tu-renta-ai/
├── apps/
│   └── web/                          # Next.js — adaptador de entrada (UI + API routes)
│       ├── app/                      # rutas App Router
│       ├── components/               # UI (shadcn/ui + propios)
│       └── server/                   # composición: inyecta adaptadores en casos de uso
├── packages/
│   ├── motor-fiscal/                 # ❤️ DOMINIO PURO — cero deps externas
│   │   ├── src/
│   │   │   ├── constantes/           # UVT, tablas art. 241, topes por año gravable
│   │   │   ├── modelo/               # PerfilFiscal, Ingreso, Deduccion, Patrimonio...
│   │   │   ├── depuracion/           # cédula general (trabajo/capital/no laborales)
│   │   │   ├── liquidacion/          # impuesto, anticipo, saldo a favor, redondeo art. 577
│   │   │   └── formulario210/        # mapeo resultado → casillas del 210
│   │   └── test/                     # golden tests + property tests
│   ├── core/                         # APLICACIÓN — casos de uso + puertos (interfaces)
│   │   ├── src/
│   │   │   ├── casos-uso/            # ProcesarDocumento, ConducirEntrevista, GenerarBorrador...
│   │   │   └── puertos/              # LlmPort, DocumentoRepo, ArchivoStorage, ExtractorPort
│   ├── adaptadores/                  # INFRAESTRUCTURA
│   │   ├── src/
│   │   │   ├── llm-opencode/         # cliente OpenCode Zen (Kimi K3), structured output
│   │   │   ├── extraccion/           # parsers: exógena XLSX, 220 PDF, certificados
│   │   │   ├── persistencia/         # Prisma/Postgres
│   │   │   └── storage/              # archivos S3/local
│   └── shared/                       # esquemas Zod + tipos compartidos (sin lógica)
├── docs/                             # documentos del caso dorado (NO tocar)
├── research/                         # investigación
└── PLAN-DESARROLLO.md
```

### 3.2 Reglas de dependencia (obligatorias, enforced por ESLint)

```
apps/web  →  packages/core  →  packages/motor-fiscal
    ↘             ↑
      packages/adaptadores (implementa puertos de core)
```

- `motor-fiscal`: no importa NADA externo (ni siquiera Zod — tipos propios). Funciones puras: `(PerfilFiscal, AñoGravable) → Formulario210`.
- `core`: importa motor-fiscal y define puertos; prohibido importar Prisma, Next, AI SDK.
- `adaptadores`: implementa los puertos; único lugar con Prisma/AI SDK/fs.
- `apps/web`: compone (inyección manual en `server/`); los componentes React no llaman adaptadores directamente.
- **El LLM jamás produce cifras del cálculo**: extrae (con `source_text` y `confidence` por campo), conversa y explica el JSON que el motor produjo. Toda cifra mostrada debe existir en la salida del motor o en un documento fuente.

---

## 4. UI/UX — al nivel de referencia o mejor

Principios (de research/04: qué hace bien referencia y dónde duele):

1. **Mobile-first responsive**: la mayoría declara desde el celular. Breakpoints Tailwind estándar; toda pantalla se diseña primero en 390px. Prohibido scroll horizontal; tablas → cards en móvil.
2. **Un paso a la vez**: wizard con progreso visible (Documentos → Entrevista → Revisión → Borrador). El usuario nunca ve el formulario 210 crudo hasta el final.
3. **Drag & drop + cámara**: zona de carga que acepta PDF/XLSX/imagen; en móvil, botón "tomar foto del certificado".
4. **Transparencia que vende**: mostrar en vivo lo extraído de cada documento ("Encontré: salarios $52.926.000 de tu empleador ✓ confírmalo") — el usuario valida cada cifra extraída por IA (human-in-the-loop, además transfiere responsabilidad).
5. **Resultado explicado**: pantalla final tipo referencia (impuesto/saldo a favor grande y claro) + desglose expandible por cédula + "por qué" en lenguaje simple generado por IA desde el JSON del motor.
6. **Estados vacíos, carga y error diseñados** desde el día 1 (skeletons, reintentos de extracción, documento ilegible).
7. Accesibilidad AA (Radix ya ayuda: focus, teclado, contraste).
8. Design tokens propios (paleta, tipografía) definidos en Fase 0 para no parecer clon de referencia.

---

## 5. Configuración de IA (Kimi K3 vía OpenCode Zen)

- **Endpoint**: `https://opencode.ai/zen/v1` (compatible OpenAI, auth `Authorization: Bearer $OPENCODE_API_KEY`).
- **Modelo principal**: `kimi-k3` (multimodal, 1M contexto, razonamiento configurable; $3/$15 por MTok, cache read $0.30). Verificar el ID exacto en el catálogo Zen al configurar; fallback de extracción visual: `kimi-k2.6` / `gemini-3.5-flash` vía el mismo gateway.
- **Privacidad**: OpenCode Zen declara **zero-retention** en sus proveedores (excepto modelos free y OpenAI/Anthropic 30 días) — mitiga el riesgo Ley 1581 identificado en research/05. Aun así: contrato de transmisión + autorización del titular informando procesamiento en el exterior (research/03 §2).
- **Usos**: (a) extracción structured output de PDFs con validación Zod + doble pasada en montos; (b) entrevista con tool calling (`registrar_dato`, `solicitar_documento`, `marcar_completo`); (c) explicación del resultado. Prompt caching activado (la entrevista reutiliza el system prompt).
- **Secretos**: la key vive en `.env.local` (git-ignored) como `OPENCODE_API_KEY`. ⚠️ La key fue compartida por chat → **rotarla en el dashboard de OpenCode** y nunca commitearla. En prod: secret manager del hosting.
- **Abstracción**: todo pasa por `LlmPort`; cambiar de modelo = cambiar env vars (`LLM_BASE_URL`, `LLM_MODEL`).

---

## 6. Reglas de desarrollo estrictas (adaptadas de un proyecto interno)

Se adopta el eslint de `un proyecto interno` (backend `.eslintrc.cjs` + frontend flat config) adaptado a React/Next:

**Límites de código (idénticos a un proyecto interno):**

- `max-lines`: 400 por archivo (500 en archivos de config/rutas).
- `max-lines-per-function`: 25 (30 en componentes React; off en tests).
- `max-depth`: **1** — sin estructuras de control anidadas; guard clauses obligatorias.
- `sonarjs/cognitive-complexity`: 10.
- `sonarjs/no-duplicate-string`: máximo 2 repeticiones (threshold 3).
- Prohibidos: `else if` en cadena (usar guard/switch/extracción), catch vacío, namespace imports, tabs, `console.*` (usar logger; permitido en scripts/tests).
- `import/order` con grupos y alfabético; `eol-last`; `curly` siempre.
- `@typescript-eslint` con type-checking (`recommendedTypeChecked`); `no-explicit-any` (error en dominio/aplicación, warn en adaptadores); `strict: true` + `noUncheckedIndexedAccess` en tsconfig.

**Arquitectura enforced (patrón un proyecto interno con `import/no-restricted-paths` + `no-restricted-imports`):**

- `motor-fiscal` no puede importar de core/adaptadores/web ni libs de infraestructura (prisma, next, ai, exceljs...).
- `core` no puede importar de adaptadores/web ni frameworks.
- Componentes React (`apps/web/components`) no pueden importar adaptadores.

**Proceso:**

- Husky + lint-staged: eslint + typecheck en pre-commit (mismo patrón `lint-staged.config.js` de un proyecto interno).
- CI (GitHub Actions): lint → typecheck → tests (golden tests bloqueantes) → build. Sin merge con CI en rojo.
- Conventional Commits + CHANGELOG.
- Cobertura mínima: **motor-fiscal 100% de ramas**; core ≥ 90%; adaptadores ≥ 70%.
- Cifras monetarias: **enteros COP** (nunca float); redondeo solo en la capa formulario210 (art. 577).
- Todo valor normativo (UVT, topes, tarifas) vive en `constantes/` parametrizado por año gravable — prohibido hardcodear en la lógica.

---

## 7. Fases y entregables

### Fase 0 — Fundaciones (1 semana)

- [ ] Scaffold monorepo (pnpm + Turborepo + Next.js + paquetes vacíos con reglas de dependencia).
- [ ] ESLint estricto + Prettier + Husky + lint-staged + CI + Vitest.
- [ ] `.env.example` / `.env.local` (OPENCODE_API_KEY, DATABASE_URL, LLM_BASE_URL, LLM_MODEL).
- [ ] Prueba de humo del LLM: llamada a Kimi K3 vía Zen con structured output Zod.
- [ ] Design tokens + layout base responsive (shell del wizard).
- **Gate**: CI verde, lint pasa, smoke test IA responde JSON válido.

### Fase 1 — Motor fiscal + caso dorado (2-3 semanas) ← el corazón

- [ ] `constantes/ag2025.ts` con TODAS las constantes de research/01 (resumen §"constantes para el motor").
- [ ] Modelo de dominio: `PerfilFiscal` (ingresos por fuente, INCRNGO, deducciones, exentas, patrimonio, retenciones, historial).
- [ ] Depuración cédula general: rentas de trabajo (25% exento, cesantías art. 206-4, dependientes 10%+72 UVT, prepagada) y capital (componente inflacionario 55,43%, GMF 50%).
- [ ] Límite global 40%/1.340 UVT + beneficios fuera del límite (72 UVT, 1% factura electrónica).
- [ ] Tabla art. 241, anticipo (25/50/75%, dos procedimientos), saldo a favor, redondeo art. 577.
- [ ] Mapeo a casillas del 210 (descargar PDF oficial + instructivo de la DIAN para numeración exacta).
- [ ] **Golden test**: fixture con los datos del caso dorado → salida idéntica a referencia (los 4 valores del §1 y todas las casillas del borrador de la página 14 del resumen).
- [ ] Resolver las 6 preguntas abiertas de research/00 (prorrateo dependientes 11 meses, anticipo 75% con promedio, 2.º certificado Salud Prepagada...) documentando cada regla con test propio.
- **Gate**: golden test verde casilla por casilla + 100% branch coverage del motor.

### Fase 2 — Ingestión de documentos (2 semanas)

- [ ] Parser exógena XLSX (determinista, sin IA): filas → hechos tipados usando "Uso Declaración Sugerida" (mapeo R## de research/02 §3) + topes.
- [ ] Extractor 220 y certificados PDF: cascada texto-embebido → visión K3; schemas Zod por tipo de documento; `source_text` + `confidence` por campo; doble pasada en montos con discrepancia → revisión.
- [ ] Validadores: subtotales suman, retención ≤ ingreso, DV del NIT, conciliación exógena ↔ certificados (2276 ≡ 220) con alertas de faltantes/duplicados.
- [ ] Persistencia: modelo Prisma (Usuario, Declaracion, Documento, HechoFiscal con origen/trazabilidad).
- **Gate**: los 6 documentos reales de `/docs` se ingieren y producen el `PerfilFiscal` que alimenta el golden test end-to-end (documentos → motor → resultado referencia).

### Fase 3 — Entrevista IA + wizard UI (2-3 semanas)

- [ ] Flujo wizard: onboarding (¿obligado a declarar? topes; gate art. 596-6) → carga docs → confirmación de extracciones → entrevista → revisión.
- [ ] Entrevista conversacional (streaming): detecta huecos del perfil (dependientes, bienes personales, CxC, deudas, meses trabajados, GMF adicional) y deducciones no aprovechadas; tool calling escribe en el perfil **siempre con confirmación visual del usuario**.
- [ ] Pantalla de resultado: cifra principal + desglose por cédula + explicación IA (solo parafrasea el JSON del motor) + sugerencias de optimización para el año siguiente.
- [ ] Responsive completo + estados de carga/error + accesibilidad.
- **Gate**: e2e Playwright del caso dorado completo por la UI en desktop y móvil.

### Fase 4 — Salida: borrador 210 + guía MUISCA (1-2 semanas)

- [ ] PDF del borrador 210 (layout fiel al formulario, marca "BORRADOR") con react-pdf/pdf-lib.
- [ ] Guía de presentación paso a paso personalizada (firma electrónica → diligenciar casilla por casilla → firmar/presentar → 490/PSE), con los valores del usuario insertados (modelo research/02 §7).
- [ ] Fecha de vencimiento personalizada según últimos dígitos de la cédula (calendario research/01 §8).
- **Gate**: usuario de prueba presenta (en simulacro) usando solo la guía.

### Fase 5 — Endurecimiento y beta (2 semanas)

- [ ] Auth (email + OTP), rate limiting, cifrado de documentos at-rest, borrado de datos a solicitud (habeas data).
- [ ] Legal: T&C (checklist research/03 §8: obligación de medio, garantía acotada a error de cálculo, usuario declarante), política de datos Ley 1581, autorización de transmisión internacional, estudio de impacto de privacidad (Circular SIC 002/2024).
- [ ] Observabilidad: logging estructurado, trazas de extracción (qué modelo, qué confidence), métricas de costo IA por declaración.
- [ ] Beta cerrada: 5-10 declaraciones reales de conocidos comparadas contra referencia/contador.
- **Gate**: ≥ 3 declaraciones reales reproducidas correctamente además del caso dorado.

### Fase 6 — Monetización con Wompi (post-beta)

- [ ] Modelo de negocio "calcula gratis → paga para descargar" (Taxfix): el usuario ve su resultado (cifra grande) gratis; el borrador PDF + guía + casillas se desbloquean pagando.
- [ ] Integración **Wompi** (checkout web / widget): crear transacción, redirect/webhook de confirmación, verificación de firma de eventos, estados (pendiente/aprobada/rechazada) persistidos.
- [ ] Requiere primero Fase 5 (auth + persistencia Postgres) para asociar pagos a declaraciones.
- [ ] Facturación electrónica de los cobros (obligación DIAN, research/03 §7) e IVA 19% en el precio.
- [ ] Cupones/planes B2B (modelo referencia para empresas) como segunda ola.

**Post-MVP (backlog):** cédula de pensiones y dividendos, ganancias ocasionales, activos en el exterior (formato 160), independientes con costos, comparador "sugerida DIAN vs nosotros", conexión DIAN con mandato (research/03 §5 — alto riesgo, fase tardía), multi-año gravable, visión K3 para PDFs escaneados, streaming en el chat de entrevista.

---

## 8. Estrategia de testing

1. **Golden tests** (sagrados): caso dorado completo + cada declaración real de la beta se congela como fixture. Cualquier cambio del motor que altere una salida rompe CI.
2. **Property tests** del motor: redondeos, monotonía (más ingreso nunca baja el impuesto), límites (nunca exceder 40%/1.340 UVT), no-negatividad.
3. **Tests de extracción**: fixtures de PDFs reales (anonimizados) por entidad; asserts de campos críticos; presupuesto de tolerancia cero en montos.
4. **Contract tests** de puertos: cada adaptador cumple su puerto.
5. **E2E Playwright**: flujo completo desktop + móvil (viewport 390px).
6. **Eval de LLM**: set de prompts de entrevista con respuestas esperadas (no cifras inventadas, siempre confirma antes de escribir).

---

## 9. Seguridad y datos (resumen operativo)

- Key de OpenCode solo en env/secret manager; **rotar la key actual** (expuesta en chat).
- Documentos cifrados at-rest, URLs firmadas, retención mínima, borrado a solicitud.
- No enviar al LLM datos que no necesita; los documentos van completos solo al extractor (zero-retention Zen).
- Nunca pedir ni almacenar credenciales MUISCA en el MVP.
- Logs sin PII (cédulas/NIT enmascarados).

---

## 10. Próxima acción inmediata

Arrancar **Fase 0 + Fase 1 en paralelo**: scaffold del monorepo con las reglas ESLint, y primer módulo del motor (`constantes/ag2025.ts` + tabla art. 241) con su primer golden test parcial (RLG $60.689.000 → impuesto $1.217.000).
