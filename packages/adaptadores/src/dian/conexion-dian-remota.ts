/**
 * Client for the isolated DIAN connection worker (PLAN-DIAN §2).
 *
 * Playwright runs in its own container, without `DATABASE_URL` or app secrets:
 * a compromise there does not drag the platform down. This adapter is all
 * apps/web needs, which is why it never imports Playwright.
 */

import type {
  ConexionDianPort,
  ContextoOperacionDian,
  CredencialesDian,
  ResultadoDescarga,
} from '@turenta/core';

const ESPERA_POR_DEFECTO_MS = 180_000;

export interface ConfigWorkerDian {
  url: string;
  token: string;
  tiempoMaximoMs?: number;
}

interface RespuestaWorker {
  exito?: boolean;
  contenidoBase64?: string;
  nombreArchivo?: string;
  motivoFallo?: ResultadoDescarga['motivoFallo'];
  detalle?: string;
}

export class ConexionDianRemota implements ConexionDianPort {
  constructor(private readonly config: ConfigWorkerDian) {}

  descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
  ): Promise<ResultadoDescarga> {
    return this.pedir('exogena', credenciales, contexto);
  }

  descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
  ): Promise<ResultadoDescarga> {
    return this.pedir('declaracion', credenciales, contexto);
  }

  private async pedir(
    operacion: 'exogena' | 'declaracion',
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
  ): Promise<ResultadoDescarga> {
    const respuesta = await fetch(`${this.config.url}/dian/${operacion}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.token}`,
      },
      body: cuerpoDe(credenciales, contexto),
      signal: AbortSignal.timeout(this.config.tiempoMaximoMs ?? ESPERA_POR_DEFECTO_MS),
    }).catch(() => null);
    return interpretar(respuesta);
  }
}

/**
 * Process boundary: a Secreto does not serialize itself (its `toJSON` returns
 * the redaction marker), so the value is taken deliberately here. It travels
 * over Docker's internal network to the worker, never over the Internet.
 */
function cuerpoDe(credenciales: CredencialesDian, contexto: ContextoOperacionDian): string {
  return JSON.stringify({
    tipoDocumento: credenciales.tipoDocumento,
    numeroDocumento: credenciales.numeroDocumento,
    contrasena: credenciales.contrasena.revelar(),
    contexto,
  });
}

async function interpretar(respuesta: Response | null): Promise<ResultadoDescarga> {
  if (!respuesta) {
    return noDisponible('El servicio de conexión no respondió');
  }
  if (respuesta.status === 429) {
    return noDisponible('Hay otra conexión en curso; inténtalo en un minuto');
  }
  const cuerpo = (await respuesta.json().catch(() => null)) as RespuestaWorker | null;
  if (!cuerpo) {
    return noDisponible(`El servicio de conexión respondió ${String(respuesta.status)}`);
  }
  return aResultado(cuerpo);
}

function aResultado(cuerpo: RespuestaWorker): ResultadoDescarga {
  if (cuerpo.exito !== true || !cuerpo.contenidoBase64) {
    return {
      exito: false,
      motivoFallo: cuerpo.motivoFallo ?? 'desconocido',
      detalle: cuerpo.detalle ?? '',
    };
  }
  return {
    exito: true,
    contenido: Uint8Array.from(Buffer.from(cuerpo.contenidoBase64, 'base64')),
    nombreArchivo: cuerpo.nombreArchivo ?? 'descarga',
  };
}

/** A dead worker is NOT 'portal_no_disponible': we do not blame DIAN for our outage. */
function noDisponible(detalle: string): ResultadoDescarga {
  return { exito: false, motivoFallo: 'servicio_no_disponible', detalle };
}
