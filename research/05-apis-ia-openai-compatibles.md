# Informe: Modelos de IA con API compatible OpenAI para plataforma de declaración de renta colombiana

**Fecha de verificación: 23 de julio de 2026.** Precios en USD por millón de tokens (MTok) salvo indicación. Los precios marcados "(oficial)" fueron verificados directamente en la documentación del proveedor; el resto proviene de agregadores recientes y debe re-verificarse antes de comprometerse.

**Contexto de la arquitectura**: el LLM solo hace (a) extracción estructurada de certificados (220, bancarios, exógena), (b) entrevista conversacional, (c) explicación de resultados. El cálculo del impuesto (UVT, rentas cedulares, límites del 40%/1.340 UVT, etc.) es código determinista — esto reduce drásticamente el riesgo de alucinación y el nivel de modelo necesario.

---

## 1. Kimi (Moonshot AI)

- **Plataforma**: `platform.moonshot.ai` ahora redirige a **[platform.kimi.ai](https://platform.kimi.ai)**. Endpoint compatible OpenAI: `https://api.moonshot.ai/v1` (formato `/v1/chat/completions` estándar; funciona con el SDK de OpenAI cambiando `base_url` y `api_key`).
- **Modelos actuales (julio 2026)**: la línea vigente es **Kimi K3**, **K2.7 Code**, **K2.6** y **V1** (el antiguo "K2 Turbo" / `kimi-k2-turbo-preview` ya no es la oferta principal; K2 0711 original costaba $0.55/$2.20 según [pricepertoken](https://pricepertoken.com/pricing-page/model/moonshotai-kimi-k2)).

| Modelo                  | Input (cache miss) | Input (cache hit) | Output | Contexto              | Notas                                                                                                                                                                   |
| ----------------------- | ------------------ | ----------------- | ------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kimi K3** (oficial)   | $3.00              | $0.30             | $15.00 | 1,048,576 tokens (1M) | Razonamiento configurable (low/high/max), ToolCalls, JSON Mode, **structured output**, Partial Mode ([pricing K3](https://platform.kimi.ai/docs/pricing/chat-k3))       |
| **Kimi K2.6** (oficial) | $0.95              | $0.16             | $4.00  | 262,144 tokens        | **Multimodal: acepta texto, imagen y video** — sirve para PDFs escaneados. Caché automático, JSON mode ([pricing K2.6](https://platform.kimi.ai/docs/pricing/chat-k26)) |

- **Capacidades**: caché de contexto automático (ahorro ~80-85%), function calling, JSON mode y salida estructurada nativos. K2.6 con visión es el candidato natural para leer certificados escaneados.
- **Dónde se alojan los datos**: la [política de privacidad de Kimi OpenPlatform](https://platform.kimi.ai/docs/agreement/userprivacy) indica que la entidad contratante es **MOONSHOT AI PTE. LTD. (Singapur)** y que los datos se almacenan en **servidores en Singapur**; sin embargo, la empresa matriz es de **Beijing**, y la Ley de Inteligencia Nacional china (art. 7) permite a las autoridades exigir acceso a datos de empresas chinas y sus filiales ([análisis IAPS](https://www.iaps.ai/research/kimi-claw-risks), [securityscientist.net](https://www.securityscientist.net/blog/12-questions-and-answers-about-kimi-data-privacy-as-a-chinese-model/)).
- **Entrenamiento con tus datos**: señales contradictorias — la política de privacidad general dice que el contenido del usuario puede usarse para "training and optimizing our models" **sin opt-out a nivel de producto**; pero la página de ayuda de la API y el suplemento Business afirman que **input/output de la API no se usan para entrenar por defecto** ([ToS OpenPlatform](https://platform.kimi.ai/docs/agreement/modeluse), [discusión en HuggingFace](https://huggingface.co/moonshotai/Kimi-K2-Thinking/discussions/24)). Para datos financieros de terceros en Colombia (Ley 1581 de 2012 de habeas data), esta ambigüedad + jurisdicción china es un **riesgo legal relevante**. Alternativa: consumir Kimi K2/K3 (pesos abiertos) vía proveedores occidentales (Groq, Together, OpenRouter con ZDR) o self-host.

---

## 2. Alternativas OpenAI-compatibles — tabla comparativa

Todos exponen `/v1/chat/completions` o una capa compatible:

| Proveedor / modelo                        | Input $/MTok                                 | Output $/MTok   | Visión            | Structured output         | Contexto | Notas                                                                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------- | --------------- | ----------------- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DeepSeek v4-flash** (oficial)           | $0.14 (cache hit $0.0028)                    | $0.28           | ❌ (solo texto)   | JSON output + tools       | 1M       | El más barato; ojo: `deepseek-chat`/`deepseek-reasoner` se retiran el 24-jul-2026 ([pricing](https://api-docs.deepseek.com/quick_start/pricing))                                                                                  |
| **DeepSeek v4-pro** (oficial)             | $0.435 (hit $0.0036)                         | $0.87           | ❌                | JSON + tools              | 1M       | Modo thinking/no-thinking                                                                                                                                                                                                         |
| **Qwen3-VL-Plus** (Alibaba, Singapur)     | $0.20                                        | $1.60           | ✅                | JSON + tools              | 262K     | Muy bueno en documentos/tablas ([CloudPrice](https://cloudprice.net/models/alibaba-qwen3-vl-plus))                                                                                                                                |
| **Qwen3.7-Max**                           | $1.25 / $3.75 (promo 50%; lista $2.50/$7.50) | —               | ✅ (variantes VL) | Sí                        | 262K     | Vía Alibaba Cloud Model Studio ([guía eesel](https://www.eesel.ai/blog/qwen-pricing))                                                                                                                                             |
| **GLM-4.6 / 4.7** (Z.ai, oficial)         | $0.60 (cache $0.11)                          | $2.20           | ❌ (texto)        | Sí                        | ~200K    | [Pricing Z.ai](https://docs.z.ai/guides/overview/pricing)                                                                                                                                                                         |
| **GLM-4.6V** (visión, oficial)            | $0.30 (cache $0.05)                          | $0.90           | ✅                | Sí                        | —        | Excelente relación precio/visión                                                                                                                                                                                                  |
| **GLM-OCR** (oficial)                     | $0.03                                        | $0.03           | ✅ OCR dedicado   | —                         | —        | OCR ultra barato de Z.ai                                                                                                                                                                                                          |
| **GLM-5.2** (flagship, oficial)           | $1.40 (cache $0.26)                          | $4.40           | ❌                | Sí                        | —        |                                                                                                                                                                                                                                   |
| **Mistral Medium 3.5** (oficial)          | $1.50                                        | $7.50           | ✅                | Sí (strict)               | 128K+    | UE — buena opción de compliance ([pricing](https://mistral.ai/pricing/api/))                                                                                                                                                      |
| **Mistral Small 4** (oficial)             | $0.15                                        | $0.60           | ✅                | Sí                        | —        |                                                                                                                                                                                                                                   |
| **Groq — Kimi K2**                        | $1.00 (cache $0.50)                          | $3.00           | ❌                | Sí                        | 262K     | Latencia bajísima (LPU); batch+cache apilables ~25% del precio ([guía Groq](https://www.cloudzero.com/blog/groq-pricing/))                                                                                                        |
| **Groq — Llama 4 Scout**                  | $0.11                                        | $0.34           | ✅                | Sí                        | —        |                                                                                                                                                                                                                                   |
| **Together AI — Kimi K2.6**               | $1.20                                        | $4.50           | ❌                | Sí                        | 262K     | Catálogo amplio open-source ([guía Together](https://www.cloudzero.com/blog/together-ai-pricing/))                                                                                                                                |
| **OpenRouter** (agregador)                | pass-through sin markup                      | pass-through    | según modelo      | según modelo              | —        | Fee 5.5% al comprar créditos ($0.80 mín); BYOK gratis hasta $25K/mes; **filtro ZDR global por request** ([docs ZDR](https://openrouter.ai/docs/guides/features/zdr), [fees](https://www.truefoundry.com/blog/openrouter-pricing)) |
| **Gemini 3.1 Flash-Lite** (oficial)       | $0.25                                        | $1.50           | ✅                | responseSchema            | 1M       | Endpoint OpenAI-compatible: [ai.google.dev/gemini-api/docs/openai](https://ai.google.dev/gemini-api/docs/openai)                                                                                                                  |
| **Gemini 3.5 Flash-Lite** (oficial)       | $0.30                                        | $2.50           | ✅                | Sí                        | 1M       | [Pricing](https://ai.google.dev/gemini-api/docs/pricing)                                                                                                                                                                          |
| **Gemini 3.6 Flash** (oficial)            | $1.50                                        | $7.50           | ✅                | Sí                        | 1M       | Lanzado 21-jul-2026                                                                                                                                                                                                               |
| **OpenAI gpt-5.4-nano** (oficial)         | $0.20 (cache $0.02)                          | $1.25           | ✅                | Strict structured outputs | 400K     | [Pricing](https://developers.openai.com/api/docs/pricing)                                                                                                                                                                         |
| **OpenAI gpt-5.4-mini** (oficial)         | $0.75 (cache $0.075)                         | $4.50           | ✅                | Sí                        | 400K     | gpt-4.1-mini aún listado a $0.40/$1.60 en algunas fuentes ([pecollective](https://pecollective.com/tools/openai-api-pricing/))                                                                                                    |
| **OpenAI gpt-5.6-luna / terra** (oficial) | $1.00 / $2.50                                | $6.00 / $15.00  | ✅                | Sí                        | 400K     |                                                                                                                                                                                                                                   |
| **Claude Haiku 4.5** (oficial)            | $1.00 (cache read $0.10)                     | $5.00           | ✅                | Sí (tool use)             | 200K     | [Pricing Anthropic](https://platform.claude.com/docs/en/about-claude/pricing)                                                                                                                                                     |
| **Claude Sonnet 5** (oficial)             | $2.00 → $3.00 desde 1-sep-2026               | $10.00 → $15.00 | ✅                | Sí                        | 1M       | Precio introductorio hasta 31-ago-2026                                                                                                                                                                                            |

**Sobre Anthropic y compatibilidad OpenAI**: Sí existe. Anthropic ofrece una **capa de compatibilidad con el SDK de OpenAI**: apuntas `base_url` a `https://api.anthropic.com/v1/` con tu API key de Claude y usas `/v1/chat/completions` ([docs oficiales](https://platform.claude.com/docs/en/api/openai-sdk)). Limitaciones: el parámetro `strict` de function calling **se ignora** (el JSON no está garantizado contra el schema), no soporta prompt caching ni audio. Anthropic la recomienda para evaluación; para producción, usar el endpoint nativo `/v1/messages` o el SDK de Anthropic.

**Latencia (cualitativo)**: Groq es el más rápido (hardware LPU); Gemini Flash/Flash-Lite y gpt-5.4-nano/mini son rápidos; DeepSeek y Z.ai tienen latencia variable en horas pico de Asia; Kimi K3 en modo razonamiento es lento. **Límites**: DeepSeek permite 2,500 requests concurrentes en v4-flash (oficial); OpenAI/Anthropic/Google escalonan por tiers de gasto; Moonshot requiere recarga mínima de $1 para activar cuenta.

---

## 3. Extracción de PDFs de certificados tributarios

### Estrategia recomendada (híbrida, en cascada)

1. **PDF digital (texto embebido)** — la mayoría de certificados 220 y bancarios generados por software: extraer texto con **pdfplumber** ([github.com/jsvine/pdfplumber](https://github.com/jsvine/pdfplumber)) o pymupdf y pasar **texto** al LLM. Es 10-50x más barato que visión y más fiable para montos (no hay riesgo de mala lectura OCR de dígitos).
2. **PDF escaneado / foto** — detectar (si pdfplumber devuelve <N caracteres/página) y enrutar a:
   - **LLM con visión**: Gemini Flash/Flash-Lite, Qwen3-VL, GLM-4.6V, gpt-5.4-mini o Kimi K2.6. Los modelos de la familia Qwen-VL y Gemini son consistentemente fuertes en tablas y en español; GLM-4.6V es el mejor precio/visión ($0.30/$0.90).
   - **OCR dedicado**: **Mistral OCR 4** a **$4/1,000 páginas** o **Document AI** a $5/1,000 (oficial, [mistral.ai/pricing/api](https://mistral.ai/pricing/api/)) — devuelve markdown con tablas preservadas, ideal para luego estructurar con un LLM barato de texto (p. ej. DeepSeek). **GLM-OCR** a $0.03/MTok es aún más barato.
   - **Open source**: **Docling** (IBM, [github.com/docling-project/docling](https://github.com/docling-project/docling)) y **marker** ([github.com/datalab-to/marker](https://github.com/datalab-to/marker)) convierten PDF→markdown con tablas; **PaddleOCR v3 + PP-StructureV3** es lo mejor open-source para escaneados complejos con tablas (~94.5% precisión), y **Surya** para tablas ([ranking 2026](https://www.javadex.es/blog/mejores-modelos-open-source-ocr-reconocimiento-texto-2026)). Corren en tu infraestructura = cero exposición de datos.
3. **Excel de exógena**: no usar LLM para leer el archivo — parsear con openpyxl/SheetJS y pasar filas relevantes como texto/JSON al LLM solo si hace falta interpretación semántica de conceptos DIAN (códigos de formato 2276, 1001, etc.).

### Mejores prácticas para extracción confiable de montos

- **Structured output con schema estricto** (JSON Schema/Zod/Pydantic): campos tipados (`ingresos_brutos: number`, `retenciones: number`, NIT con regex), enums para tipo de certificado.
- **Validación determinista post-extracción**: los certificados tributarios tienen redundancia interna — verificar que subtotales sumen al total, que retención ≤ ingreso, rangos plausibles en COP, dígito de verificación del NIT. Si falla, reintentar o escalar a revisión humana.
- **Doble pasada / self-consistency**: extraer 2 veces (mismo modelo T=0 con prompt distinto, o dos modelos distintos) y comparar montos; discrepancia ⇒ bandera de revisión. Para montos que alimentan una declaración legal, esto es casi obligatorio.
- **Confidence + human-in-the-loop**: pedir al modelo `confidence` por campo y cita textual (`source_text`) del fragmento de donde tomó el monto; mostrar al usuario los valores extraídos para confirmación antes del cálculo (esto además transfiere responsabilidad al usuario).
- **Normalización de formato colombiano**: instruir explícitamente sobre separadores ($1.234.567,89 = un millón...), y validar en código, no confiar en el LLM.

---

## 4. Privacidad y cumplimiento (documentos financieros de terceros)

| Proveedor                     | ¿Entrena con datos de API?                                                                                                                                                                                                                     | Retención                                                                                                                      | Jurisdicción      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| **OpenAI API**                | **No por defecto** (opt-in)                                                                                                                                                                                                                    | ~30 días para abuso; **ZDR disponible** para clientes aprobados ([enterprise privacy](https://openai.com/enterprise-privacy/)) | EE. UU.           |
| **Anthropic**                 | No por defecto en API                                                                                                                                                                                                                          | 30 días estándar; ZDR negociable                                                                                               | EE. UU.           |
| **Google Gemini (tier pago)** | **No** — "Content not used to improve our products" solo en tier pago (oficial, [pricing](https://ai.google.dev/gemini-api/docs/pricing)); el **tier gratis SÍ usa tus datos**                                                                 | Vertex AI ofrece ZDR y residencia de datos                                                                                     | EE. UU.           |
| **Mistral**                   | No con API de pago por defecto                                                                                                                                                                                                                 | ZDR disponible; empresa UE (GDPR nativo)                                                                                       | Francia/UE        |
| **Groq**                      | No entrena (no tiene modelos propios); orientado a ZDR                                                                                                                                                                                         | Mínima                                                                                                                         | EE. UU.           |
| **Together AI**               | Opt-out disponible; revisar configuración de cuenta                                                                                                                                                                                            | Configurable                                                                                                                   | EE. UU.           |
| **Moonshot/Kimi API directa** | Página de API dice que no por defecto, pero la política de privacidad general permite "training and optimizing our models" sin opt-out claro — **ambiguo**                                                                                     | Servidores en Singapur; matriz en Beijing sujeta a ley de inteligencia china                                                   | Singapur/China ⚠️ |
| **DeepSeek API directa**      | **Sí puede usar tus datos para entrenamiento** salvo opt-out; datos **almacenados en China** ([política oficial](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)); investigada por el Garante italiano                   | China ⚠️                                                                                                                       |
| **OpenRouter**                | Configurable: **modo ZDR** que solo enruta a endpoints con Zero Data Retention (Google Vertex, AWS Bedrock, DeepInfra, Novita...), aplicable por cuenta, por modelo o por request ([docs ZDR](https://openrouter.ai/docs/guides/features/zdr)) | Según proveedor final                                                                                                          | EE. UU. (router)  |

**Implicación para tu caso**: vas a enviar certificados con NIT, cédulas, salarios y saldos bancarios de terceros — datos sensibles bajo la Ley 1581/2012 y susceptibles de exigir autorización del titular. Recomendaciones:

1. **Evitar las APIs directas de DeepSeek y Moonshot China** para documentos reales. Si quieres los modelos (K2/K3, DeepSeek V3/R1 son de pesos abiertos), consúmelos vía **Groq/Together/OpenRouter-ZDR** o Bedrock/Vertex, donde el dato no viaja a China.
2. **Pseudonimizar antes de enviar**: reemplazar nombre/cédula/NIT por tokens en tu backend antes del prompt cuando sea viable (para la entrevista casi siempre lo es; para extracción, el documento completo debe ir, así que ahí importa más el proveedor).
3. **Self-hosted para máxima protección**: **vLLM** ([docs.vllm.ai](https://docs.vllm.ai)) sirviendo **Qwen3-VL / Qwen2.5-VL-32B/72B** (visión, excelente en español y tablas) o Llama 4 con endpoint OpenAI-compatible nativo (`vllm serve` expone `/v1/chat/completions`). Un GPU A100/H100 en la nube (~$2-6/hora) o L40S para modelos 7B-32B. Los datos nunca salen de tu infraestructura; costo fijo en vez de variable — tiene sentido a partir de miles de declaraciones/mes o si el área legal lo exige.

---

## 5. Patrón de arquitectura recomendado

```
[Upload PDF/XLSX] → [Router: ¿digital o escaneado?]
     ├── digital → pdfplumber/openpyxl → texto
     └── escaneado → Mistral OCR / modelo visión → markdown
            ↓
[LLM: extracción structured output (JSON Schema + Zod)]
            ↓
[Validadores deterministas: sumas, rangos, NIT, doble pasada]
            ↓                          ↖ discrepancia → revisión humana
[Store tipado (Postgres) — "estado fiscal" del usuario]
            ↓
[LLM entrevistador con tool calling: lee estado, pide docs faltantes,
 detecta deducciones (medicina prepagada, dependientes, AFC, vivienda...)]
            ↓
[MOTOR DE CÁLCULO 100% determinista: UVT 2025/2026, cedulación,
 renta exenta 25%, límite 40%/1.340 UVT, tabla art. 241 ET — código puro + tests]
            ↓
[LLM explicador: recibe el resultado calculado y lo narra; prohibido inventar cifras]
```

Principios clave:

- **El LLM nunca produce cifras del cálculo**: la explicación recibe el output del motor como JSON y solo lo parafrasea. Verificar en código que todo número citado en la explicación exista en el JSON fuente.
- **Structured output en todas las fronteras LLM↔código**, validado con **Zod** (TS) o **Pydantic/instructor** (Python, [python.useinstructor.com](https://python.useinstructor.com) — reintentos automáticos cuando el JSON no valida).
- **Frameworks**: para stack TypeScript/Next.js, el **Vercel AI SDK** ([ai-sdk.dev](https://ai-sdk.dev)) es la opción más limpia: `generateObject`/`streamObject` con schemas Zod, proveedores intercambiables (OpenAI-compatible incluido vía `createOpenAICompatible`), streaming de UI para la entrevista. **LangChain NO es necesario** para este caso — el flujo es lineal y determinista; a lo sumo LangGraph si la entrevista evoluciona a un agente con muchos estados. Para la entrevista basta un loop de chat con tool calling (`solicitar_documento`, `registrar_deduccion`, `marcar_completo`).
- **Cachear el prompt del sistema** (reglas de la entrevista + estado fiscal): con prompt caching (Kimi, DeepSeek, OpenAI, Anthropic, Gemini) el costo de una conversación de 30 turnos cae 80-90%.
- **Abstraer el proveedor**: si todo habla `/v1/chat/completions`, cambiar de modelo es cambiar `base_url` + `model` — usa esto para negociar costo/calidad por etapa (visión barata para extracción, modelo medio para entrevista, el que sea para explicar).

---

## 6. Costo estimado por declaración

Supuestos: 10 documentos ≈ 50 páginas (mitad escaneadas), extracción ≈ 80K tokens input / 20K output; entrevista 30 turnos ≈ 450K tokens input acumulados (≈75% cacheables) / 20K output; explicación ≈ 10K/3K. Total ≈ **540K input / 43K output**.

| Escenario   | Modelos                                                                                                                                          | Costo estimado/declaración                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Barato**  | Extracción: Gemini 3.1 Flash-Lite ($0.25/$1.50) o GLM-4.6V ($0.30/$0.90); entrevista+explicación: DeepSeek v4-flash ($0.14/$0.28, cache $0.0028) | **~US$0.10–0.25** (≈ COP 400–1.000)                                    |
| **Medio**   | Todo con Kimi K2.6 ($0.95/$4.00, cache $0.16) o gpt-5.4-mini ($0.75/$4.50, cache $0.075)                                                         | **~US$0.40–0.70 con caching** (~$0.85 sin caching) (≈ COP 1.600–2.800) |
| **Premium** | Extracción: Claude Sonnet 5 o gpt-5.6-terra; entrevista: Sonnet 5 ($2/$10 hasta ago-2026) con prompt caching                                     | **~US$1.20–2.50** (≈ COP 5.000–10.000)                                 |

Extras: si usas Mistral OCR para las 25 páginas escaneadas: +$0.10 (a $4/1,000 páginas). El costo de IA es marginal frente a un precio de venta plausible de COP 50.000–200.000 por declaración — **incluso el escenario premium es <5% del precio**, así que optimiza por calidad de extracción y experiencia conversacional, no por precio de tokens.

**Recomendación práctica**: empezar con **Gemini Flash-Lite o gpt-5.4-mini para extracción con visión** (structured outputs estrictos y jurisdicción segura), **gpt-5.4-mini o Claude Haiku 4.5 para la entrevista**, y dejar Kimi/DeepSeek/GLM como segundo proveedor vía OpenRouter-ZDR para reducir costos una vez el pipeline esté validado. Evitar APIs directas chinas para documentos financieros reales de terceros.

### Fuentes principales

- Kimi: [platform.kimi.ai/docs/pricing/chat](https://platform.kimi.ai/docs/pricing/chat) · [K3](https://platform.kimi.ai/docs/pricing/chat-k3) · [K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) · [privacidad](https://platform.kimi.ai/docs/agreement/userprivacy) · [ToS](https://platform.kimi.ai/docs/agreement/modeluse) · [riesgos IAPS](https://www.iaps.ai/research/kimi-claw-risks)
- DeepSeek: [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing) · [política de privacidad](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)
- Z.ai/GLM: [docs.z.ai/guides/overview/pricing](https://docs.z.ai/guides/overview/pricing)
- Qwen: [eesel.ai/blog/qwen-pricing](https://www.eesel.ai/blog/qwen-pricing) · [cloudprice.net Qwen3-VL-Plus](https://cloudprice.net/models/alibaba-qwen3-vl-plus)
- OpenAI: [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing)
- Anthropic: [platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [compatibilidad SDK OpenAI](https://platform.claude.com/docs/en/api/openai-sdk)
- Google: [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) · [endpoint OpenAI-compatible](https://ai.google.dev/gemini-api/docs/openai)
- Mistral: [mistral.ai/pricing/api](https://mistral.ai/pricing/api/)
- Groq/Together: [cloudzero.com/blog/groq-pricing](https://www.cloudzero.com/blog/groq-pricing/) · [cloudzero.com/blog/together-ai-pricing](https://www.cloudzero.com/blog/together-ai-pricing/)
- OpenRouter: [docs ZDR](https://openrouter.ai/docs/guides/features/zdr) · [truefoundry.com/blog/openrouter-pricing](https://www.truefoundry.com/blog/openrouter-pricing)
- OCR open source: [javadex.es ranking OCR 2026](https://www.javadex.es/blog/mejores-modelos-open-source-ocr-reconocimiento-texto-2026) · [Docling](https://github.com/docling-project/docling) · [marker](https://github.com/datalab-to/marker) · [pdfplumber](https://github.com/jsvine/pdfplumber)
