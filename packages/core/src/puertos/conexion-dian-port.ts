/**
 * Port towards the DIAN portal (MUISCA). The domain does not know there is an
 * automated browser on the other side: it only asks for operations.
 *
 * NON-NEGOTIABLE: credentials are single-use and never persisted (PLAN-DIAN §1).
 */

import type { Secreto } from '../dian/secreto';

export type TipoDocumentoDian = 'CC' | 'CE' | 'NIT' | 'PA' | 'TI';

/**
 * How to sign in. DIAN offers both doors: in `tercero` the operator signs in
 * with their OWN credentials and acts for the taxpayer, who never shares a
 * password (research/07 §2.1.1).
 */
export type ModoIngresoDian = 'propio' | 'tercero';

/** Ephemeral credentials. The password is a [[Secreto]] so it cannot be printed. */
export interface CredencialesDian {
  tipoDocumento: TipoDocumentoDian;
  numeroDocumento: string;
  contrasena: Secreto;
}

/** AES-256-GCM envelope. Only the isolated worker holds the key to open it. */
export interface SobreCifrado {
  version: number;
  nonce: string;
  tag: string;
  contenido: string;
}

/** Who files vs. who operates. Today the same; later an accountant for a client. */
export interface ContextoOperacionDian {
  /** National ID of the taxpayer whose data is queried. */
  titularIdentificacion: string;
  /** Platform user running the operation. */
  operadorUsuarioId: string;
  anioGravable: number;
  /** Defaults to 'propio'; 'tercero' uses DIAN's door for representatives. */
  modoIngreso?: ModoIngresoDian;
  /** Stored access: when present the password is not needed at all. */
  cifrado?: SobreCifrado;
  /** The user asked us to remember this access, so the worker returns a sealed envelope. */
  recordarAcceso?: boolean;
}

export type EtapaConexion =
  | 'iniciando'
  | 'autenticando'
  | 'navegando'
  | 'descargando'
  | 'completado'
  | 'error';

export interface ProgresoConexion {
  etapa: EtapaConexion;
  mensaje: string;
}

/** Failure reasons the UI turns into actionable messages. */
export type MotivoFalloDian =
  | 'credenciales_invalidas'
  | 'portal_no_disponible'
  | 'estructura_cambiada'
  | 'requiere_verificacion'
  | 'tiempo_agotado'
  /** No filed return for that year. Not an error: first-time filers hit this. */
  | 'sin_declaracion'
  /** The stored access no longer works: the user has to sign in again. */
  | 'acceso_caducado'
  /** Our own worker is down. Not DIAN's fault: do not tell the user otherwise. */
  | 'servicio_no_disponible'
  | 'desconocido';

export interface ResultadoDescarga {
  exito: boolean;
  /** Downloaded file; the caller decides whether to process or discard it. */
  contenido?: Uint8Array;
  nombreArchivo?: string;
  motivoFallo?: MotivoFalloDian;
  detalle?: string;
  /** Present only when the user asked to be remembered: store it as-is. */
  cifrado?: SobreCifrado;
}

export interface ConexionDianPort {
  /** Downloads the third-party report (exógena) for the given tax year. */
  descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga>;

  /** Downloads the PDF of an already filed return. */
  descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga>;
}
