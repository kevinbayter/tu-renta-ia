/**
 * Evidencia de autorización para operar en la DIAN a nombre del titular.
 * Es la pieza que sostiene legalmente la conexión (art. 269A Ley 1273: el
 * acceso debe ser autorizado y "dentro de lo acordado").
 * Ver research/07-automatizacion-dian-analisis-2026.md §3.1.
 */

export type AlcanceAutorizacion = 'leer_exogena' | 'leer_declaraciones' | 'presentar_declaracion';

export interface AutorizacionDian {
  /** Cédula de la persona cuya cuenta se consulta. */
  titularIdentificacion: string;
  /** Usuario de la plataforma que ejecuta (hoy = titular; futuro B2B = contador). */
  operadorUsuarioId: string;
  alcances: AlcanceAutorizacion[];
  /** Texto exacto que el usuario aceptó (se guarda su hash, no el texto completo). */
  textoAceptado: string;
  otorgadaEn: Date;
  /** La autorización es puntual: vence sola para que no queden permisos abiertos. */
  expiraEn: Date;
}

/** Minutos de vigencia: lo justo para completar la operación, nunca "para siempre". */
export const MINUTOS_VIGENCIA_AUTORIZACION = 15;

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

/** Una autorización solo habilita lo que enumera: nunca se asume un alcance mayor. */
export function permiteAlcance(
  autorizacion: AutorizacionDian,
  alcance: AlcanceAutorizacion,
  ahora: Date,
): boolean {
  return autorizacionVigente(autorizacion, ahora) && autorizacion.alcances.includes(alcance);
}

/** Texto legal que el usuario debe aceptar antes de conectar (queda como evidencia). */
export function textoAutorizacion(titular: string, alcances: AlcanceAutorizacion[]): string {
  const descripciones: Record<AlcanceAutorizacion, string> = {
    leer_exogena: 'consultar y descargar mi información exógena reportada por terceros',
    leer_declaraciones: 'consultar y descargar mis declaraciones ya presentadas',
    presentar_declaracion: 'diligenciar, firmar y presentar mi declaración de renta',
  };
  const lista = alcances.map((a) => `• ${descripciones[a]}`).join('\n');
  return `Yo, identificado con cédula ${titular}, autorizo de forma expresa, informada y revocable a TuRenta AI para ingresar a mi cuenta de la DIAN, únicamente con el fin de:

${lista}

Declaro que:
- Mis credenciales se usarán solo durante esta operación y NO serán almacenadas.
- Esta autorización vence en ${String(MINUTOS_VIGENCIA_AUTORIZACION)} minutos y puedo revocarla en cualquier momento.
- Soy el titular de la cuenta y de la información consultada.
- Puedo realizar este mismo trámite manualmente en el portal de la DIAN si lo prefiero.`;
}
