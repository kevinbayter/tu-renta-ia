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
  DatosDiligenciamiento,
  DatosPresentacion,
  ProgresoConexion,
  ResultadoDescarga,
  ResultadoDiligenciamiento,
  ResultadoPresentacion,
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
  cifrado?: ResultadoDescarga['cifrado'];
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

  async diligenciarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosDiligenciamiento,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDiligenciamiento> {
    const respuesta = await this.enviar('diligenciar', cuerpoDe(credenciales, contexto, datos), ESPERA_DILIGENCIAR_MS);
    return interpretarDiligenciamiento(respuesta, alProgresar ?? (() => undefined));
  }

  async presentarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosPresentacion,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoPresentacion> {
    const respuesta = await this.enviar('presentar', cuerpoDe(credenciales, contexto, datos), ESPERA_DILIGENCIAR_MS);
    return interpretarDiligenciamiento(respuesta, alProgresar ?? (() => undefined));
  }

  private async pedir(
    operacion: 'exogena' | 'declaracion',
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
  ): Promise<ResultadoDescarga> {
    return interpretar(await this.enviar(operacion, cuerpoDe(credenciales, contexto)));
  }

  private enviar(operacion: string, cuerpo: string, tiempoMs?: number): Promise<Response | null> {
    return fetch(`${this.config.url}/dian/${operacion}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.token}`,
      },
      body: cuerpo,
      signal: AbortSignal.timeout(tiempoMs ?? this.config.tiempoMaximoMs ?? ESPERA_POR_DEFECTO_MS),
    }).catch(() => null);
  }
}

/** Fifteen sections typed one by one against a slow portal: several minutes is normal. */
const ESPERA_DILIGENCIAR_MS = 480_000;

/** The worker streams NDJSON: progress lines and, last, the result. A plain JSON body is an early refusal. */
async function interpretarDiligenciamiento<T extends ResultadoDiligenciamiento>(
  respuesta: Response | null,
  alProgresar: (progreso: ProgresoConexion) => void,
): Promise<T> {
  if (!respuesta?.body) {
    return noDisponible('El servicio de conexión no respondió') as T;
  }
  if (!(respuesta.headers.get('content-type') ?? '').includes('ndjson')) {
    return ((await respuesta.json().catch(() => null)) as T | null) ?? (noDisponible(`El servicio de conexión respondió ${String(respuesta.status)}`) as T);
  }
  let resultado: T | null = null;
  const alLinea = (linea: string) => {
    const mensaje = JSON.parse(linea) as { progreso?: ProgresoConexion; resultado?: T };
    if (mensaje.progreso) {
      alProgresar(mensaje.progreso);
    }
    resultado = mensaje.resultado ?? resultado;
  };
  const completo = await leerLineas(respuesta.body.getReader(), alLinea, new TextDecoder()).then(() => true, () => false);
  return (completo ? resultado : null) ?? (noDisponible('La conexión con el servicio se cortó') as T);
}

/** One decoder per stream: it keeps half-received multi-byte characters between chunks. */
async function leerLineas(
  lector: ReadableStreamDefaultReader<Uint8Array>,
  alLinea: (linea: string) => void,
  decodificador: TextDecoder,
  pendiente = '',
): Promise<void> {
  const { done, value } = await lector.read();
  const lineas = (pendiente + (value ? decodificador.decode(value, { stream: true }) : '')).split('\n');
  const resto = done ? '' : (lineas.pop() ?? '');
  lineas.filter((l) => l.trim() !== '').forEach(alLinea);
  return done ? undefined : leerLineas(lector, alLinea, decodificador, resto);
}

/**
 * Process boundary: a Secreto does not serialize itself (its `toJSON` returns
 * the redaction marker), so the value is taken deliberately here. It travels
 * over Docker's internal network to the worker, never over the Internet.
 */
function cuerpoDe(
  credenciales: CredencialesDian,
  contexto: ContextoOperacionDian,
  datos?: DatosDiligenciamiento | DatosPresentacion,
): string {
  return JSON.stringify({
    tipoDocumento: credenciales.tipoDocumento,
    numeroDocumento: credenciales.numeroDocumento,
    contrasena: credenciales.contrasena.revelar(),
    contexto,
    ...(datos ? { datos } : {}),
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
  const base: ResultadoDescarga = {
    exito: true,
    contenido: Uint8Array.from(Buffer.from(cuerpo.contenidoBase64, 'base64')),
    nombreArchivo: cuerpo.nombreArchivo ?? 'descarga',
  };
  // The envelope travels straight through: this side has no key to open it.
  return cuerpo.cifrado ? { ...base, cifrado: cuerpo.cifrado } : base;
}

/** A dead worker is NOT 'portal_no_disponible': we do not blame DIAN for our outage. */
function noDisponible(detalle: string): ResultadoDescarga {
  return { exito: false, motivoFallo: 'servicio_no_disponible', detalle };
}
