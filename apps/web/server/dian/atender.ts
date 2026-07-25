import { estadoDeFallo, mensajeDeFallo } from '@turenta/core';
import { NextResponse } from 'next/server';

import { descargarDeLaDian } from './descarga';
import { huellaDe, leerSolicitud } from './peticion';
import { leerSesion } from '@/server/sesion';

import type { Operacion } from './descarga';
import type { MotivoFalloDian, ResultadoDescarga } from '@turenta/core';

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
  const { solicitud } = validacion;
  try {
    const { resultado, esperarSegundos } = await descargarDeLaDian(
      operacion,
      solicitud,
      sesion.usuarioId,
      huellaDe(request),
    );
    return esperarSegundos === null ? aRespuesta(resultado) : demasiadosIntentos(esperarSegundos);
  } finally {
    solicitud.credenciales.contrasena.olvidar();
  }
}

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
