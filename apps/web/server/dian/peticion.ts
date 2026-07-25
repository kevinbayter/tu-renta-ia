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

export async function leerSolicitud(request: Request): Promise<ResultadoValidacion> {
  const cuerpo = await request.json().catch(() => null);
  if (cuerpo === null || typeof cuerpo !== 'object') {
    return { valida: false, error: 'Petición inválida' };
  }
  const validacion = validarSolicitudConexion(cuerpo as Record<string, unknown>, ANIO_ACTUAL);
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
