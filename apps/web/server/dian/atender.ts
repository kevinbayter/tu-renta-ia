import { estadoDeFallo, mensajeDeFallo } from '@turenta/core';
import { NextResponse } from 'next/server';

import { descargarDeLaDian } from './descarga';
import { huellaDe, leerSolicitud } from './peticion';
import { leerSesion } from '@/server/sesion';

import type { Operacion } from './descarga';
import type { MotivoFalloDian, ResultadoDescarga, SolicitudConexionDian } from '@turenta/core';

/**
 * HTTP handler shared by both DIAN routes. Credentials arrive, get used and are
 * discarded within this single request: they are NEVER stored (PLAN-DIAN §1).
 */
export async function atenderDescarga(
  operacion: Operacion,
  request: Request,
): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return respuesta({ mensaje: 'Debes iniciar sesión' }, 401);
  }
  const validacion = await leerSolicitud(request);
  if (!validacion.valida) {
    return respuesta({ mensaje: validacion.error }, 400);
  }
  try {
    return await ejecutar(operacion, validacion.solicitud, sesion.usuarioId, request);
  } finally {
    validacion.solicitud.credenciales.contrasena.olvidar();
  }
}

async function ejecutar(
  operacion: Operacion,
  solicitud: SolicitudConexionDian,
  usuarioId: string,
  request: Request,
): Promise<NextResponse> {
  try {
    const { resultado, esperarSegundos } = await descargarDeLaDian(
      operacion,
      solicitud,
      usuarioId,
      huellaDe(request),
    );
    return esperarSegundos === null ? aRespuesta(resultado) : demasiadosIntentos(esperarSegundos);
  } catch {
    // Sin evidencia no se opera: hay que decirlo, no devolver un 500 opaco.
    return respuesta({ mensaje: MENSAJE_SIN_EVIDENCIA, motivoFallo: 'servicio_no_disponible' }, 503);
  }
}

const MENSAJE_SIN_EVIDENCIA =
  'No pudimos dejar constancia de tu autorización, así que no nos conectamos. Inténtalo en un momento.';

function aRespuesta(resultado: ResultadoDescarga): NextResponse {
  if (!resultado.exito || !resultado.contenido) {
    return respuesta(
      { mensaje: mensajeDeFallo(resultado.motivoFallo), motivoFallo: resultado.motivoFallo },
      estadoDeFallo(resultado.motivoFallo),
    );
  }
  return respuesta({
    nombreArchivo: resultado.nombreArchivo ?? 'descarga',
    contenidoBase64: Buffer.from(resultado.contenido).toString('base64'),
  });
}

function demasiadosIntentos(esperarSegundos: number): NextResponse {
  const motivo: MotivoFalloDian = 'servicio_no_disponible';
  const salida = respuesta(
    { mensaje: 'Demasiados intentos de conexión. Espera un momento antes de reintentar.', motivoFallo: motivo },
    429,
  );
  salida.headers.set('Retry-After', String(esperarSegundos));
  return salida;
}

/** Nothing here may be cached: these responses carry taxpayer data. */
function respuesta(cuerpo: Record<string, unknown>, estado = 200): NextResponse {
  const salida = NextResponse.json(cuerpo, { status: estado });
  salida.headers.set('Cache-Control', 'no-store');
  return salida;
}
