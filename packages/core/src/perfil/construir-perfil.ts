import type {
  ActivoPatrimonial,
  CertificadoLaboral,
  ComparacionPatrimonialInput,
  PerfilFiscal,
  RentasCapitalInput,
  RentasPensionesInput,
} from '@turenta/motor-fiscal';
import type {
  Certificado220Extraido,
  CertificadoBancarioExtraido,
} from '@turenta/shared';

import {
  coincideEntidad,
  rendimientosBancariosSinCertificado,
  saldosBancariosSinCertificado,
} from '../exogena/bancos-sin-certificado';
import { comprasFacturaElectronicaConBeneficio, saldoAFavorAnterior } from '../exogena/interpretar';
import { pensionesSinCertificado } from '../exogena/pensiones-sin-certificado';

import type { RespuestasEntrevista } from './respuestas';
import type { ExogenaParseada } from '../exogena/tipos';

export interface InsumosPerfil {
  anioGravable: number;
  exogena: ExogenaParseada;
  certificados220: Certificado220Extraido[];
  certificadosBancarios: CertificadoBancarioExtraido[];
  respuestas: RespuestasEntrevista;
}

/**
 * Ensambla el PerfilFiscal para el motor: certificados = fuente de verdad de
 * ingresos/retenciones; exógena = saldos históricos, compras FE y checklist;
 * respuestas = lo que solo el usuario sabe.
 */
export function construirPerfilFiscal(insumos: InsumosPerfil): PerfilFiscal {
  const { respuestas } = insumos;
  const laborales = insumos.certificados220.filter((c) => !esCertificadoSoloPension(c));
  return {
    anioGravable: insumos.anioGravable,
    certificadosLaborales: laborales.map(aCertificadoLaboral),
    rentasCapital: armarRentasCapital(insumos.exogena, insumos.certificadosBancarios, respuestas),
    rentasNoLaborales: {
      ingresosBrutos: respuestas.ingresosNoLaborales ?? 0,
      costosYGastos: respuestas.costosNoLaborales ?? 0,
      retencionFuente: 0,
    },
    rentasPensiones: armarPensiones(insumos.exogena, insumos.certificados220, respuestas),
    deducciones: armarDeducciones(respuestas),
    comprasFacturaElectronica: comprasFacturaElectronicaConBeneficio(insumos.exogena),
    patrimonio: armarPatrimonio(insumos.exogena, insumos.certificadosBancarios, respuestas),
    descuentos: { donacionesEsal: respuestas.donacionesEsal ?? 0 },
    comparacionPatrimonial: armarComparacion(respuestas),
    historial: armarHistorial(insumos.exogena, respuestas),
  };
}

/** Datos del art. 236: el impuesto pagado en el año es el neto de la declaración anterior. */
function armarComparacion(r: RespuestasEntrevista): ComparacionPatrimonialInput {
  return {
    patrimonioLiquidoAnterior: r.patrimonioLiquidoAnterior ?? 0,
    gananciaOcasionalNeta: 0,
    impuestosPagadosEnElAnio: r.impuestoNetoAnioAnterior,
    justificacionesDeclaradas: r.justificacionesPatrimoniales ?? 0,
  };
}

/** Un 220 de fondo de pensiones (solo mesada, sin salarios) no entra a rentas de trabajo. */
function esCertificadoSoloPension(cert: Certificado220Extraido): boolean {
  return (cert.pagosPension ?? 0) > 0 && cert.pagosSalarios === 0;
}

function aCertificadoLaboral(cert: Certificado220Extraido): CertificadoLaboral {
  const pension = cert.pagosPension ?? 0;
  return {
    nitEmpleador: cert.nitRetenedor,
    pagosLaborales: cert.totalIngresosBrutos - cert.cesantiasPagadas - cert.cesantiasConsignadas - pension,
    cesantiasPagadas: cert.cesantiasPagadas,
    cesantiasConsignadas: cert.cesantiasConsignadas,
    aportesSalud: cert.aportesSalud,
    aportesPension: cert.aportesPension,
    retencionFuente: cert.retencionFuente,
    ingresoPromedioSeisMeses: cert.ingresoPromedioSeisMeses,
  };
}

/**
 * Cédula de pensiones: certificados 220 de fondos pensionales + fallback desde
 * la exógena para fondos sin certificado (sin doble conteo). El INCRNGO y la
 * retención de un 220 mixto (salario + pensión) se asignan a rentas de trabajo.
 */
function armarPensiones(
  exogena: ExogenaParseada,
  certificados: Certificado220Extraido[],
  r: RespuestasEntrevista,
): RentasPensionesInput {
  const conPension = certificados.filter((c) => (c.pagosPension ?? 0) > 0);
  const soloPension = conPension.filter((c) => esCertificadoSoloPension(c));
  const deExogena = pensionesSinCertificado(exogena, conPension.map((c) => c.razonSocial));
  return {
    ingresosBrutos: sumar(conPension, (c) => c.pagosPension ?? 0) + deExogena.ingresosBrutos,
    aportesSaludYFsp: sumar(soloPension, (c) => c.aportesSalud) + deExogena.aportesSalud,
    retencionFuente: sumar(soloPension, (c) => c.retencionFuente) + deExogena.retencionFuente,
    mesesConPension: r.mesesConPension ?? 12,
  };
}

function sumar<T>(lista: T[], valor: (x: T) => number): number {
  return lista.reduce((acc, x) => acc + valor(x), 0);
}

function armarRentasCapital(
  exogena: ExogenaParseada,
  bancarios: CertificadoBancarioExtraido[],
  r: RespuestasEntrevista,
): RentasCapitalInput {
  const rendimientosBancarios = bancarios.reduce((acc, b) => acc + b.rendimientos, 0);
  const retenciones = bancarios.reduce((acc, b) => acc + b.retencionFuente, 0);
  const sinCertificado = rendimientosBancariosSinCertificado(exogena, bancarios.map((b) => b.entidad));
  return {
    rendimientosConComponente: rendimientosBancarios + sinCertificado + r.rendimientosAdicionalesConComponente,
    rendimientosSinComponente: r.rendimientosSinComponente,
    gmfPagado: r.gmfTotalPagado,
    retencionFuente: retenciones,
  };
}

function armarDeducciones(r: RespuestasEntrevista): PerfilFiscal['deducciones'] {
  return {
    mesesConRelacionLaboral: r.mesesConRelacionLaboral,
    tieneDependiente387: r.tieneDependiente387,
    dependientesAdicionales336: r.dependientesAdicionales336,
    pagosMedicinaPrepagada: r.pagosMedicinaPrepagadaConfirmados,
    interesesVivienda: r.interesesVivienda,
    interesesIcetex: r.interesesIcetex,
  };
}

function armarPatrimonio(
  exogena: ExogenaParseada,
  bancarios: CertificadoBancarioExtraido[],
  r: RespuestasEntrevista,
): PerfilFiscal['patrimonio'] {
  const saldosBancarios: ActivoPatrimonial[] = bancarios
    .filter((b) => b.saldoCuentas > 0)
    .map((b) => ({ descripcion: `Saldo ${b.entidad}`, valor: b.saldoCuentas }));
  // Sin doble conteo: si el usuario ya registró ese banco como activo manual, manda el manual.
  const sinCertificado = saldosBancariosSinCertificado(exogena, bancarios.map((b) => b.entidad))
    .filter((saldo) => !r.activosManuales.some((activo) => coincideEntidad(activo.descripcion, saldo.entidad)))
    .map(({ descripcion, valor }) => ({ descripcion, valor }));
  return {
    activos: [...saldosBancarios, ...sinCertificado, ...r.activosManuales],
    deudas: r.deudas,
  };
}

function armarHistorial(
  exogena: ExogenaParseada,
  r: RespuestasEntrevista,
): PerfilFiscal['historial'] {
  return {
    declaracionesPrevias: r.declaracionesPrevias,
    impuestoNetoAnioAnterior: r.impuestoNetoAnioAnterior,
    saldoFavorAnioAnterior: saldoAFavorAnterior(exogena),
    anticipoLiquidadoAnioAnterior: r.anticipoLiquidadoAnioAnterior,
  };
}
