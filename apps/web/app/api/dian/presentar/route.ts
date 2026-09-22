import { mensajeDeFallo } from '@turenta/core';
import { NextResponse } from 'next/server';

import { accesoDe } from '@/server/dian/acceso-guardado';
import { casillasGuardadas, datosDelFormulario, presentarEnLaDian } from '@/server/dian/diligenciar';
import { huellaDe, leerCuerpo, titularDelCuerpo, validarSolicitud } from '@/server/dian/peticion';
import { registrarBorradorDian, registrarPresentacion } from '@/server/dian/presentacion-guardada';
import { verificarTitularidad } from '@/server/dian/titularidad';
import { responderEnFlujo } from '@/server/flujo-ndjson';
import { leerSesion } from '@/server/sesion';

import type { Emitir } from '@/server/flujo-ndjson';
import type { DatosPresentacion, HuellaPeticion, ResultadoPresentacion, SolicitudConexionDian } from '@turenta/core';

/** Llenar, verificar, firmar, presentar y traer el acuse: minutos, no segundos. */
export const maxDuration = 600;

const CODIGO_FIRMA = /^[A-Za-z0-9-]{4,20}$/;

/**
 * FIRMA Y PRESENTA la declaración ante la DIAN. Es irreversible: exige el
 * alcance `presentar_declaracion` aceptado explícitamente por el titular.
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
  const operador = { usuarioId: sesion.usuarioId, huella: huellaDe(request) };
  return responderEnFlujo((emitir) => presentar(solicitud, preparado.datos, operador, emitir), olvidar);
}

async function preparar(
  solicitud: SolicitudConexionDian,
  cuerpo: Record<string, unknown>,
  usuarioId: string,
): Promise<{ datos: DatosPresentacion } | { rechazo: NextResponse }> {
  if (!solicitud.alcancesAceptados.includes('presentar_declaracion')) {
    return { rechazo: respuesta({ mensaje: 'Falta tu autorización para firmar y presentar' }, 400) };
  }
  const ajena = await verificarTitularidad(usuarioId, solicitud);
  const formulario = datosDelFormulario(cuerpo);
  if (ajena !== null || formulario === null) {
    return { rechazo: respuesta({ mensaje: ajena ?? 'Indica el género y la actividad económica del RUT' }, ajena ? 403 : 400) };
  }
  const guardadas = await casillasGuardadas(usuarioId, solicitud.titular, solicitud.anioGravable);
  if ('error' in guardadas) {
    return { rechazo: respuesta({ mensaje: guardadas.error }, 409) };
  }
  const codigo = String(cuerpo['codigoFirma'] ?? '');
  const codigoFirma = CODIGO_FIRMA.test(codigo) ? { codigoFirma: codigo } : {};
  const borrador = guardadas.numeroFormulario ? { numeroFormulario: guardadas.numeroFormulario } : {};
  return { datos: { ...formulario, ...codigoFirma, ...borrador, casillas: guardadas.casillas } };
}

async function presentar(
  solicitud: SolicitudConexionDian,
  datos: DatosPresentacion,
  operador: { usuarioId: string; huella: HuellaPeticion },
  emitir: Emitir,
): Promise<Record<string, unknown>> {
  const alProgresar = (progreso: unknown) => emitir({ progreso });
  const { resultado, esperarSegundos } = await presentarEnLaDian(solicitud, datos, { ...operador, alProgresar });
  if (esperarSegundos !== null) {
    return { ok: false, mensaje: 'Demasiados intentos; espera un momento.' };
  }
  await recordarBorrador(resultado, solicitud, operador.usuarioId);
  if (resultado.presentada === true) {
    await guardar(resultado, solicitud, operador.usuarioId);
  }
  return aFin(resultado);
}

/** Saber el número del borrador ahorra navegar el portal en el siguiente intento. */
function recordarBorrador(resultado: ResultadoPresentacion, solicitud: SolicitudConexionDian, usuarioId: string): Promise<void> {
  const numero = resultado.numeroFormulario ?? '';
  if (numero === '') {
    return Promise.resolve();
  }
  return registrarBorradorDian(usuarioId, solicitud.titular, solicitud.anioGravable, numero).catch(() => undefined);
}

function guardar(resultado: ResultadoPresentacion, solicitud: SolicitudConexionDian, usuarioId: string): Promise<void> {
  const presentacion = {
    numeroFormulario: resultado.numeroFormulario ?? '',
    presentadaEn: resultado.presentadaEn ?? new Date().toISOString(),
    nombreAcuse: resultado.acuse?.nombreArchivo ?? '',
  };
  return registrarPresentacion(usuarioId, solicitud.titular, solicitud.anioGravable, presentacion).catch(() => undefined);
}

function aFin(resultado: ResultadoPresentacion): Record<string, unknown> {
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
    firmada: resultado.firmada === true,
    presentada: resultado.presentada === true,
    requiereCodigo: resultado.requiereCodigo === true,
    acuse: resultado.acuse ?? null,
    presentadaEn: resultado.presentadaEn ?? null,
  };
}

function respuesta(cuerpo: Record<string, unknown>, estado = 200): NextResponse {
  const salida = NextResponse.json(cuerpo, { status: estado });
  salida.headers.set('Cache-Control', 'no-store');
  return salida;
}
