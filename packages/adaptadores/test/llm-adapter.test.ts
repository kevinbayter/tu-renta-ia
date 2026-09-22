import { afterEach, describe, expect, it, vi } from 'vitest';

import { crearLlmDesdeEnv } from '../src/llm/crear-llm';
import { OpenAiCompatibleLlmAdapter } from '../src/llm/openai-compatible-llm-adapter';

const SCHEMA = {
  type: 'object',
  properties: { salarios: { type: 'number' } },
  required: ['salarios'],
  additionalProperties: false,
};

const CONFIG = { baseUrl: 'https://api.deepseek.com', apiKey: 'sk-prueba', modelo: 'deepseek-flash' };

function respuestaLlm(contenido: string | null): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: contenido } }] }), { status: 200 });
}

function simularFetch(...respuestas: Response[]) {
  const fetchFalso = vi.fn<typeof fetch>();
  for (const respuesta of respuestas) {
    fetchFalso.mockResolvedValueOnce(respuesta);
  }
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

function cuerpoEnviado(fetchFalso: ReturnType<typeof simularFetch>, llamada = 0): Record<string, unknown> {
  const init = fetchFalso.mock.calls[llamada]?.[1];
  return JSON.parse(init?.body as string) as Record<string, unknown>;
}

function extraer(adaptador: OpenAiCompatibleLlmAdapter): Promise<unknown> {
  return adaptador.extraerEstructurado({
    system: 'Extrae el certificado.',
    user: 'Salarios 15.770.000',
    jsonSchema: SCHEMA,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('adaptador LLM compatible OpenAI', () => {
  it('por defecto pide structured output estricto con json_schema', async () => {
    const fetchFalso = simularFetch(respuestaLlm('{"salarios":15770000}'));
    await extraer(new OpenAiCompatibleLlmAdapter(CONFIG));
    expect(cuerpoEnviado(fetchFalso)['response_format']).toMatchObject({ type: 'json_schema' });
  });

  it('en modo json_object (DeepSeek) lleva el schema al prompt de sistema', async () => {
    const fetchFalso = simularFetch(respuestaLlm('{"salarios":15770000}'));
    const datos = await extraer(new OpenAiCompatibleLlmAdapter({ ...CONFIG, formatoJson: 'json_object' }));
    const cuerpo = cuerpoEnviado(fetchFalso);
    const [system, user] = cuerpo['messages'] as { role: string; content: string }[];
    expect(datos).toEqual({ salarios: 15_770_000 });
    expect(cuerpo['response_format']).toEqual({ type: 'json_object' });
    expect(system?.content).toContain('Extrae el certificado.');
    expect(system?.content).toContain('JSON');
    expect(system?.content).toContain(JSON.stringify(SCHEMA));
    expect(user?.content).toBe('Salarios 15.770.000');
  });

  it('la conversación libre no fuerza formato JSON', async () => {
    const fetchFalso = simularFetch(respuestaLlm('Hola'));
    const adaptador = new OpenAiCompatibleLlmAdapter({ ...CONFIG, formatoJson: 'json_object' });
    await adaptador.conversar({ system: 'Asistente', mensajes: [{ rol: 'user', contenido: 'hola' }] });
    expect(cuerpoEnviado(fetchFalso)).not.toHaveProperty('response_format');
  });

  it('reintenta cuando el proveedor devuelve contenido vacío', async () => {
    vi.useFakeTimers();
    const fetchFalso = simularFetch(respuestaLlm(''), respuestaLlm('{"salarios":1}'));
    const promesa = extraer(new OpenAiCompatibleLlmAdapter({ ...CONFIG, formatoJson: 'json_object' }));
    await vi.runAllTimersAsync();
    await expect(promesa).resolves.toEqual({ salarios: 1 });
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it('no reintenta errores de petición (400)', async () => {
    const fetchFalso = simularFetch(new Response('response_format no soportado', { status: 400 }));
    await expect(extraer(new OpenAiCompatibleLlmAdapter(CONFIG))).rejects.toThrow('LLM error 400');
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });
});

describe('factory del LLM desde variables de entorno', () => {
  const ENV_DEEPSEEK = {
    LLM_BASE_URL: 'https://api.deepseek.com',
    LLM_MODEL: 'deepseek-flash',
    LLM_API_KEY: 'sk-deepseek',
    LLM_FORMATO_JSON: 'json_object',
  };

  it('configura DeepSeek con json_object', async () => {
    const fetchFalso = simularFetch(respuestaLlm('{"salarios":1}'));
    await crearLlmDesdeEnv(ENV_DEEPSEEK).extraerEstructurado({ system: 's', user: 'u', jsonSchema: SCHEMA });
    const [url, init] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer sk-deepseek');
    expect(cuerpoEnviado(fetchFalso)).toMatchObject({
      model: 'deepseek-flash',
      response_format: { type: 'json_object' },
    });
  });

  it('acepta OPENCODE_API_KEY cuando LLM_API_KEY llega vacía desde docker compose', () => {
    expect(() =>
      crearLlmDesdeEnv({ ...ENV_DEEPSEEK, LLM_API_KEY: '', OPENCODE_API_KEY: 'sk-alias' }),
    ).not.toThrow();
  });

  it('rechaza un formato JSON desconocido', () => {
    expect(() => crearLlmDesdeEnv({ ...ENV_DEEPSEEK, LLM_FORMATO_JSON: 'xml' })).toThrow(
      'LLM_FORMATO_JSON inválido',
    );
  });
});
