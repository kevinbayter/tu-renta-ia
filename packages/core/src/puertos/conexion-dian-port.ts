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
  | 'firmando'
  | 'presentando'
  | 'autenticando'
  | 'navegando'
  | 'descargando'
  | 'diligenciando'
  | 'verificando'
  | 'guardando'
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
  /** El titular no tiene firma electrónica vigente: sin ella el portal no deja declarar. */
  | 'sin_firma_electronica'
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

/** Casilla 286 del 210 (select del portal). */
export type GeneroDian = '1' | '2' | '3' | '4' | '6';

/** Lo que el portal no puede sacar de las casillas: se le pregunta al usuario. */
export interface DatosDiligenciamiento {
  /** Casillas calculadas por el motor (ResultadoDeclaracion.casillas). */
  casillas: Record<string, number>;
  genero: GeneroDian;
  /** Casilla 24: código CIIU o 0010/0020/0081/0082/0090, uno de los del RUT. */
  actividadEconomica: string;
  /**
   * Número del borrador en el portal, si ya lo conocemos: permite abrir el
   * editor por su URL y saltarse el menú, las tarjetas y los avisos del SPA.
   */
  numeroFormulario?: string;
}

/** Casilla que el portal calculó distinto a TuRenta. */
export interface DiferenciaCasilla {
  casilla: string;
  turenta: number;
  portal: number;
}

export interface ResultadoDiligenciamiento {
  exito: boolean;
  /** Número del formulario (borrador) en el portal. */
  numeroFormulario?: string;
  /** Vacío = todo lo que calculó el portal cuadra con TuRenta. */
  diferencias?: DiferenciaCasilla[];
  /** El borrador solo se guarda cuando no hay diferencias. */
  guardado?: boolean;
  /**
   * Estructura de la ventana de firma (campos, botones, enlaces; sin valores),
   * capturada al abrirla SIN escribir nada: insumo para mapear la presentación.
   */
  mapaFirma?: unknown;
  motivoFallo?: MotivoFalloDian;
  detalle?: string;
  cifrado?: SobreCifrado;
}

/**
 * Lo que el robot necesita además de las cifras para FIRMAR y PRESENTAR.
 * La contraseña de la firma es la misma de la cuenta (DIAN, desde sep-2023), y
 * el código dinámico solo se envía cuando el portal lo exige: la Resolución
 * 000227 de 2025 (art. 1.7.4.6) lo mantiene como segundo factor posible.
 */
export interface DatosPresentacion extends DatosDiligenciamiento {
  codigoFirma?: string;
}

/**
 * El acuse de recibo es la ÚNICA prueba de presentación: la Resolución
 * 000227 de 2025 (art. 1.7.4.2 num. 7) entiende firmado el documento "en el
 * momento en que el sistema genera el acuse de recibo".
 */
export interface ResultadoPresentacion extends ResultadoDiligenciamiento {
  firmada?: boolean;
  presentada?: boolean;
  /** El portal pidió el código dinámico: no se firmó nada y hay que reintentar con él. */
  requiereCodigo?: boolean;
  acuse?: { nombreArchivo: string; contenidoBase64: string };
  presentadaEn?: string;
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

  /**
   * Fills the 210 in the portal as a DRAFT, reads back what the portal
   * calculated and saves only if it matches. Never signs nor files.
   */
  diligenciarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosDiligenciamiento,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDiligenciamiento>;

  /**
   * Llena, verifica, guarda, FIRMA y PRESENTA, y trae el acuse. Solo se invoca
   * con la autorización expresa del titular (alcance `presentar_declaracion`).
   */
  presentarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosPresentacion,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoPresentacion>;
}
