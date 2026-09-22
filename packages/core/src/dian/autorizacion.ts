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

export type AlcanceAutorizacion =
  | 'leer_exogena'
  | 'leer_declaraciones'
  /** Fill the 210 in the portal as a draft and save it; never sign nor file. */
  | 'diligenciar_declaracion'
  | 'presentar_declaracion'
  /** Keep the access stored so the user does not sign in on every operation. */
  | 'recordar_acceso';

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

/**
 * Changing the wording requires bumping this, so old evidence stays verifiable.
 * v2: storing the credential became possible, so the promise that it is never
 * stored had to go. Evidence signed under v1 remains valid for v1's wording.
 * v3: variant for operating with another person's own credentials; the
 * wording for one's own account did not change.
 * v5: la redacción se acortó. Un muro de texto no se lee, y lo que no se lee no
 * informa: queda lo que de verdad decide (qué se hace, quién autoriza y que
 * presentar solo se deshace corrigiendo).
 */
export const VERSION_TEXTO_AUTORIZACION = 'v5';

export interface TextoAutorizacion {
  version: string;
  titular: string;
  /** The operator is not the taxpayer: signs in with the taxpayer's credentials, with their consent. */
  enNombreDeOtro: boolean;
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

interface Redaccion {
  acciones: Record<AlcanceAutorizacion, string>;
  noHaremos: string[];
  titularidad: string;
  sinGuardar: string;
}

const PROPIA: Redaccion = {
  acciones: {
    leer_exogena: 'Descargar tu información exógena reportada por terceros',
    leer_declaraciones: 'Descargar tus declaraciones de renta ya presentadas',
    diligenciar_declaracion:
      'Diligenciar tu declaración en el portal y guardarla como borrador, sin firmarla ni presentarla',
    presentar_declaracion:
      'Diligenciar, firmar con tu firma electrónica y presentar tu declaración ante la DIAN, y traerte el acuse',
    recordar_acceso: 'Guardar tu acceso cifrado para no pedirte la contraseña cada vez',
  },
  noHaremos: ['Nada distinto de lo anterior, ni entrar a tu cuenta si tú no lo pides'],
  titularidad: 'Soy el titular de la cuenta y esta autorización es revocable.',
  sinGuardar: 'Mis credenciales se usan solo en esta operación y NO serán almacenadas.',
};

/**
 * Operating with someone else's own credentials: the operator must not sign
 * "I am the taxpayer". What they can truthfully state, and what the evidence
 * must prove, is that the taxpayer gave them the credentials and consented.
 */
const DE_OTRA_PERSONA: Redaccion = {
  acciones: {
    leer_exogena: 'Descargar su información exógena reportada por terceros',
    leer_declaraciones: 'Descargar sus declaraciones de renta ya presentadas',
    diligenciar_declaracion:
      'Diligenciar su declaración en el portal y guardarla como borrador, sin firmarla ni presentarla',
    presentar_declaracion:
      'Diligenciar, firmar con su firma electrónica y presentar su declaración ante la DIAN, y traer el acuse',
    recordar_acceso: 'Guardar su acceso cifrado para no pedir la contraseña cada vez',
  },
  noHaremos: ['Nada distinto de lo anterior, ni entrar a su cuenta si tú no lo pides'],
  titularidad:
    'No soy el titular: la persona titular me entregó sus claves y me autorizó a hacer esto en su nombre; esta autorización es revocable.',
  sinGuardar: 'Sus credenciales se usan solo en esta operación y NO serán almacenadas.',
};

/**
 * Presentar es irreversible: solo se corrige con una declaración de corrección
 * (art. 588 E.T.). Quien autoriza debe declararlo entendido y haber revisado.
 */
const DECLARACIONES_PRESENTAR = [
  'Revisé las cifras y entiendo que, una vez presentada, solo se cambia con una declaración de corrección.',
];

const DECLARACIONES_RECORDAR_COMUNES = [
  'Puedo borrar este acceso guardado cuando quiera, y se borra solo tras 90 días sin uso.',
];

/** Legal text the user sees and accepts. Single source: the UI renders it as-is. */
export function textoAutorizacion(
  titular: string,
  alcances: AlcanceAutorizacion[],
  enNombreDeOtro = false,
): TextoAutorizacion {
  const redaccion = enNombreDeOtro ? DE_OTRA_PERSONA : PROPIA;
  return {
    version: VERSION_TEXTO_AUTORIZACION,
    titular,
    enNombreDeOtro,
    alcances,
    encabezado: encabezadoDe(titular, enNombreDeOtro),
    haremos: alcances.map((a) => redaccion.acciones[a]),
    noHaremos: redaccion.noHaremos,
    declaraciones: declaracionesDe(alcances, redaccion),
  };
}

function encabezadoDe(titular: string, enNombreDeOtro: boolean): string {
  if (enNombreDeOtro) {
    return `Con la autorización de la persona titular de la cédula ${titular}, autorizo a TuRenta AI a entrar a su cuenta de la DIAN ahora, para:`;
  }
  return `Autorizo a TuRenta AI a entrar a la cuenta de la DIAN de la cédula ${titular} ahora, para:`;
}

function declaracionesDe(alcances: AlcanceAutorizacion[], redaccion: Redaccion): string[] {
  const base = [
    redaccion.titularidad,
    ...(alcances.includes('presentar_declaracion') ? DECLARACIONES_PRESENTAR : []),
  ];
  if (alcances.includes('recordar_acceso')) {
    return [...base, ...DECLARACIONES_RECORDAR_COMUNES];
  }
  return [...base, redaccion.sinGuardar];
}

/** Canonical form: this is what gets hashed. Deterministic and stable. */
export function serializarAutorizacion(texto: TextoAutorizacion): string {
  return [
    `version: ${texto.version}`,
    `titular: ${texto.titular}`,
    `en_nombre_de_otro: ${texto.enNombreDeOtro ? 'si' : 'no'}`,
    `alcances: ${texto.alcances.join(',')}`,
    texto.encabezado,
    ...texto.haremos.map((h) => `SI: ${h}`),
    ...texto.noHaremos.map((n) => `NO: ${n}`),
    ...texto.declaraciones.map((d) => `DECLARO: ${d}`),
  ].join('\n');
}
