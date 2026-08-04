import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoDescuentos } from '../modelo/resultado';
import type { DescuentosInput } from '../modelo/tipos';

/**
 * Descuentos tributarios (art. 257 E.T.): las donaciones a ESAL del régimen
 * especial dan un descuento del 25% de lo donado, limitado al 25% del impuesto
 * sobre la renta (art. 258). Requieren certificación del donatario (art. 125-3)
 * — normativa/ag2025/06-descuentos-y-comparacion.md.
 */
export function calcularDescuentos(
  input: DescuentosInput | undefined,
  impuestoSobreRentaLiquida: number,
  c: ConstantesAnio,
  descuentoDividendos = 0,
): ResultadoDescuentos {
  const donaciones = Math.max(0, input?.donacionesEsal ?? 0);
  const bruto = redondearMil(donaciones * c.descuentos.donacionesPorcentaje);
  const tope = redondearMil(impuestoSobreRentaLiquida * c.descuentos.limiteSobreImpuesto);
  const porDonaciones = Math.min(bruto, tope);
  // El 254-1 no está sujeto al tope del 258 (este solo cubre 255/256/257).
  const porDividendos = Math.max(0, descuentoDividendos);
  return {
    donacionesRealizadas: redondearMil(donaciones),
    porDonaciones,
    porDividendos,
    limiteAplicado: tope,
    total: porDonaciones + porDividendos,
  };
}
