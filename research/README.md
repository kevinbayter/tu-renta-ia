# Investigación — Plataforma de declaración de renta con IA (tipo referencia)

Investigación realizada el 23 de julio de 2026 como base para planificar el proyecto.

## Índice

| Doc                                                                            | Contenido                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [00-caso-dorado-ag2025.md](00-caso-dorado-ag2025.md)               | Caso de prueba real (declaración AG2025 de Ana hecha con referencia): entradas, depuración completa y resultado esperado ($1.401.000 saldo a favor). Nuestra plataforma debe reproducirlo exactamente.                                                      |
| [01-normativa-renta-ag2025.md](01-normativa-renta-ag2025.md)                   | Toda la normativa AG2025: UVT $49.799, formulario 210, depuración art. 336, tabla art. 241, cesantías, anticipo, calendario 2026, constantes listas para el motor de cálculo.                                                                              |
| [02-exogena-documentos-presentacion.md](02-exogena-documentos-presentacion.md) | Exógena DIAN (formatos, topes, mapeo R## → casillas del 210), certificado 220, demás certificados, declaración sugerida, presentación en MUISCA (firma electrónica, 490, PSE). No existe API de la DIAN.                                                   |
| [03-aspectos-legales.md](03-aspectos-legales.md)                               | Legal: no se requiere contador para el segmento objetivo (art. 596-6 E.T.), Ley 1581/2012 y transferencia internacional de datos, T&C de referencia (garantía acotada, obligaciones de medio), credenciales MUISCA, regulación de IA (Circular SIC 002/2024). |
| [04-mercado-referencia-competidores.md](04-mercado-referencia-competidores.md)       | referencia (flujo, precios $170-550K, 300K declaraciones/año, YC, Bancolombia), competidores (Contadia, SaraDeclara $59.900, DIAN gratis), referentes IA (Intuit Assist, Taxfix, april, TaxGPT), oportunidades.                                               |
| [05-apis-ia-openai-compatibles.md](05-apis-ia-openai-compatibles.md)           | APIs de IA compatibles con OpenAI: Kimi/Moonshot, DeepSeek, Qwen, GLM, Gemini, OpenAI, Claude — precios, visión, structured output, privacidad (riesgo China vs. Ley 1581), arquitectura recomendada, costo ~US$0.10-0.70 por declaración.                 |
| [06-integracion-dian-referencia.md](06-integracion-dian-referencia.md)               | Cómo se conecta referencia/Contadia con la DIAN: no hay API oficial de renta PN; es RPA sobre MUISCA con credenciales del usuario, presentación por mandato (art. 572-1 E.T.), riesgos Ley 1273, recomendación (Opción A = carga manual, lo que ya hacemos).  |

## Conclusiones ejecutivas

1. **Legalmente viable sin contadores**: elaborar declaraciones no es actividad reservada; el contribuyente firma y presenta. Replicar arquitectura contractual de referencia (obligación de medio + garantía acotada a error de cálculo del software).
2. **El cálculo debe ser 100% determinista** (motor de reglas con las constantes del doc 01, validado contra el caso dorado); el LLM solo extrae documentos, entrevista y explica. Esto además hace defendible la garantía.
3. **MVP sin credenciales DIAN**: el usuario descarga y sube su exógena (Excel) y certificados (PDF). La "conexión DIAN" tipo referencia es factible pero es el mayor riesgo técnico-legal — fase 2.
4. **No existe API DIAN para presentar**: el producto entrega el 210 diligenciado + guía casilla por casilla para transcribir en MUISCA (igual que referencia).
5. **Privacidad manda en la elección del modelo de IA**: para documentos reales evitar APIs directas chinas (Kimi/DeepSeek) — usar proveedor en EE. UU./UE o modelos abiertos vía OpenRouter-ZDR/Groq; contrato de transmisión + autorización Ley 1581; estudio de impacto de privacidad (Circular SIC 002/2024).
6. **Diferenciación ganadora**: cálculo gratis y pago al final (Taxfix), extracción automática de PDFs con IA (nadie lo hace consumer en Colombia), precio agresivo (~$60-100K vs $170K de referencia), entrega inmediata sin sobreprecio, garantía visible.
7. **Timing**: la temporada AG2025 va del 12-ago al 26-oct-2026 — el caso dorado es de esta temporada, ideal para validar ya el motor.

## Pendientes de verificación

- Decreto definitivo del componente inflacionario AG2025 (55,43% está en proyecto de decreto; coincide con certificado del banco).
- Descargar el PDF oficial del formulario 210 + instructivo desde dian.gov.co para la numeración exacta de casillas.
- Reglas finas observadas en el caso dorado: prorrateo de dependientes por meses trabajados (referencia usó 11 meses), anticipo con promedio y 75%, tratamiento del segundo certificado de Salud Prepagada.
