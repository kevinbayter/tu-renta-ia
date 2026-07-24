import { redondearMil } from '../redondeo';

import type { ResultadoRentasNoLaborales } from '../modelo/resultado';
import type { RentasNoLaboralesInput } from '../modelo/tipos';

/**
 * Rentas no laborales de la cédula general (arts. 335-336 E.T.): arriendos vía
 * mandato, honorarios sin vínculo, etc. Renta líquida = ingresos − costos y
 * gastos procedentes (num. 4 art. 336). Los costos se acotan a los ingresos:
 * pérdidas y compensaciones cedulares (arts. 330-331) están fuera de alcance
 * (normativa/ag2025/05-no-laborales.md).
 */
export function depurarNoLaborales(
  input: RentasNoLaboralesInput | undefined,
): Omit<ResultadoRentasNoLaborales, 'asignadoLimitado' | 'rentaLiquidaOrdinaria'> {
  const ingresosBrutos = redondearMil(input?.ingresosBrutos ?? 0);
  const costosYGastos = Math.min(redondearMil(input?.costosYGastos ?? 0), ingresosBrutos);
  return {
    ingresosBrutos,
    costosYGastos,
    rentaLiquida: ingresosBrutos - costosYGastos,
  };
}
