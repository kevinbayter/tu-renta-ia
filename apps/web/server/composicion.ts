import { crearEmailDesdeEnv, crearLlmDesdeEnv, ExtractorCertificados, RepositorioPrisma } from '@turenta/adaptadores';

import type { EmailPort, LlmPort, RepositorioPort } from '@turenta/core';

/**
 * Composición hexagonal del lado servidor: único lugar de apps/web
 * que instancia adaptadores e inyecta puertos.
 */

let llmSingleton: LlmPort | undefined;
let extractorSingleton: ExtractorCertificados | undefined;
let repositorioSingleton: RepositorioPort | undefined;
let emailSingleton: EmailPort | undefined;

export function obtenerLlm(): LlmPort {
  llmSingleton ??= crearLlmDesdeEnv(process.env);
  return llmSingleton;
}

export function obtenerExtractor(): ExtractorCertificados {
  extractorSingleton ??= new ExtractorCertificados(obtenerLlm());
  return extractorSingleton;
}

export function obtenerRepositorio(): RepositorioPort {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no configurada');
  }
  repositorioSingleton ??= new RepositorioPrisma(url);
  return repositorioSingleton;
}

export function obtenerEmail(): EmailPort {
  emailSingleton ??= crearEmailDesdeEnv(process.env);
  return emailSingleton;
}
