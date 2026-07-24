import type { LlmPort } from '@turenta/core';

import { OpenAiCompatibleLlmAdapter } from './openai-compatible-llm-adapter';

import type { LlmProviderConfig } from './openai-compatible-llm-adapter';

/**
 * Factory: construye el LlmPort desde variables de entorno.
 * Cambiar de proveedor de IA = cambiar env vars, cero cambios de código:
 *   LLM_BASE_URL  → https://opencode.ai/zen/go/v1 | https://openrouter.ai/api/v1 | https://api.moonshot.ai/v1 | ...
 *   LLM_MODEL     → kimi-k3 | kimi-k2.6 | gpt-5.4-mini | ...
 *   OPENCODE_API_KEY (o LLM_API_KEY como genérica)
 */
export function crearLlmDesdeEnv(env: Record<string, string | undefined>): LlmPort {
  const config = leerConfig(env);
  return new OpenAiCompatibleLlmAdapter(config);
}

function leerConfig(env: Record<string, string | undefined>): LlmProviderConfig {
  const baseUrl = env['LLM_BASE_URL'];
  const apiKey = env['LLM_API_KEY'] ?? env['OPENCODE_API_KEY'];
  const modelo = env['LLM_MODEL'];
  if (!baseUrl || !apiKey || !modelo) {
    throw new Error('Config LLM incompleta: define LLM_BASE_URL, LLM_MODEL y LLM_API_KEY/OPENCODE_API_KEY');
  }
  const esfuerzo = env['LLM_REASONING_EFFORT'];
  return {
    baseUrl,
    apiKey,
    modelo,
    ...(esfuerzo ? { parametrosExtra: { reasoning_effort: esfuerzo } } : {}),
  };
}
