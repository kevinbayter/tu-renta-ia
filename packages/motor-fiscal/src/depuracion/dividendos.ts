import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoDividendos } from '../modelo/resultado';
import type { DividendosInput } from '../modelo/tipos';

/**
 * Cédula de dividendos de residentes (arts. 242 y 254-1, Ley 2277/2022).
 * Respaldo: normativa/ag2025/10-dividendos.md.
 * 1ª subcédula (no gravados): a la base de la tabla 241 con descuento del 19%
 * sobre el exceso de 1.090 UVT (lectura conservadora: solo sobre esta subcédula).
 * 2ª subcédula (gravados): 35% primero y el neto también va a la tabla.
 */

const SIN_DIVIDENDOS: ResultadoDividendos = {
  noGravados: 0,
  gravados: 0,
  impuestoGravados35: 0,
  netoGravadosATabla: 0,
  baseParaTabla: 0,
  descuento: 0,
  retencionFuente: 0,
};

export function depurarDividendos(
  entrada: DividendosInput | undefined,
  c: ConstantesAnio,
): ResultadoDividendos {
  if (!entrada) {
    return SIN_DIVIDENDOS;
  }
  const noGravados = redondearMil(Math.max(0, entrada.noGravados));
  const gravados = redondearMil(Math.max(0, entrada.gravados));
  const impuestoGravados35 = redondearMil(gravados * c.dividendos.tarifaGravados);
  const netoGravadosATabla = gravados - impuestoGravados35;
  return {
    noGravados,
    gravados,
    impuestoGravados35,
    netoGravadosATabla,
    baseParaTabla: noGravados + netoGravadosATabla,
    descuento: calcularDescuento254(noGravados, c),
    retencionFuente: redondearMil(Math.max(0, entrada.retencionFuente)),
  };
}

/** Art. 254-1: 0% hasta 1.090 UVT; 19% marginal sobre el exceso. */
function calcularDescuento254(noGravados: number, c: ConstantesAnio): number {
  const umbral = c.dividendos.descuentoUmbralUvt * c.uvt;
  return redondearMil(Math.max(0, noGravados - umbral) * c.dividendos.descuentoPorcentaje);
}
