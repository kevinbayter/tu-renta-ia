/**
 * Authorization evidence for operating on the taxpayer's behalf at the DIAN
 * portal. This is what legally supports the connection (art. 269A, Law 1273:
 * access must be authorized and "within what was agreed").
 * See research/07-automatizacion-dian-analisis-2026.md §3.1.
 *
 * The text is structured and versioned on purpose: the screen renders it from
 * here and the server hashes exactly this. If the UI had its own wording we
 * would store the hash of a text the user never saw, and the evidence would
 * prove nothing.
 */

export type AlcanceAutorizacion = 'leer_exogena' | 'leer_declaraciones' | 'presentar_declaracion';

export interface AutorizacionDian {
  /** National ID of the taxpayer whose account is queried. */
  titularIdentificacion: string;
  /** Platform user running the operation (today the taxpayer; later, an accountant). */
  operadorUsuarioId: string;
  alcances: AlcanceAutorizacion[];
  /** Exact text the user accepted; only its hash is persisted. */
  textoAceptado: string;
  otorgadaEn: Date;
  /** Expires on its own so no standing permission is left behind. */
  expiraEn: Date;
}

/** Just enough to complete the operation, never an open-ended grant. */
export const MINUTOS_VIGENCIA_AUTORIZACION = 15;

/** Changing the wording requires bumping this, so old evidence stays verifiable. */
export const VERSION_TEXTO_AUTORIZACION = 'v1';

export interface TextoAutorizacion {
  version: string;
  titular: string;
  alcances: AlcanceAutorizacion[];
  encabezado: string;
  haremos: string[];
  noHaremos: string[];
  declaraciones: string[];
}

export function crearAutorizacion(
  datos: Omit<AutorizacionDian, 'otorgadaEn' | 'expiraEn'>,
  ahora: Date,
): AutorizacionDian {
  return {
    ...datos,
    otorgadaEn: ahora,
    expiraEn: new Date(ahora.getTime() + MINUTOS_VIGENCIA_AUTORIZACION * 60_000),
  };
}

export function autorizacionVigente(autorizacion: AutorizacionDian, ahora: Date): boolean {
  return autorizacion.expiraEn.getTime() > ahora.getTime();
}

/** An authorization only grants what it lists; a wider scope is never assumed. */
export function permiteAlcance(
  autorizacion: AutorizacionDian,
  alcance: AlcanceAutorizacion,
  ahora: Date,
): boolean {
  return autorizacionVigente(autorizacion, ahora) && autorizacion.alcances.includes(alcance);
}

const ACCIONES: Record<AlcanceAutorizacion, string> = {
  leer_exogena: 'Descargar tu información exógena reportada por terceros',
  leer_declaraciones: 'Descargar tus declaraciones de renta ya presentadas',
  presentar_declaracion: 'Diligenciar, firmar y presentar tu declaración de renta',
};

const NO_HAREMOS = [
  'Guardar tu contraseña — ni cifrada, ni en registros, en ningún lado',
  'Volver a entrar a tu cuenta sin que tú lo pidas',
  'Hacer nada distinto de lo enumerado arriba',
];

const DECLARACIONES = [
  `Esta autorización vence en ${String(MINUTOS_VIGENCIA_AUTORIZACION)} minutos y es revocable en cualquier momento.`,
  'Mis credenciales se usan solo durante esta operación y NO serán almacenadas.',
  'Soy el titular de la cuenta y de la información consultada.',
  'Puedo hacer este mismo trámite manualmente en el portal de la DIAN si lo prefiero.',
];

/** Legal text the user sees and accepts. Single source: the UI renders it as-is. */
export function textoAutorizacion(
  titular: string,
  alcances: AlcanceAutorizacion[],
): TextoAutorizacion {
  return {
    version: VERSION_TEXTO_AUTORIZACION,
    titular,
    alcances,
    encabezado: `Autorizo a TuRenta AI a ingresar a la cuenta de la DIAN de la cédula ${titular} una sola vez, ahora mismo y conmigo presente, para:`,
    haremos: [
      ...alcances.map((a) => ACCIONES[a]),
      'Cerrar la sesión y borrar las credenciales de la memoria',
    ],
    noHaremos: NO_HAREMOS,
    declaraciones: DECLARACIONES,
  };
}

/** Canonical form: this is what gets hashed. Deterministic and stable. */
export function serializarAutorizacion(texto: TextoAutorizacion): string {
  return [
    `version: ${texto.version}`,
    `titular: ${texto.titular}`,
    `alcances: ${texto.alcances.join(',')}`,
    texto.encabezado,
    ...texto.haremos.map((h) => `SI: ${h}`),
    ...texto.noHaremos.map((n) => `NO: ${n}`),
    ...texto.declaraciones.map((d) => `DECLARO: ${d}`),
  ].join('\n');
}
