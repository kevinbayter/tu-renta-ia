/* eslint-disable no-console */
// Smoke test del LLM (OpenCode Go / Kimi K3): structured output con JSON Schema.
// Uso: pnpm smoke:llm  (lee .env.local vía --env-file)

const baseUrl = process.env.LLM_BASE_URL;
const apiKey = process.env.OPENCODE_API_KEY;
const modelo = process.env.LLM_MODEL;

if (!baseUrl || !apiKey || !modelo) {
  console.error('Faltan LLM_BASE_URL / OPENCODE_API_KEY / LLM_MODEL en .env.local');
  process.exit(1);
}

const schema = {
  type: 'object',
  properties: {
    nit: { type: 'string' },
    salarios: { type: 'number' },
    retencion: { type: 'number' },
  },
  required: ['nit', 'salarios', 'retencion'],
  additionalProperties: false,
};

const textoCertificado = `CERTIFICADO DE INGRESOS Y RETENCIONES AÑO GRAVABLE 2025
NIT del retenedor: 900333444 - SERVICIOS TELECOM S.A.S.
Pagos por salarios: 15.770.000
Valor de la retención en la fuente: 396.000`;

const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: modelo,
    messages: [
      {
        role: 'system',
        content:
          'Extraes datos de certificados tributarios colombianos. Montos como enteros COP sin puntos. Responde SOLO el JSON.',
      },
      { role: 'user', content: textoCertificado },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'cert', schema, strict: true } },
  }),
});

if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const contenido = JSON.parse(data.choices[0].message.content);
const esperado = { nit: '900333444', salarios: 15770000, retencion: 396000 };
const ok =
  contenido.nit === esperado.nit &&
  contenido.salarios === esperado.salarios &&
  contenido.retencion === esperado.retencion;

console.log('Modelo:', data.model);
console.log('Extraído:', contenido);
console.log('Usage:', JSON.stringify(data.usage));
console.log(ok ? '✅ SMOKE TEST OK' : '❌ SMOKE TEST FALLÓ: valores no coinciden');
process.exit(ok ? 0 : 1);
