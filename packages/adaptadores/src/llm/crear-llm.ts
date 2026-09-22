import type { LlmPort } from '@turenta/core';

import { OpenAiCompatibleLlmAdapter } from './openai-compatible-llm-adapter';

import type { FormatoJson, LlmProviderConfig } from './openai-compatible-llm-adapter';

/**
 * Factory: construye el LlmPort desde variables de entorno.
 * Cambiar de proveedor de IA = cambiar env vars, cero cambios de código:
 *   LLM_BASE_URL      → https://api.deepseek.com | https://opencode.ai/zen/go/v1 | https://openrouter.ai/api/v1 | ...
 *   LLM_MODEL         → deepseek-flash | kimi-k3 | gpt-5.4-mini | ...
 *   LLM_API_KEY       (OPENCODE_API_KEY se sigue aceptando como alias)
 *   LLM_FORMATO_JSON  → json_schema (defecto) | json_object (DeepSeek no soporta json_schema)
 */
export function crearLlmDesdeEnv(env: Record<string, string | undefined>): LlmPort {
  const config = leerConfig(env);
  return new OpenAiCompatibleLlmAdapter(config);
}

function leerConfig(env: Record<string, string | undefined>): LlmProviderConfig {
  const baseUrl = env['LLM_BASE_URL'];
  // `||` y no `??`: docker compose pasa las variables no definidas como cadena vacía.
  const apiKey = env['LLM_API_KEY'] || env['OPENCODE_API_KEY'];
  const modelo = env['LLM_MODEL'];
  if (!baseUrl || !apiKey || !modelo) {
    throw new Error('Config LLM incompleta: define LLM_BASE_URL, LLM_MODEL y LLM_API_KEY');
  }
  const esfuerzo = env['LLM_REASONING_EFFORT'];
  return {
    baseUrl,
    apiKey,
    modelo,
    formatoJson: leerFormatoJson(env['LLM_FORMATO_JSON']),
    ...(esfuerzo ? { parametrosExtra: { reasoning_effort: esfuerzo } } : {}),
  };
}

function leerFormatoJson(valor: string | undefined): FormatoJson {
  if (!valor || valor === 'json_schema') {
    return 'json_schema';
  }
  if (valor === 'json_object') {
    return 'json_object';
  }
  throw new Error(`LLM_FORMATO_JSON inválido: "${valor}" (usa json_schema o json_object)`);
}
