/**
 * Validation of the connection request, as a pure function: testable without a
 * runner in apps/web, and it keeps the HTTP route thin.
 */

import { Secreto } from './secreto';

import type {
  CredencialesDian,
  ModoIngresoDian,
  TipoDocumentoDian,
} from '../puertos/conexion-dian-port';

const TIPOS: TipoDocumentoDian[] = ['CC', 'CE', 'NIT', 'PA', 'TI'];
const ANIO_MINIMO = 2018;
const LARGO_MINIMO_DOCUMENTO = 5;
const LARGO_MAXIMO_DOCUMENTO = 15;
const LARGO_MINIMO_CONTRASENA = 4;
const LARGO_MAXIMO_CONTRASENA = 64;

export interface CuerpoConexion {
  tipoDocumento?: unknown;
  numeroDocumento?: unknown;
  contrasena?: unknown;
  titular?: unknown;
  anioGravable?: unknown;
  modoIngreso?: unknown;
  recordarAcceso?: unknown;
}

export interface SolicitudConexionDian {
  credenciales: CredencialesDian;
  titular: string;
  anioGravable: number;
  modoIngreso: ModoIngresoDian;
  /** Explicit consent to store the access; never inferred. */
  recordarAcceso: boolean;
}

export type ResultadoValidacion =
  | { valida: true; solicitud: SolicitudConexionDian }
  | { valida: false; error: string };

interface Normalizado {
  numeroDocumento: string;
  contrasena: string;
  tipoDocumento: unknown;
  titular: string;
  anioGravable: number | null;
  modoIngreso: ModoIngresoDian;
  recordarAcceso: boolean;
}

/** Safe conversion: an object is discarded, never turned into "[object Object]". */
function comoTexto(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor;
  }
  return typeof valor === 'number' ? String(valor) : '';
}

function soloDigitos(valor: unknown): string {
  return comoTexto(valor).replace(/\D/g, '');
}

function anioValido(valor: unknown, anioActual: number): number | null {
  if (valor === undefined) {
    return anioActual - 1;
  }
  const esEntero = typeof valor === 'number' && Number.isInteger(valor);
  return esEntero && valor >= ANIO_MINIMO && valor <= anioActual ? valor : null;
}

function normalizar(cuerpo: CuerpoConexion, anioActual: number): Normalizado {
  const numeroDocumento = soloDigitos(cuerpo.numeroDocumento);
  return {
    numeroDocumento,
    contrasena: typeof cuerpo.contrasena === 'string' ? cuerpo.contrasena : '',
    tipoDocumento: cuerpo.tipoDocumento ?? 'CC',
    titular: cuerpo.titular === undefined ? numeroDocumento : soloDigitos(cuerpo.titular),
    anioGravable: anioValido(cuerpo.anioGravable, anioActual),
    modoIngreso: cuerpo.modoIngreso === 'tercero' ? 'tercero' : 'propio',
    recordarAcceso: cuerpo.recordarAcceso === true,
  };
}

function largoDocumentoValido(documento: string): boolean {
  return documento.length >= LARGO_MINIMO_DOCUMENTO && documento.length <= LARGO_MAXIMO_DOCUMENTO;
}

/**
 * On "own behalf" the taxpayer must match the credentials: allowing any other
 * value would let someone forge authorization evidence for a foreign ID. On
 * "third party" the operator signs in with their own credentials, so a
 * different taxpayer is expected; whether that person is actually under this
 * user is checked by the layer that can read the database.
 */
function errorDeTitular(datos: Normalizado): string | null {
  if (datos.modoIngreso === 'propio') {
    return datos.titular === datos.numeroDocumento ? null : 'Solo puedes conectar tu propia cuenta';
  }
  if (!largoDocumentoValido(datos.titular)) {
    return 'Revisa la cédula de la persona que declaras';
  }
  return datos.titular === datos.numeroDocumento
    ? 'Para declarar a nombre de otra persona, ingresa con tus propias credenciales'
    : null;
}

function contrasenaValida(contrasena: string): boolean {
  return contrasena.length >= LARGO_MINIMO_CONTRASENA && contrasena.length <= LARGO_MAXIMO_CONTRASENA;
}

function primerError(datos: Normalizado, sinContrasena: boolean): string | null {
  if (!largoDocumentoValido(datos.numeroDocumento)) {
    return 'Revisa tu número de documento';
  }
  // Con un acceso ya guardado la contraseña no viaja: la abre el worker.
  if (!sinContrasena && !contrasenaValida(datos.contrasena)) {
    return 'Revisa tu contraseña';
  }
  if (!TIPOS.includes(datos.tipoDocumento as TipoDocumentoDian)) {
    return 'Tipo de documento no válido';
  }
  if (datos.anioGravable === null) {
    return 'Año gravable no válido';
  }
  return errorDeTitular(datos);
}

function aSolicitud(datos: Normalizado, anioActual: number): SolicitudConexionDian {
  return {
    credenciales: {
      tipoDocumento: datos.tipoDocumento as TipoDocumentoDian,
      numeroDocumento: datos.numeroDocumento,
      contrasena: new Secreto(datos.contrasena),
    },
    titular: datos.titular,
    anioGravable: datos.anioGravable ?? anioActual - 1,
    modoIngreso: datos.modoIngreso,
    recordarAcceso: datos.recordarAcceso,
  };
}

export function validarSolicitudConexion(
  cuerpo: CuerpoConexion,
  anioActual: number,
  hayAccesoGuardado = false,
): ResultadoValidacion {
  const datos = normalizar(cuerpo, anioActual);
  const error = primerError(datos, hayAccesoGuardado);
  if (error !== null) {
    return { valida: false, error };
  }
  return { valida: true, solicitud: aSolicitud(datos, anioActual) };
}
