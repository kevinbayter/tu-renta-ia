import type {
  ActivoPatrimonial,
  CertificadoLaboral,
  PerfilFiscal,
  RentasCapitalInput,
} from '@turenta/motor-fiscal';
import type {
  Certificado220Extraido,
  CertificadoBancarioExtraido,
} from '@turenta/shared';

import { comprasFacturaElectronicaConBeneficio, saldoAFavorAnterior } from '../exogena/interpretar';

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
  return {
    anioGravable: insumos.anioGravable,
    certificadosLaborales: insumos.certificados220.map(aCertificadoLaboral),
    rentasCapital: armarRentasCapital(insumos.certificadosBancarios, respuestas),
    deducciones: armarDeducciones(respuestas),
    comprasFacturaElectronica: comprasFacturaElectronicaConBeneficio(insumos.exogena),
    patrimonio: armarPatrimonio(insumos.certificadosBancarios, respuestas),
    historial: armarHistorial(insumos.exogena, respuestas),
  };
}

function aCertificadoLaboral(cert: Certificado220Extraido): CertificadoLaboral {
  return {
    nitEmpleador: cert.nitRetenedor,
    pagosLaborales: cert.totalIngresosBrutos - cert.cesantiasPagadas - cert.cesantiasConsignadas,
    cesantiasPagadas: cert.cesantiasPagadas,
    cesantiasConsignadas: cert.cesantiasConsignadas,
    aportesSalud: cert.aportesSalud,
    aportesPension: cert.aportesPension,
    retencionFuente: cert.retencionFuente,
    ingresoPromedioSeisMeses: cert.ingresoPromedioSeisMeses,
  };
}

function armarRentasCapital(
  bancarios: CertificadoBancarioExtraido[],
  r: RespuestasEntrevista,
): RentasCapitalInput {
  const rendimientosBancarios = bancarios.reduce((acc, b) => acc + b.rendimientos, 0);
  const retenciones = bancarios.reduce((acc, b) => acc + b.retencionFuente, 0);
  return {
    rendimientosConComponente: rendimientosBancarios + r.rendimientosAdicionalesConComponente,
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
  bancarios: CertificadoBancarioExtraido[],
  r: RespuestasEntrevista,
): PerfilFiscal['patrimonio'] {
  const saldosBancarios: ActivoPatrimonial[] = bancarios
    .filter((b) => b.saldoCuentas > 0)
    .map((b) => ({ descripcion: `Saldo ${b.entidad}`, valor: b.saldoCuentas }));
  return {
    activos: [...saldosBancarios, ...r.activosManuales],
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
