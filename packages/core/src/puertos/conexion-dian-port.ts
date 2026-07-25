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

/** Who files vs. who operates. Today the same; later an accountant for a client. */
export interface ContextoOperacionDian {
  /** National ID of the taxpayer whose data is queried. */
  titularIdentificacion: string;
  /** Platform user running the operation. */
  operadorUsuarioId: string;
  anioGravable: number;
  /** Defaults to 'propio'; 'tercero' uses DIAN's door for representatives. */
  modoIngreso?: ModoIngresoDian;
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
