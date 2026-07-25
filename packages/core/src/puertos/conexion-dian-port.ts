/**
 * Puerto hacia el portal de la DIAN (MUISCA). El dominio no sabe que del otro
 * lado hay un navegador automatizado: solo pide operaciones.
 *
 * REGLA INNEGOCIABLE: las credenciales son de un solo uso y jamás se persisten
 * (ver PLAN-DIAN.md §1). Ningún método las devuelve ni las almacena.
 */

export type TipoDocumentoDian = 'CC' | 'CE' | 'NIT' | 'PA' | 'TI';

/** Credenciales efímeras: viven en memoria durante la operación y se descartan. */
export interface CredencialesDian {
  tipoDocumento: TipoDocumentoDian;
  numeroDocumento: string;
  contrasena: string;
}

/**
 * Quién declara vs. quién opera. Hoy coinciden; en el futuro B2B un contador
 * (operador) actuará por su cliente (titular). La evidencia guarda ambos.
 */
export interface ContextoOperacionDian {
  /** Cédula de la persona cuya información se consulta. */
  titularIdentificacion: string;
  /** Usuario de la plataforma que ejecuta la operación. */
  operadorUsuarioId: string;
  anioGravable: number;
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

/** Motivos de fallo que la UI traduce a mensajes accionables para el usuario. */
export type MotivoFalloDian =
  | 'credenciales_invalidas'
  | 'portal_no_disponible'
  | 'estructura_cambiada'
  | 'requiere_verificacion'
  | 'tiempo_agotado'
  /** La cuenta no tiene una declaración presentada de ese año: no es un error. */
  | 'sin_declaracion'
  | 'desconocido';

export interface ResultadoDescarga {
  exito: boolean;
  /** Contenido del archivo descargado; el llamador decide si lo procesa o descarta. */
  contenido?: Uint8Array;
  nombreArchivo?: string;
  motivoFallo?: MotivoFalloDian;
  detalle?: string;
}

export interface ConexionDianPort {
  /** Descarga el reporte de información exógena del año gravable indicado. */
  descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga>;

  /** Descarga el PDF de una declaración ya presentada (para leer sus casillas). */
  descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (progreso: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga>;
}
