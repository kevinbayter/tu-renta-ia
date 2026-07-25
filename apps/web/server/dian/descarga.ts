import {
  crearAutorizacion,
  permiteAlcance,
  serializarAutorizacion,
  textoAutorizacion,
} from '@turenta/core';

import { obtenerConexionDian, obtenerEvidenciaDian, obtenerLimitadorDian } from '@/server/composicion';

import type {
  AlcanceAutorizacion,
  HuellaPeticion,
  ResultadoDescarga,
  SolicitudConexionDian,
} from '@turenta/core';

/**
 * Shared use case for both DIAN routes: authorize with the right scope, leave
 * evidence, run the operation and close the record with what really happened.
 *
 * Evidence is written BEFORE touching the portal and the write is not allowed
 * to fail silently: no evidence, no connection (PLAN-DIAN §1.3).
 */

export type Operacion = 'exogena' | 'declaracion';

const ALCANCES: Record<Operacion, AlcanceAutorizacion> = {
  exogena: 'leer_exogena',
  declaracion: 'leer_declaraciones',
};

export interface ResultadoOperacion {
  resultado: ResultadoDescarga;
  /** null when the rate limiter refused before doing anything. */
  esperarSegundos: number | null;
}

function bloqueado(esperarSegundos: number): ResultadoOperacion {
  return {
    resultado: { exito: false, motivoFallo: 'servicio_no_disponible' },
    esperarSegundos,
  };
}

export async function descargarDeLaDian(
  operacion: Operacion,
  solicitud: SolicitudConexionDian,
  usuarioId: string,
  huella: HuellaPeticion,
): Promise<ResultadoOperacion> {
  const limitador = obtenerLimitadorDian();
  const clave = { usuarioId, numeroDocumento: solicitud.credenciales.numeroDocumento };
  const veredicto = limitador.consultar(clave);
  if (!veredicto.permitido) {
    return bloqueado(veredicto.esperarSegundos);
  }
  limitador.registrarIntento(clave);
  const resultado = await limitador.conPermiso(() =>
    ejecutarConEvidencia(operacion, solicitud, usuarioId, huella),
  );
  if (resultado.motivoFallo === 'credenciales_invalidas') {
    limitador.registrarFallo(clave);
  }
  return { resultado, esperarSegundos: null };
}

function autorizacionPara(operacion: Operacion, solicitud: SolicitudConexionDian, usuarioId: string) {
  const alcance = ALCANCES[operacion];
  return crearAutorizacion(
    {
      titularIdentificacion: solicitud.titular,
      operadorUsuarioId: usuarioId,
      alcances: [alcance],
      textoAceptado: serializarAutorizacion(textoAutorizacion(solicitud.titular, [alcance])),
    },
    new Date(),
  );
}

async function ejecutarConEvidencia(
  operacion: Operacion,
  solicitud: SolicitudConexionDian,
  usuarioId: string,
  huella: HuellaPeticion,
): Promise<ResultadoDescarga> {
  const autorizacion = autorizacionPara(operacion, solicitud, usuarioId);
  if (!permiteAlcance(autorizacion, ALCANCES[operacion], new Date())) {
    return { exito: false, motivoFallo: 'desconocido', detalle: 'La autorización no es válida' };
  }
  const evidencia = obtenerEvidenciaDian();
  const { id } = await evidencia.registrarAutorizacion(autorizacion, huella);
  const resultado = await ejecutar(operacion, solicitud, usuarioId);
  await evidencia.cerrarAutorizacion(id, desenlaceDe(resultado), new Date()).catch(() => null);
  return resultado;
}

function desenlaceDe(resultado: ResultadoDescarga) {
  if (resultado.exito) {
    return { resultado: 'exitosa' } as const;
  }
  // El detalle ya viene redactado; guardarlo es lo que permite diagnosticar
  // después sin pedirle al usuario que reproduzca el fallo.
  const motivo = resultado.motivoFallo ?? 'desconocido';
  return { resultado: 'fallida', motivoFallo: `${motivo}: ${resultado.detalle ?? ''}`.slice(0, 200) } as const;
}

function ejecutar(
  operacion: Operacion,
  solicitud: SolicitudConexionDian,
  usuarioId: string,
): Promise<ResultadoDescarga> {
  const conexion = obtenerConexionDian();
  const contexto = {
    titularIdentificacion: solicitud.titular,
    operadorUsuarioId: usuarioId,
    anioGravable: solicitud.anioGravable,
    modoIngreso: solicitud.modoIngreso,
  };
  return operacion === 'exogena'
    ? conexion.descargarExogena(solicitud.credenciales, contexto)
    : conexion.descargarDeclaracion(solicitud.credenciales, contexto);
}
