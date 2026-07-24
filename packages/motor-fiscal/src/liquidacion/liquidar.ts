import { calcularAnticipo } from './anticipo';
import { impuestoTabla241 } from './tabla-241';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoLiquidacion } from '../modelo/resultado';
import type { HistorialInput } from '../modelo/tipos';

/**
 * Liquidación privada: impuesto por tabla, anticipo y saldo final.
 * Descuentos tributarios y ganancias ocasionales se incorporan en fases posteriores
 * (hoy: impuesto neto = impuesto por tabla; total a cargo = impuesto neto).
 */
export function liquidar(
  rentaLiquidaGravable: number,
  retenciones: number,
  historial: HistorialInput,
  c: ConstantesAnio,
): ResultadoLiquidacion {
  const impuestoSobreRentaLiquida = impuestoTabla241(rentaLiquidaGravable, c);
  const impuestoNetoRenta = impuestoSobreRentaLiquida;
  const totalImpuestoACargo = impuestoNetoRenta;
  const anticipoAnioSiguiente = calcularAnticipo(impuestoNetoRenta, retenciones, historial, c);
  const neto = calcularNeto(totalImpuestoACargo, anticipoAnioSiguiente, retenciones, historial);
  return {
    impuestoSobreRentaLiquida,
    impuestoNetoRenta,
    totalImpuestoACargo,
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
