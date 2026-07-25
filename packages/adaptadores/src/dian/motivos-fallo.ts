/** Portal error classification. Lives outside the adapter to be testable without a browser. */

import { detalleSeguro } from '@turenta/core';
import type { MotivoFalloDian, ResultadoDescarga } from '@turenta/core';

export function fallo(motivo: MotivoFalloDian, detalle: string): ResultadoDescarga {
  return { exito: false, motivoFallo: motivo, detalle };
}

export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export function nombreDe(error: unknown): string {
  return error instanceof Error ? error.name : 'Error';
}

export function clasificarError(error: unknown): MotivoFalloDian {
  const mensaje = mensajeDe(error).toLowerCase();
  if (mensaje.includes('timeout')) {
    return 'tiempo_agotado';
  }
  if (mensaje.includes('net::') || mensaje.includes('econnrefused')) {
    return 'portal_no_disponible';
  }
  return 'desconocido';
}

/**
 * Publishable detail of a browser error. Playwright attaches a "Call log" with
 * the portal's DOM dump (taxpayer data) and may echo the password: both go.
 */
export function detalleDeError(error: unknown, secretos: string[] = []): string {
  return detalleSeguro(nombreDe(error), mensajeDe(error), secretos);
}
