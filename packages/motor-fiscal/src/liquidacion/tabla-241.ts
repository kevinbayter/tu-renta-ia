import { pisoMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';

/**
 * Impuesto sobre la renta líquida gravable según la tabla del art. 241 E.T.
 * Se liquida en UVT y se lleva a pesos con piso al múltiplo de mil
 * (comportamiento calibrado contra el caso dorado de referencia AG2025).
 */
export function impuestoTabla241(baseGravable: number, c: ConstantesAnio): number {
  if (baseGravable <= 0) {
    return 0;
  }
  const baseUvt = baseGravable / c.uvt;
  const rango = c.tabla241.find((r) => baseUvt <= r.hastaUvt);
  if (!rango) {
    throw new Error('Tabla art. 241 sin rango aplicable: constantes mal configuradas');
  }
  const impuestoUvt = (baseUvt - rango.desdeUvt) * rango.tarifa + rango.sumarUvt;
  return pisoMil(impuestoUvt * c.uvt);
}
