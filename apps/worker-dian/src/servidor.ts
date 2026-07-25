/**
 * Isolated DIAN connection worker (PLAN-DIAN §2).
 *
 * Runs in its own container, WITHOUT `DATABASE_URL` or app secrets: it is the
 * only process that runs Chromium and sees credentials, so a compromise here
 * does not drag the platform down.
 *
 * No port is published outwards: only apps/web reaches it, over Docker's
 * internal network and with a shared token.
 */

import { createServer } from 'node:http';

import {
  cifrarCredencial,
  descifrarCredencial,
  leerClaveMaestra,
} from '@turenta/adaptadores/cifrado';
import { ConexionMuisca } from '@turenta/adaptadores/dian';
import { Secreto, detalleSeguro } from '@turenta/core';
import type { ContextoOperacionDian, ResultadoDescarga } from '@turenta/core';

import type { IncomingMessage, ServerResponse } from 'node:http';

const PUERTO = Number(process.env['PORT'] ?? 8080);
const TOKEN = process.env['WORKER_DIAN_TOKEN'] ?? '';
/** Each connection is a Chromium: more than two at once is a visible spike. */
const MAXIMO_CONCURRENTES = Number(process.env['WORKER_DIAN_CONCURRENCIA'] ?? 2);

/** Without `MUISCA_URL_BASE` it targets the live portal; tests point it elsewhere. */
const urlMuisca = process.env['MUISCA_URL_BASE'];
const conexion = new ConexionMuisca(urlMuisca ? { urlBase: urlMuisca } : {});
let enCurso = 0;

interface CuerpoPeticion {
  tipoDocumento?: string;
  numeroDocumento?: string;
  contrasena?: string;
  contexto?: ContextoOperacionDian;
}

function responder(respuesta: ServerResponse, estado: number, cuerpo: unknown): void {
  respuesta.writeHead(estado, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  respuesta.end(JSON.stringify(cuerpo));
}

function leerCuerpo(peticion: IncomingMessage): Promise<string> {
  return new Promise((listo, fallar) => {
    let datos = '';
    peticion.on('data', (trozo) => {
      datos += String(trozo);
      // Nothing legitimate exceeds 1 KB here.
      if (datos.length > 4096) {
        fallar(new Error('cuerpo demasiado grande'));
      }
    });
    peticion.on('end', () => listo(datos));
    peticion.on('error', fallar);
  });
}

function autorizado(peticion: IncomingMessage): boolean {
  return TOKEN !== '' && peticion.headers.authorization === `Bearer ${TOKEN}`;
}

function aRespuesta(resultado: ResultadoDescarga): Record<string, unknown> {
  if (!resultado.exito || !resultado.contenido) {
    return { exito: false, motivoFallo: resultado.motivoFallo, detalle: resultado.detalle };
  }
  return {
    exito: true,
    nombreArchivo: resultado.nombreArchivo,
    contenidoBase64: Buffer.from(resultado.contenido).toString('base64'),
    cifrado: resultado.cifrado,
  };
}

/** The master key never leaves this process, and the database is unreachable from here. */
const CLAVE_MAESTRA = leerClaveMaestra(process.env);

/**
 * The password comes either in the clear (the user just typed it) or sealed in
 * an envelope this worker sealed earlier. The web app only ever moves the
 * envelope around: it cannot open it.
 */
function contrasenaDe(cuerpo: CuerpoPeticion, contexto: ContextoOperacionDian): string | null {
  if (!contexto.cifrado) {
    return cuerpo.contrasena ?? '';
  }
  if (!CLAVE_MAESTRA) {
    return null;
  }
  return descifrarCredencial(contexto.cifrado, CLAVE_MAESTRA);
}

async function ejecutar(operacion: string, cuerpo: CuerpoPeticion): Promise<ResultadoDescarga> {
  const contexto = cuerpo.contexto as ContextoOperacionDian;
  const clara = contrasenaDe(cuerpo, contexto);
  if (clara === null) {
    return { exito: false, motivoFallo: 'acceso_caducado', detalle: 'El acceso guardado no se pudo abrir' };
  }
  const contrasena = new Secreto(clara);
  const credenciales = {
    tipoDocumento: (cuerpo.tipoDocumento ?? 'CC') as 'CC',
    numeroDocumento: cuerpo.numeroDocumento ?? '',
    contrasena,
  };
  try {
    const resultado = await operar(operacion, credenciales, contexto);
    return conSobre(resultado, contexto, clara);
  } finally {
    // The credential dies with the request.
    contrasena.olvidar();
  }
}

function operar(
  operacion: string,
  credenciales: Parameters<typeof conexion.descargarExogena>[0],
  contexto: ContextoOperacionDian,
): Promise<ResultadoDescarga> {
  return operacion === 'exogena'
    ? conexion.descargarExogena(credenciales, contexto)
    : conexion.descargarDeclaracion(credenciales, contexto);
}

/** Seals the access only when it worked and the user actually asked for it. */
function conSobre(
  resultado: ResultadoDescarga,
  contexto: ContextoOperacionDian,
  clara: string,
): ResultadoDescarga {
  const debeGuardar = resultado.exito && contexto.recordarAcceso === true && !contexto.cifrado;
  if (!debeGuardar || !CLAVE_MAESTRA) {
    return resultado;
  }
  return { ...resultado, cifrado: cifrarCredencial(clara, CLAVE_MAESTRA) };
}

async function atenderOperacion(
  operacion: string,
  peticion: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  if (enCurso >= MAXIMO_CONCURRENTES) {
    return responder(respuesta, 429, { exito: false, motivoFallo: 'servicio_no_disponible' });
  }
  enCurso += 1;
  try {
    const cuerpo = JSON.parse(await leerCuerpo(peticion)) as CuerpoPeticion;
    responder(respuesta, 200, aRespuesta(await ejecutar(operacion, cuerpo)));
  } catch (error) {
    // No raw error leaves this process: it could carry the portal's dump.
    const detalle = detalleSeguro('Error', error instanceof Error ? error.message : '', []);
    responder(respuesta, 200, { exito: false, motivoFallo: 'desconocido', detalle });
  } finally {
    enCurso -= 1;
  }
}

function enrutar(peticion: IncomingMessage, respuesta: ServerResponse): void {
  const ruta = (peticion.url ?? '').split('?')[0] ?? '';
  if (ruta === '/salud') {
    return responder(respuesta, 200, { estado: 'ok', enCurso });
  }
  if (!autorizado(peticion)) {
    return responder(respuesta, 401, { exito: false, motivoFallo: 'servicio_no_disponible' });
  }
  if (peticion.method === 'POST' && (ruta === '/dian/exogena' || ruta === '/dian/declaracion')) {
    return void atenderOperacion(ruta.split('/')[2] ?? '', peticion, respuesta);
  }
  return responder(respuesta, 404, { exito: false, motivoFallo: 'desconocido' });
}

export const servidor = createServer(enrutar);

function arrancar(): void {
  if (TOKEN === '') {
    throw new Error('WORKER_DIAN_TOKEN es obligatorio: sin token, cualquiera podría usar el worker');
  }
  servidor.listen(PUERTO);
}

/** Boot only when run directly: tests import the server instead. */
if (process.env['NODE_ENV'] !== 'test') {
  arrancar();
}
