import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { HonorariosInput } from '../modelo/tipos';

/**
 * Subcédula de honorarios sin relación laboral (casillas 43-57 del 210).
 * Art. 336 num. 4: costos procedentes O renta exenta del 25% (206-10 vía
 * par. 5), nunca ambos. Respaldo: normativa/ag2025/12-honorarios-independientes.md.
 */

export type ModoHonorarios = 'costos' | 'renta_exenta_25';

export interface DepuracionHonorarios {
  ingresosBrutos: number;
  incrngo: number;
  costos: number;
  rentaLiquida: number;
  exenta25: number;
  solicitadoExentasYDeducciones: number;
  modo: ModoHonorarios;
}

const SIN_HONORARIOS: DepuracionHonorarios = {
  ingresosBrutos: 0,
  incrngo: 0,
  costos: 0,
  rentaLiquida: 0,
  exenta25: 0,
  solicitadoExentasYDeducciones: 0,
  modo: 'costos',
};

export function depurarHonorarios(
  entrada: HonorariosInput | undefined,
  modo: ModoHonorarios,
  exenta25YaUsada: number,
  c: ConstantesAnio,
): DepuracionHonorarios {
  if (!entrada || entrada.ingresos <= 0) {
    return SIN_HONORARIOS;
  }
  const ingresosBrutos = redondearMil(Math.max(0, entrada.ingresos));
  const incrngo = redondearMil(Math.max(0, entrada.aportesObligatorios));
  const costos = modo === 'costos' ? redondearMil(Math.max(0, entrada.costos)) : 0;
  const exenta25 = modo === 'renta_exenta_25' ? calcularExenta25(ingresosBrutos - incrngo, exenta25YaUsada, c) : 0;
  return {
    ingresosBrutos,
    incrngo,
    costos,
    rentaLiquida: ingresosBrutos - incrngo - costos,
    exenta25,
    solicitadoExentasYDeducciones: exenta25,
    modo,
  };
}

/** El tope de 790 UVT del 206-10 es de la exención completa: se comparte con el 25% del asalariado. */
function calcularExenta25(baseDepurada: number, yaUsada: number, c: ConstantesAnio): number {
  const exenta = Math.max(0, baseDepurada) * c.rentaExenta25.porcentaje;
  const topeRestante = Math.max(0, c.rentaExenta25.topeAnualUvt * c.uvt - yaUsada);
  return redondearMil(Math.min(exenta, topeRestante));
}
