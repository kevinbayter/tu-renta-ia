import { calcularAnticipo } from './anticipo';
import { calcularDescuentos } from './descuentos';
import { impuestoTabla241 } from './tabla-241';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoLiquidacion } from '../modelo/resultado';
import type { DescuentosInput, HistorialInput } from '../modelo/tipos';

/**
 * Liquidación privada: impuesto por tabla, descuentos tributarios (art. 257
 * con el tope del 258), anticipo y saldo final. Las ganancias ocasionales
 * quedan fuera de alcance y documentadas como tal.
 */
export function liquidar(
  rentaLiquidaGravable: number,
  retenciones: number,
  historial: HistorialInput,
  c: ConstantesAnio,
  descuentosInput?: DescuentosInput,
): ResultadoLiquidacion {
  const impuestoSobreRentaLiquida = impuestoTabla241(rentaLiquidaGravable, c);
  const descuentos = calcularDescuentos(descuentosInput, impuestoSobreRentaLiquida, c);
  const impuestoNetoRenta = Math.max(0, impuestoSobreRentaLiquida - descuentos.total);
  const anticipoAnioSiguiente = calcularAnticipo(impuestoNetoRenta, retenciones, historial, c);
  const neto = calcularNeto(impuestoNetoRenta, anticipoAnioSiguiente, retenciones, historial);
  return {
    impuestoSobreRentaLiquida,
    descuentos,
    impuestoNetoRenta,
    totalImpuestoACargo: impuestoNetoRenta,
    anticipoAnioSiguiente,
    retenciones,
    saldoFavorAnterior: historial.saldoFavorAnioAnterior,
    anticipoLiquidadoAnterior: historial.anticipoLiquidadoAnioAnterior,
    saldoAPagar: Math.max(0, neto),
    totalSaldoAFavor: Math.max(0, -neto),
  };
}

function calcularNeto(
  totalImpuestoACargo: number,
  anticipoAnioSiguiente: number,
  retenciones: number,
  historial: HistorialInput,
): number {
  return (
    totalImpuestoACargo -
    historial.anticipoLiquidadoAnioAnterior -
    historial.saldoFavorAnioAnterior -
    retenciones +
    anticipoAnioSiguiente
  );
}
