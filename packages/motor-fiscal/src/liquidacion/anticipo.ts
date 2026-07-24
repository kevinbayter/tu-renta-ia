import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { HistorialInput } from '../modelo/tipos';

/** % de anticipo según número de declaraciones previas: 25% / 50% / 75% (arts. 807-809). */
export function porcentajeAnticipo(declaracionesPrevias: number, c: ConstantesAnio): number {
  const indice = Math.min(Math.max(declaracionesPrevias, 0), 2) as 0 | 1 | 2;
  return c.anticipo.porcentajePorDeclaracion[indice];
}

/**
 * Anticipo para el año siguiente: el contribuyente elige el menor entre
 * procedimiento 1 (impuesto neto del año) y procedimiento 2 (promedio dos años,
 * disponible desde la segunda declaración); se restan retenciones; nunca negativo.
 */
export function calcularAnticipo(
  impuestoNeto: number,
  retenciones: number,
  historial: HistorialInput,
  c: ConstantesAnio,
): number {
  const pct = porcentajeAnticipo(historial.declaracionesPrevias, c);
  const procedimiento1 = impuestoNeto * pct;
  const procedimiento2 = calcularProcedimientoPromedio(impuestoNeto, historial, pct, procedimiento1);
  const menor = Math.min(procedimiento1, procedimiento2);
  return Math.max(0, redondearMil(menor - retenciones));
}

function calcularProcedimientoPromedio(
  impuestoNeto: number,
  historial: HistorialInput,
  pct: number,
  fallback: number,
): number {
  if (historial.declaracionesPrevias < 1) {
    return fallback;
  }
  return ((impuestoNeto + historial.impuestoNetoAnioAnterior) / 2) * pct;
}
