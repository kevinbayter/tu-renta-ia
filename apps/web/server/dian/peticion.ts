import { validarSolicitudConexion } from '@turenta/core';

import type { HuellaPeticion, ResultadoValidacion } from '@turenta/core';

/**
 * Reading and validating the HTTP request, shared by both DIAN routes.
 *
 * "A nombre de un tercero" is refused here while the portal's third-party form
 * is not mapped: better an honest "not available yet" than asking for a
 * password for a flow that cannot work.
 */

const ANIO_ACTUAL = new Date().getFullYear();

/** Cédula del titular tal como la validará después: para buscar su acceso. */
export function titularDelCuerpo(cuerpo: unknown): string {
  const datos = (cuerpo ?? {}) as { titular?: unknown; numeroDocumento?: unknown };
  const valor = datos.titular ?? datos.numeroDocumento ?? '';
  return typeof valor === 'string' || typeof valor === 'number' ? String(valor).replace(/\D/g, '') : '';
}

export async function leerCuerpo(request: Request): Promise<Record<string, unknown> | null> {
  const cuerpo = await request.json().catch(() => null);
  return cuerpo !== null && typeof cuerpo === 'object' ? (cuerpo as Record<string, unknown>) : null;
}

export function validarSolicitud(
  cuerpo: Record<string, unknown> | null,
  hayAccesoGuardado: boolean,
): ResultadoValidacion {
  if (cuerpo === null) {
    return { valida: false, error: 'Petición inválida' };
  }
  const validacion = validarSolicitudConexion(cuerpo, ANIO_ACTUAL, hayAccesoGuardado);
  if (validacion.valida && validacion.solicitud.modoIngreso === 'tercero') {
    return { valida: false, error: 'Todavía no podemos conectar a nombre de otra persona' };
  }
  return validacion;
}

/**
 * Real client IP. Behind Cloudflare, `cf-connecting-ip` is the trustworthy one:
 * the first entry of `x-forwarded-for` can be spoofed by the client.
 */
export function huellaDe(request: Request): HuellaPeticion {
  const cabeceras = request.headers;
  const reenviada = (cabeceras.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? '';
  return {
    ip: cabeceras.get('cf-connecting-ip') ?? reenviada,
    userAgent: (cabeceras.get('user-agent') ?? '').slice(0, 200),
  };
}
