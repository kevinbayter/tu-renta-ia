import { crearLlmDesdeEnv, ExtractorCertificados } from '@turenta/adaptadores';

import type { LlmPort } from '@turenta/core';

/**
 * Composición hexagonal del lado servidor: único lugar de apps/web
 * que instancia adaptadores e inyecta puertos.
 */

let llmSingleton: LlmPort | undefined;
let extractorSingleton: ExtractorCertificados | undefined;

export function obtenerLlm(): LlmPort {
  llmSingleton ??= crearLlmDesdeEnv(process.env);
  return llmSingleton;
}

export function obtenerExtractor(): ExtractorCertificados {
  extractorSingleton ??= new ExtractorCertificados(obtenerLlm());
  return extractorSingleton;
}
