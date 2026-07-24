import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoRentasPensiones } from '../modelo/resultado';
import type { RentasPensionesInput } from '../modelo/tipos';

/**
 * Cédula de rentas de pensiones (art. 337 E.T.). Exención del num. 5 art. 206
 * (mod. Ley 2277/2022): la parte de la mesada hasta 1.000 UVT/mes está exenta —
 * anualizada como 1.000 UVT × meses con mesada (mesadas uniformes; ver
 * normativa/ag2025/04-pensiones.md). NO consume el límite 40%/1.340 UVT, que es
 * exclusivo de la cédula general (art. 336).
 */
export function depurarPensiones(
  input: RentasPensionesInput | undefined,
  c: ConstantesAnio,
): ResultadoRentasPensiones {
  const ingresosBrutos = redondearMil(input?.ingresosBrutos ?? 0);
  const incrngo = Math.min(redondearMil(input?.aportesSaludYFsp ?? 0), ingresosBrutos);
  const rentaLiquida = ingresosBrutos - incrngo;
  const topeExento = redondearMil(c.pensiones.exencionMensualUvt * c.uvt * acotarMeses(input?.mesesConPension));
  const rentaExenta = Math.min(rentaLiquida, topeExento);
  return {
    ingresosBrutos,
    incrngo,
    rentaLiquida,
    rentaExenta,
    rentaLiquidaGravable: rentaLiquida - rentaExenta,
  };
}

function acotarMeses(meses: number | undefined): number {
  if (meses === undefined || !Number.isFinite(meses) || meses < 1) {
    return 12;
  }
  return Math.min(Math.trunc(meses), 12);
}
