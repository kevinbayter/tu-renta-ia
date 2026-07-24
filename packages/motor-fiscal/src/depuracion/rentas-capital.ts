import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { RentasCapitalInput } from '../modelo/tipos';

export interface DepuracionCapital {
  ingresosBrutos: number;
  incrngoComponenteInflacionario: number;
  rentaLiquida: number;
  deduccionGmf: number;
  solicitadoExentasYDeducciones: number;
}

export function depurarRentasCapital(input: RentasCapitalInput, c: ConstantesAnio): DepuracionCapital {
  const ingresosBrutos = redondearMil(input.rendimientosConComponente + input.rendimientosSinComponente);
  const incrngo = redondearMil(
    input.rendimientosConComponente * c.componenteInflacionario.porcentajeIngresos,
  );
  const rentaLiquida = ingresosBrutos - incrngo;
  const deduccionGmf = redondearMil(input.gmfPagado * c.gmf.porcentajeDeducible);
  return {
    ingresosBrutos,
    incrngoComponenteInflacionario: incrngo,
    rentaLiquida,
    deduccionGmf,
    solicitadoExentasYDeducciones: deduccionGmf,
  };
}
