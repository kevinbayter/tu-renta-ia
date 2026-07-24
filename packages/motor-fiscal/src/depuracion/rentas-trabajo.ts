import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { CertificadoLaboral, DeduccionesInput } from '../modelo/tipos';

export interface DepuracionTrabajo {
  ingresosBrutos: number;
  incrngo: number;
  rentaLiquida: number;
  deduccionDependientes: number;
  deduccionPrepagada: number;
  deduccionIntereses: number;
  totalDeduccionesImputables: number;
  cesantiasExentas: number;
  exenta25: number;
  totalRentasExentas: number;
  solicitadoExentasYDeducciones: number;
}

export function depurarRentasTrabajo(
  certificados: CertificadoLaboral[],
  deducciones: DeduccionesInput,
  c: ConstantesAnio,
): DepuracionTrabajo {
  const ingresosBrutos = redondearMil(sumarIngresos(certificados));
  const incrngo = redondearMil(sumarAportesObligatorios(certificados));
  const rentaLiquida = ingresosBrutos - incrngo;
  const imputables = calcularDeduccionesImputables(ingresosBrutos, deducciones, c);
  const baseExentas = rentaLiquida - imputables.totalDeduccionesImputables;
  const exentas = calcularRentasExentas(certificados, baseExentas, c);
  return {
    ingresosBrutos,
    incrngo,
    rentaLiquida,
    ...imputables,
    ...exentas,
    solicitadoExentasYDeducciones: imputables.totalDeduccionesImputables + exentas.totalRentasExentas,
  };
}

interface DeduccionesImputables {
  deduccionDependientes: number;
  deduccionPrepagada: number;
  deduccionIntereses: number;
  totalDeduccionesImputables: number;
}

function calcularDeduccionesImputables(
  ingresosBrutos: number,
  deducciones: DeduccionesInput,
  c: ConstantesAnio,
): DeduccionesImputables {
  const deduccionDependientes = calcularDeduccionDependientes387(ingresosBrutos, deducciones, c);
  const deduccionPrepagada = calcularDeduccionPrepagada(deducciones, c);
  const deduccionIntereses = calcularDeduccionIntereses(deducciones, c);
  return {
    deduccionDependientes,
    deduccionPrepagada,
    deduccionIntereses,
    totalDeduccionesImputables: deduccionDependientes + deduccionPrepagada + deduccionIntereses,
  };
}

interface RentasExentas {
  cesantiasExentas: number;
  exenta25: number;
  totalRentasExentas: number;
}

function calcularRentasExentas(
  certificados: CertificadoLaboral[],
  baseDisponible: number,
  c: ConstantesAnio,
): RentasExentas {
  const cesantiasExentas = calcularCesantiasExentas(certificados, c);
  const exenta25 = calcularExenta25(baseDisponible - cesantiasExentas, c);
  return {
    cesantiasExentas,
    exenta25,
    totalRentasExentas: cesantiasExentas + exenta25,
  };
}

function sumarIngresos(certificados: CertificadoLaboral[]): number {
  return certificados.reduce(
    (acc, x) => acc + x.pagosLaborales + x.cesantiasPagadas + x.cesantiasConsignadas,
    0,
  );
}

function sumarAportesObligatorios(certificados: CertificadoLaboral[]): number {
  return certificados.reduce((acc, x) => acc + x.aportesSalud + x.aportesPension, 0);
}

function calcularDeduccionDependientes387(
  ingresosBrutos: number,
  d: DeduccionesInput,
  c: ConstantesAnio,
): number {
  if (!d.tieneDependiente387) {
    return 0;
  }
  const tope = c.dependientes387.topeMensualUvt * c.uvt * d.mesesConRelacionLaboral;
  return redondearMil(Math.min(ingresosBrutos * c.dependientes387.porcentaje, tope));
}

function calcularDeduccionPrepagada(d: DeduccionesInput, c: ConstantesAnio): number {
  const topeAnual = c.medicinaPrepagada.topeMensualUvt * c.uvt * 12;
  return redondearMil(Math.min(d.pagosMedicinaPrepagada, topeAnual));
}

function calcularDeduccionIntereses(d: DeduccionesInput, c: ConstantesAnio): number {
  const vivienda = Math.min(d.interesesVivienda, c.interesesVivienda.topeAnualUvt * c.uvt);
  const icetex = Math.min(d.interesesIcetex, c.interesesIcetex.topeAnualUvt * c.uvt);
  return redondearMil(vivienda + icetex);
}

export function porcentajeCesantiasExentas(promedioMensual: number, c: ConstantesAnio): number {
  const promedioUvt = promedioMensual / c.uvt;
  const tramo = c.tablaCesantias.find((t) => promedioUvt <= t.hastaUvt);
  if (!tramo) {
    throw new Error('Tabla de cesantías sin tramo aplicable: constantes mal configuradas');
  }
  return tramo.porcentajeExento;
}

function calcularCesantiasExentas(certificados: CertificadoLaboral[], c: ConstantesAnio): number {
  const total = certificados.reduce((acc, cert) => {
    const pct = porcentajeCesantiasExentas(cert.ingresoPromedioSeisMeses, c);
    return acc + (cert.cesantiasPagadas + cert.cesantiasConsignadas) * pct;
  }, 0);
  return redondearMil(total);
}

function calcularExenta25(baseDepurada: number, c: ConstantesAnio): number {
  const exenta = Math.max(0, baseDepurada) * c.rentaExenta25.porcentaje;
  const tope = c.rentaExenta25.topeAnualUvt * c.uvt;
  return redondearMil(Math.min(exenta, tope));
}
