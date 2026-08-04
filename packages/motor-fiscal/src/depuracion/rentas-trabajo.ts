import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { AportesVoluntariosInput, CertificadoLaboral, DeduccionesInput } from '../modelo/tipos';

export interface DepuracionTrabajo {
  ingresosBrutos: number;
  incrngo: number;
  /** Parte del INCRNGO que viene de la cotización voluntaria al RAIS (art. 55). */
  incrngoAporteVoluntarioRais: number;
  rentaLiquida: number;
  deduccionDependientes: number;
  deduccionPrepagada: number;
  deduccionIntereses: number;
  totalDeduccionesImputables: number;
  cesantiasExentas: number;
  afcExenta: number;
  exenta25: number;
  totalRentasExentas: number;
  solicitadoExentasYDeducciones: number;
}

export function depurarRentasTrabajo(
  certificados: CertificadoLaboral[],
  deducciones: DeduccionesInput,
  c: ConstantesAnio,
  aportes?: AportesVoluntariosInput,
): DepuracionTrabajo {
  const ingresosBrutos = redondearMil(sumarIngresos(certificados));
  const incrngoAporteVoluntarioRais = calcularIncrngoVoluntarioRais(ingresosBrutos, aportes, c);
  const incrngo = redondearMil(sumarAportesObligatorios(certificados)) + incrngoAporteVoluntarioRais;
  const rentaLiquida = ingresosBrutos - incrngo;
  const imputables = calcularDeduccionesImputables(ingresosBrutos, deducciones, c);
  const baseExentas = rentaLiquida - imputables.totalDeduccionesImputables;
  const exentas = calcularRentasExentas(certificados, baseExentas, ingresosBrutos, aportes, c);
  return {
    ingresosBrutos,
    incrngo,
    incrngoAporteVoluntarioRais,
    rentaLiquida,
    ...imputables,
    ...exentas,
    solicitadoExentasYDeducciones: imputables.totalDeduccionesImputables + exentas.totalRentasExentas,
  };
}

/** Art. 55: cotización voluntaria al RAIS como INCRNGO — min(aporte, 25% del ingreso, 2.500 UVT). */
function calcularIncrngoVoluntarioRais(
  ingresosBrutos: number,
  aportes: AportesVoluntariosInput | undefined,
  c: ConstantesAnio,
): number {
  const aporte = Math.max(0, aportes?.voluntarioPensionObligatoria ?? 0);
  const tope = Math.min(
    ingresosBrutos * c.aporteVoluntarioRais.porcentaje,
    c.aporteVoluntarioRais.topeAnualUvt * c.uvt,
  );
  return redondearMil(Math.min(aporte, tope));
}

/** Arts. 126-1/126-4: AFC + pensión voluntaria — min(aportes, 30% del ingreso, 3.800 UVT). */
function calcularAfcExenta(
  ingresosBrutos: number,
  aportes: AportesVoluntariosInput | undefined,
  c: ConstantesAnio,
): number {
  const aporte = Math.max(0, aportes?.afcYPensionVoluntaria ?? 0);
  const tope = Math.min(ingresosBrutos * c.afcFvp.porcentaje, c.afcFvp.topeAnualUvt * c.uvt);
  return redondearMil(Math.min(aporte, tope));
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
  afcExenta: number;
  exenta25: number;
  totalRentasExentas: number;
}

/** El 25% (206-10) se calcula después de restar INCRNGO, deducciones y las DEMÁS exentas. */
function calcularRentasExentas(
  certificados: CertificadoLaboral[],
  baseDisponible: number,
  ingresosBrutos: number,
  aportes: AportesVoluntariosInput | undefined,
  c: ConstantesAnio,
): RentasExentas {
  const cesantiasExentas = calcularCesantiasExentas(certificados, c);
  const afcExenta = calcularAfcExenta(ingresosBrutos, aportes, c);
  const exenta25 = calcularExenta25(baseDisponible - cesantiasExentas - afcExenta, c);
  return {
    cesantiasExentas,
    afcExenta,
    exenta25,
    totalRentasExentas: cesantiasExentas + afcExenta + exenta25,
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
