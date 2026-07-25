/**
 * Persisted evidence of DIAN connection authorizations (PLAN-DIAN §1.3: date,
 * time, IP and hash of the accepted text, revocable).
 *
 * RULE: no credential passes through here — `CredencialesDian` is not even
 * imported. The adapter stores the hash of the accepted text, never the text
 * itself nor anything derived from the password.
 */

import type { AlcanceAutorizacion, AutorizacionDian } from '../dian/autorizacion';

/** Request fingerprint: proves from where and with which client it was accepted. */
export interface HuellaPeticion {
  ip: string;
  userAgent: string;
}

export type ResultadoAutorizacion = 'en_curso' | 'exitosa' | 'fallida' | 'revocada';

/** What the taxpayer can see about their own authorizations (habeas data). */
export interface EvidenciaAutorizacion {
  id: string;
  titularIdentificacion: string;
  alcances: AlcanceAutorizacion[];
  versionTexto: string;
  textoHash: string;
  otorgadaEn: string;
  expiraEn: string;
  ip: string;
  resultado: ResultadoAutorizacion;
  motivoFallo: string;
  revocadaEn: string | null;
}

export interface DesenlaceAutorizacion {
  resultado: ResultadoAutorizacion;
  motivoFallo?: string;
}

export interface EvidenciaAutorizacionPort {
  /** Records acceptance BEFORE touching the portal: no evidence, no operation. */
  registrarAutorizacion(
    autorizacion: AutorizacionDian,
    huella: HuellaPeticion,
  ): Promise<{ id: string }>;

  /** Closes the record with the real outcome of the covered operation. */
  cerrarAutorizacion(
    evidenciaId: string,
    desenlace: DesenlaceAutorizacion,
    ahora: Date,
  ): Promise<void>;

  /** Habeas data, read: which authorizations this user has granted. */
  listarAutorizaciones(operadorUsuarioId: string, limite: number): Promise<EvidenciaAutorizacion[]>;

  /** Habeas data, revoke: cuts every live authorization. Returns how many. */
  revocarVigentes(operadorUsuarioId: string, ahora: Date): Promise<number>;

  /** Retention: deletes evidence granted before the cutoff date. */
  purgarAnterioresA(limite: Date): Promise<number>;
}
