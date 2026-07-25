import type { ExogenaParseada, RespuestasEntrevista, ResultadoExtraccion } from '@turenta/core';
import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';
import type {
  Certificado220Extraido,
  CertificadoBancarioExtraido,
  CertificadoPrepagadaExtraido,
  DeclaracionAnteriorExtraida,
} from '@turenta/shared';

/** Documento procesado por el pipeline de extracción, pendiente de confirmación del usuario. */
export type DocumentoProcesado =
  | { id: string; nombreArchivo: string; tipo: 'exogena'; exogena: ExogenaParseada }
  | ({ id: string; nombreArchivo: string; tipo: 'certificado_220' } & ResultadoExtraccion<Certificado220Extraido>)
  | ({ id: string; nombreArchivo: string; tipo: 'certificado_bancario' } & ResultadoExtraccion<CertificadoBancarioExtraido>)
  | ({ id: string; nombreArchivo: string; tipo: 'medicina_prepagada' } & ResultadoExtraccion<CertificadoPrepagadaExtraido>)
  | ({ id: string; nombreArchivo: string; tipo: 'declaracion_anterior' } & ResultadoExtraccion<DeclaracionAnteriorExtraida>)
  | { id: string; nombreArchivo: string; tipo: 'otro' };

export interface MensajeChat {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface Declarante {
  nombres: string;
  apellidos: string;
  identificacion: string;
}

export type { RespuestasEntrevista, ResultadoDeclaracion };

export const RESPUESTAS_INICIALES: RespuestasEntrevista = {
  mesesConRelacionLaboral: 12,
  mesesConPension: 12,
  tieneDependiente387: false,
  dependientesAdicionales336: 0,
  pagosMedicinaPrepagadaConfirmados: 0,
  interesesVivienda: 0,
  interesesIcetex: 0,
  gmfTotalPagado: 0,
  rendimientosAdicionalesConComponente: 0,
  rendimientosSinComponente: 0,
  ingresosNoLaborales: 0,
  costosNoLaborales: 0,
  activosManuales: [],
  deudas: 0,
  declaracionesPrevias: 0,
  impuestoNetoAnioAnterior: 0,
  anticipoLiquidadoAnioAnterior: 0,
  donacionesEsal: 0,
  patrimonioLiquidoAnterior: 0,
  justificacionesPatrimoniales: 0,
};

export function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);
}
