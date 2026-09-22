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
import type {
  ContextoOperacionDian,
  SobreCifrado,
  DatosDiligenciamiento,
  DatosPresentacion,
  ProgresoConexion,
  ResultadoDescarga,
  ResultadoDiligenciamiento,
  ResultadoPresentacion,
} from '@turenta/core';

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
  datos?: unknown;
}

function responder(respuesta: ServerResponse, estado: number, cuerpo: unknown): void {
  respuesta.writeHead(estado, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  respuesta.end(JSON.stringify(cuerpo));
}

/** Downloads carry only credentials (~1 KB); filling also carries the return's ~80 boxes. */
const LIMITE_CUERPO = { descarga: 4_096, diligenciar: 16_384 } as const;

/** The signing code travels with the figures: six to ten characters, nothing else. */
const CODIGO_FIRMA = /^[A-Za-z0-9-]{4,20}$/;

function leerCuerpo(peticion: IncomingMessage, limite: number = LIMITE_CUERPO.descarga): Promise<string> {
  return new Promise((listo, fallar) => {
    let datos = '';
    peticion.on('data', (trozo) => {
      datos += String(trozo);
      if (datos.length > limite) {
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

type Credenciales = Parameters<typeof conexion.descargarExogena>[0];

const ACCESO_CADUCADO = { exito: false, motivoFallo: 'acceso_caducado', detalle: 'El acceso guardado no se pudo abrir' } as const;

/** Opens the credential for one operation and destroys it afterwards, whatever happens. */
async function conCredenciales<T>(
  cuerpo: CuerpoPeticion,
  operacion: (credenciales: Credenciales, contexto: ContextoOperacionDian, clara: string) => Promise<T>,
): Promise<T | typeof ACCESO_CADUCADO> {
  const contexto = cuerpo.contexto as ContextoOperacionDian;
  const clara = contrasenaDe(cuerpo, contexto);
  if (clara === null) {
    return ACCESO_CADUCADO;
  }
  const contrasena = new Secreto(clara);
  const credenciales = { tipoDocumento: (cuerpo.tipoDocumento ?? 'CC') as 'CC', numeroDocumento: cuerpo.numeroDocumento ?? '', contrasena };
  try {
    return await operacion(credenciales, contexto, clara);
  } finally {
    // The credential dies with the request.
    contrasena.olvidar();
  }
}

function ejecutar(operacion: string, cuerpo: CuerpoPeticion): Promise<ResultadoDescarga> {
  return conCredenciales(cuerpo, async (credenciales, contexto, clara) =>
    conSobre(await operar(operacion, credenciales, contexto), contexto, clara),
  );
}

const GENEROS = ['1', '2', '3', '4', '6'];

/** Typed boxes go straight into a legal return: anything that is not a plain number is refused. */
function datosValidos(datos: unknown): datos is DatosDiligenciamiento {
  const d = (datos ?? {}) as Partial<DatosDiligenciamiento>;
  const casillas = Object.entries(d.casillas ?? {});
  const codigo = (d as DatosPresentacion).codigoFirma;
  const formulario = d.numeroFormulario;
  return (
    (codigo === undefined || CODIGO_FIRMA.test(String(codigo))) &&
    (formulario === undefined || /^\d{10,15}$/.test(String(formulario))) &&
    GENEROS.includes(String(d.genero)) &&
    /^\d{4}$/.test(String(d.actividadEconomica)) &&
    casillas.length > 0 &&
    casillas.every(([c, v]) => /^\d{1,3}$/.test(c) && Number.isSafeInteger(v) && v >= 0)
  );
}

function diligenciar(
  cuerpo: CuerpoPeticion,
  operacion: 'diligenciar' | 'presentar',
  alProgresar: (progreso: ProgresoConexion) => void,
): Promise<ResultadoDiligenciamiento | ResultadoPresentacion> {
  const datos = cuerpo.datos;
  if (!datosValidos(datos)) {
    return Promise.resolve({ exito: false, motivoFallo: 'desconocido', detalle: 'Datos de la declaración inválidos' });
  }
  return conCredenciales(cuerpo, async (credenciales, contexto, clara) =>
    conSobre(await alPortal(credenciales, contexto, datos, operacion, alProgresar), contexto, clara),
  );
}

function alPortal(
  credenciales: Credenciales,
  contexto: ContextoOperacionDian,
  datos: DatosDiligenciamiento,
  operacion: 'diligenciar' | 'presentar',
  alProgresar: (progreso: ProgresoConexion) => void,
): Promise<ResultadoDiligenciamiento | ResultadoPresentacion> {
  if (operacion === 'presentar') {
    return conexion.presentarDeclaracion(credenciales, contexto, datos, alProgresar);
  }
  return conexion.diligenciarDeclaracion(credenciales, contexto, datos, alProgresar);
}

/** Nombres del portal fuera del log: el diagnóstico es estructura, no personas. */
const PARECE_NOMBRE = /\b[A-ZÁÉÍÓÚÑ]{3,}(\s+[A-ZÁÉÍÓÚÑ]{3,})+\b/g;

interface Anotable {
  exito: boolean;
  motivoFallo?: string;
  detalle?: string;
  firmada?: boolean;
  presentada?: boolean;
  requiereCodigo?: boolean;
}

/** Presentar y no quedar presentada también hay que poder explicarlo. */
function desenlaceDe(operacion: string, resultado: Anotable): string | null {
  if (!resultado.exito) {
    return `falló: ${resultado.motivoFallo ?? 'sin motivo'}`;
  }
  if (operacion !== 'presentar' || resultado.presentada === true) {
    return null;
  }
  return `terminó sin presentar: firmada=${String(resultado.firmada ?? false)} requiereCodigo=${String(resultado.requiereCodigo ?? false)}`;
}

/**
 * Un desenlace que solo se ve en la pantalla del usuario obliga a pedírselo
 * copiado para poder diagnosticarlo. Queda en el log del worker, que es de la
 * máquina y no viaja a ninguna parte.
 */
function anotarFallo(operacion: string, resultado: Anotable): void {
  const desenlace = desenlaceDe(operacion, resultado);
  if (desenlace === null) {
    return;
  }
  const detalle = (resultado.detalle ?? '').replace(PARECE_NOMBRE, '«nombre»');
  process.stderr.write(`[${new Date().toISOString()}] ${operacion} ${desenlace} · ${detalle}\n`);
}

/**
 * Filling takes minutes: each step goes out as its own NDJSON line so the user
 * sees where the robot is, and the result is always the last line.
 */
async function transmitirDiligenciamiento(
  respuesta: ServerResponse,
  cuerpo: CuerpoPeticion,
  operacion: 'diligenciar' | 'presentar',
): Promise<void> {
  respuesta.writeHead(200, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' });
  const emitir = (linea: unknown) => respuesta.write(`${JSON.stringify(linea)}\n`);
  const resultado = await diligenciar(cuerpo, operacion, (progreso) => emitir({ progreso })).catch((error: unknown) => ({
    exito: false,
    motivoFallo: 'desconocido' as const,
    detalle: detalleSeguro('Error', error instanceof Error ? error.message : '', []),
  }));
  anotarFallo(operacion, resultado);
  respuesta.end(`${JSON.stringify({ resultado })}\n`);
}

async function responderDescarga(respuesta: ServerResponse, operacion: string, cuerpo: CuerpoPeticion): Promise<void> {
  responder(respuesta, 200, aRespuesta(await ejecutar(operacion, cuerpo)));
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

/**
 * Seals the access only when it worked and the user actually asked for it.
 *
 * Vale para cualquier operación, no solo las descargas: si presentar no sellara
 * el sobre, marcar "recordar mi acceso" no guardaría nada y el usuario tendría
 * que escribir la contraseña en cada intento.
 */
function conSobre<T extends { exito: boolean; cifrado?: SobreCifrado }>(
  resultado: T,
  contexto: ContextoOperacionDian,
  clara: string,
): T {
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
    const enFlujo = operacion === 'diligenciar' || operacion === 'presentar';
    const cuerpo = JSON.parse(await leerCuerpo(peticion, LIMITE_CUERPO[enFlujo ? 'diligenciar' : 'descarga'])) as CuerpoPeticion;
    await (enFlujo
      ? transmitirDiligenciamiento(respuesta, cuerpo, operacion === 'presentar' ? 'presentar' : 'diligenciar')
      : responderDescarga(respuesta, operacion, cuerpo));
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
  if (peticion.method === 'POST' && ['/dian/exogena', '/dian/declaracion', '/dian/diligenciar', '/dian/presentar'].includes(ruta)) {
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
