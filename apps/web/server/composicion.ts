import {
  crearConexionDianDesdeEnv,
  crearEmailDesdeEnv,
  crearLlmDesdeEnv,
  EvidenciaAutorizacionPrisma,
  ExtractorCertificados,
  LimitadorDian,
  RepositorioPrisma,
} from '@turenta/adaptadores';

import type {
  ConexionDianPort,
  EmailPort,
  EvidenciaAutorizacionPort,
  LlmPort,
  RepositorioPort,
} from '@turenta/core';

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

let conexionDian: ConexionDianPort | undefined;
let evidenciaDian: EvidenciaAutorizacionPort | undefined;
let limitadorDian: LimitadorDian | undefined;

/**
 * Conexión con el MUISCA a través del worker aislado. Si no está configurado,
 * la fábrica devuelve una conexión que informa 'servicio_no_disponible' y la
 * vía manual sigue disponible (PLAN-DIAN §1.4).
 */
export function obtenerConexionDian(): ConexionDianPort {
  conexionDian ??= crearConexionDianDesdeEnv(process.env);
  return conexionDian;
}

export function obtenerEvidenciaDian(): EvidenciaAutorizacionPort {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no configurada');
  }
  evidenciaDian ??= EvidenciaAutorizacionPrisma.desdeUrl(url);
  return evidenciaDian;
}

export function obtenerLimitadorDian(): LimitadorDian {
  limitadorDian ??= new LimitadorDian();
  return limitadorDian;
}
