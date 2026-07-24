// Adaptadores de infraestructura (implementan puertos de @turenta/core).
// extraccion, persistencia y storage se implementan en Fase 2.
export { OpenAiCompatibleLlmAdapter, type LlmProviderConfig } from './llm/openai-compatible-llm-adapter';
export { crearLlmDesdeEnv } from './llm/crear-llm';
