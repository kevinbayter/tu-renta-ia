import { calcularAnticipo } from './anticipo';
import { calcularDescuentos } from './descuentos';
import { impuestoTabla241 } from './tabla-241';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoLiquidacion } from '../modelo/resultado';
import type { DescuentosInput, HistorialInput } from '../modelo/tipos';

/**
 * Liquidación privada: impuesto por tabla, descuentos tributarios (art. 257
 * con el tope del 258), impuesto de ganancias ocasionales, anticipo y saldo.
 * El anticipo (arts. 807-809) se calcula sobre el impuesto neto de RENTA,
 * sin incluir el de ganancias ocasionales.
 */
export function liquidar(
  rentaLiquidaGravable: number,
  retenciones: number,
  historial: HistorialInput,
  c: ConstantesAnio,
  descuentosInput?: DescuentosInput,
  impuestoGananciasOcasionales = 0,
): ResultadoLiquidacion {
  const impuestoSobreRentaLiquida = impuestoTabla241(rentaLiquidaGravable, c);
  const descuentos = calcularDescuentos(descuentosInput, impuestoSobreRentaLiquida, c);
  const impuestoNetoRenta = Math.max(0, impuestoSobreRentaLiquida - descuentos.total);
  const totalImpuestoACargo = impuestoNetoRenta + impuestoGananciasOcasionales;
  const anticipoAnioSiguiente = calcularAnticipo(impuestoNetoRenta, retenciones, historial, c);
  const neto = calcularNeto(totalImpuestoACargo, anticipoAnioSiguiente, retenciones, historial);
  return conSaldos(
    { impuestoSobreRentaLiquida, descuentos, impuestoNetoRenta, impuestoGananciasOcasionales, totalImpuestoACargo, anticipoAnioSiguiente, retenciones },
    neto,
    historial,
  );
}

function conSaldos(
  parcial: Omit<ResultadoLiquidacion, 'saldoFavorAnterior' | 'anticipoLiquidadoAnterior' | 'saldoAPagar' | 'totalSaldoAFavor'>,
  neto: number,
  historial: HistorialInput,
): ResultadoLiquidacion {
  return {
    ...parcial,
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
