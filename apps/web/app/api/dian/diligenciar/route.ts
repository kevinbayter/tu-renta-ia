import { mensajeDeFallo } from '@turenta/core';
import { NextResponse } from 'next/server';

import { accesoDe } from '@/server/dian/acceso-guardado';
import { casillasGuardadas, datosDelFormulario, diligenciarEnLaDian } from '@/server/dian/diligenciar';
import { huellaDe, leerCuerpo, titularDelCuerpo, validarSolicitud } from '@/server/dian/peticion';
import { verificarTitularidad } from '@/server/dian/titularidad';
import { responderEnFlujo } from '@/server/flujo-ndjson';
import { leerSesion } from '@/server/sesion';

import type { Emitir } from '@/server/flujo-ndjson';
import type {
  DatosDiligenciamiento,
  HuellaPeticion,
  ResultadoDiligenciamiento,
  SolicitudConexionDian,
} from '@turenta/core';

/** Fifteen sections typed one by one against the portal. */
export const maxDuration = 600;

/**
 * Fills the return in MUISCA as a DRAFT and checks the portal agrees. Never
 * signs nor files. Refusals answer as plain JSON; once the robot starts, the
 * answer is an NDJSON stream of progress lines closed by `{ fin }`.
 */
export async function POST(request: Request): Promise<Response> {
  const sesion = await leerSesion();
  if (!sesion) {
    return respuesta({ mensaje: 'Debes iniciar sesión' }, 401);
  }
  const cuerpo = (await leerCuerpo(request)) ?? {};
  const acceso = await accesoDe(sesion.usuarioId, titularDelCuerpo(cuerpo));
  const validacion = validarSolicitud(cuerpo, acceso.cifrado !== undefined);
  if (!validacion.valida) {
    return respuesta({ mensaje: validacion.error }, 400);
  }
  const { solicitud } = validacion;
  const olvidar = () => solicitud.credenciales.contrasena.olvidar();
  const preparado = await preparar(solicitud, cuerpo, sesion.usuarioId).catch(() => null);
  if (!preparado || 'rechazo' in preparado) {
    olvidar();
    return preparado ? preparado.rechazo : respuesta({ mensaje: 'No pudimos preparar la declaración.' }, 500);
  }
  const huella = huellaDe(request);
  // The password must outlive this handler: it is forgotten when the stream ends.
  return responderEnFlujo(async (emitir) => aFin(await diligenciar(solicitud, preparado.datos, sesion.usuarioId, huella, emitir)), olvidar);
}

async function preparar(
  solicitud: SolicitudConexionDian,
  cuerpo: Record<string, unknown>,
  usuarioId: string,
): Promise<{ datos: DatosDiligenciamiento } | { rechazo: NextResponse }> {
  const ajena = await verificarTitularidad(usuarioId, solicitud);
  const formulario = datosDelFormulario(cuerpo);
  if (ajena !== null || formulario === null) {
    return { rechazo: respuesta({ mensaje: ajena ?? 'Indica el género y la actividad económica del RUT' }, ajena ? 403 : 400) };
  }
  const guardadas = await casillasGuardadas(usuarioId, solicitud.titular, solicitud.anioGravable);
  if ('error' in guardadas) {
    return { rechazo: respuesta({ mensaje: guardadas.error }, 409) };
  }
  return { datos: { ...formulario, casillas: guardadas.casillas } };
}

async function diligenciar(
  solicitud: SolicitudConexionDian,
  datos: DatosDiligenciamiento,
  usuarioId: string,
  huella: HuellaPeticion,
  emitir: Emitir,
): Promise<ResultadoDiligenciamiento | null> {
  const alProgresar = (progreso: unknown) => emitir({ progreso });
  const { resultado, esperarSegundos } = await diligenciarEnLaDian(solicitud, datos, { usuarioId, huella, alProgresar });
  return esperarSegundos === null ? resultado : null;
}

function aFin(resultado: ResultadoDiligenciamiento | null): Record<string, unknown> {
  if (!resultado) {
    return { ok: false, mensaje: 'Demasiados intentos; espera un momento.' };
  }
  const detalle = process.env.NODE_ENV === 'production' ? {} : { detalle: resultado.detalle };
  if (!resultado.exito) {
    return { ok: false, mensaje: mensajeDeFallo(resultado.motivoFallo), motivoFallo: resultado.motivoFallo, ...detalle };
  }
  return {
    ...detalle,
    ok: true,
    numeroFormulario: resultado.numeroFormulario,
    diferencias: resultado.diferencias ?? [],
    guardado: resultado.guardado === true,
    mapaFirma: resultado.mapaFirma ?? null,
  };
}

function respuesta(cuerpo: Record<string, unknown>, estado = 200): NextResponse {
  const salida = NextResponse.json(cuerpo, { status: estado });
  salida.headers.set('Cache-Control', 'no-store');
  return salida;
}
