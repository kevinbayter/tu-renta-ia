import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { RentasCapitalInput } from '../modelo/tipos';

export interface DepuracionCapital {
  ingresosBrutos: number;
  incrngoComponenteInflacionario: number;
  costosYGastos: number;
  rentaLiquida: number;
  deduccionGmf: number;
  solicitadoExentasYDeducciones: number;
}

/**
 * Rendimientos financieros + arrendamientos (art. 335-2). Los costos del arriendo
 * se acotan a su ingreso: pérdidas de capital y su compensación (arts. 330-331)
 * están fuera de alcance, igual que en no laborales.
 */
export function depurarRentasCapital(input: RentasCapitalInput, c: ConstantesAnio): DepuracionCapital {
  const arriendos = input.arrendamientos?.ingresosBrutos ?? 0;
  const ingresosBrutos = redondearMil(input.rendimientosConComponente + input.rendimientosSinComponente + arriendos);
  const incrngo = redondearMil(
    input.rendimientosConComponente * c.componenteInflacionario.porcentajeIngresos,
  );
  const costosYGastos = Math.min(redondearMil(input.arrendamientos?.costosYGastos ?? 0), redondearMil(arriendos));
  const deduccionGmf = redondearMil(input.gmfPagado * c.gmf.porcentajeDeducible);
  return {
    ingresosBrutos,
    incrngoComponenteInflacionario: incrngo,
    costosYGastos,
    rentaLiquida: ingresosBrutos - incrngo - costosYGastos,
    deduccionGmf,
    solicitadoExentasYDeducciones: deduccionGmf,
  };
}
