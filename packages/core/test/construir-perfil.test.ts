import { describe, expect, it } from 'vitest';

import { liquidarDeclaracion } from '@turenta/motor-fiscal';

import { construirPerfilFiscal } from '../src/perfil/construir-perfil';

import type { ExogenaParseada } from '../src/exogena/tipos';
import type { InsumosPerfil } from '../src/perfil/construir-perfil';

/**
 * Golden-lite (CI-safe, sin LLM): simula las extracciones ya hechas de los
 * documentos reales del caso dorado y verifica que el ensamblaje del perfil
 * + motor reproduzcan el resultado de referencia. El E2E con LLM real vive en
 * packages/adaptadores/test/e2e/.
 */

const EXOGENA: ExogenaParseada = {
  anioGravable: 2025,
  topes: {
    ingresos: 114_456_920,
    patrimonio: 45_053_000,
    consumoTarjetas: 42_112_060,
    movimientos: 143_226_272,
    compras: 44_694_376,
  },
  filas: [
    {
      nitInformante: '1234567890',
      nombreInformante: 'RAMIREZ ANA',
      detalle: 'Total saldo a favor',
      valor: 1_793_000,
      usoSugerido: 'R131 Saldo a favor del año gravable anterior sin solicitud de devolución y/o compensación',
      infoAdicional: '',
    },
    {
      nitInformante: '800197268',
      nombreInformante: 'U.A.E. DIRECCION DE IMPUESTOS Y ADUANAS NACIONALES',
      detalle: 'Monto total de facturación electrónica susceptible de beneficio',
      valor: 39_680_528,
      usoSugerido: '',
      infoAdicional: '',
    },
  ],
};

const INSUMOS: InsumosPerfil = {
  anioGravable: 2025,
  exogena: EXOGENA,
  certificados220: [
    {
      tipoDocumento: 'certificado_220',
      nitRetenedor: '900111222',
      razonSocial: 'Comercial Andina SAS',
      anioGravable: 2025,
      periodoInicio: '',
      periodoFin: '',
      pagosSalarios: 52_926_000,
      pagosPrestaciones: 9_275_000,
      otrosPagos: 21_849_000,
      cesantiasPagadas: 5_535_000,
      cesantiasConsignadas: 6_156_000,
      totalIngresosBrutos: 95_741_000,
      aportesSalud: 2_126_000,
      aportesPension: 2_638_000,
      ingresoPromedioSeisMeses: 6_403_000,
      retencionFuente: 386_000,
    },
    {
      tipoDocumento: 'certificado_220',
      nitRetenedor: '900333444',
      razonSocial: 'Servicios Telecom SAS',
      anioGravable: 2025,
      periodoInicio: '',
      periodoFin: '',
      pagosSalarios: 15_770_000,
      pagosPrestaciones: 1_314_000,
      otrosPagos: 409_000,
      cesantiasPagadas: 0,
      cesantiasConsignadas: 0,
      totalIngresosBrutos: 17_493_000,
      aportesSalud: 631_000,
      aportesPension: 789_000,
      ingresoPromedioSeisMeses: 7_885_000,
      retencionFuente: 396_000,
    },
  ],
  certificadosBancarios: [
    {
      tipoDocumento: 'certificado_bancario',
      entidad: 'Banco Ejemplo',
      anioGravable: 2025,
      saldoCuentas: 20_902_486,
      rendimientos: 786_273,
      gmf: 2_018,
      retencionFuente: 42_540,
      componenteInflacionarioInformado: 435_831,
    },
  ],
  respuestas: {
    mesesConRelacionLaboral: 11,
    tieneDependiente387: true,
    dependientesAdicionales336: 1,
    pagosMedicinaPrepagadaConfirmados: 3_199_749,
    interesesVivienda: 0,
    interesesIcetex: 0,
    gmfTotalPagado: 34_913,
    rendimientosAdicionalesConComponente: 6_103,
    rendimientosSinComponente: 382_694,
    activosManuales: [
      { descripcion: 'Bienes personales', valor: 24_500_000 },
      { descripcion: 'Ejemplo Dos cuenta', valor: 6_909 },
      { descripcion: 'FIC Ejemplo Dos', valor: 15_205 },
      { descripcion: 'Fondo Uno (Fiduciaria Uno)', valor: 1_467_428 },
      { descripcion: 'Comisionista (Comisionista Ejemplo)', valor: 682_355 },
      { descripcion: 'CxC apartamento', valor: 20_900_000 },
      { descripcion: 'CxC saldo a favor DIAN', valor: 1_401_000 },
    ],
    deudas: 0,
    declaracionesPrevias: 2,
    impuestoNetoAnioAnterior: 0,
    anticipoLiquidadoAnioAnterior: 0,
  },
};

describe('construirPerfilFiscal — caso dorado desde extracciones', () => {
  const perfil = construirPerfilFiscal(INSUMOS);
  const resultado = liquidarDeclaracion(perfil);

  it('ensambla el perfil correctamente', () => {
    expect(perfil.certificadosLaborales).toHaveLength(2);
    expect(perfil.certificadosLaborales[0]?.pagosLaborales).toBe(84_050_000);
    expect(perfil.rentasCapital.rendimientosConComponente).toBe(792_376);
    expect(perfil.rentasCapital.rendimientosSinComponente).toBe(382_694);
    expect(perfil.comprasFacturaElectronica).toBe(39_680_528);
    expect(perfil.historial.saldoFavorAnioAnterior).toBe(1_793_000);
    expect(perfil.patrimonio.activos).toHaveLength(8);
  });

  it('reproduce el resultado de referencia end-to-end (sin LLM)', () => {
    expect(resultado.liquidacion.impuestoNetoRenta).toBe(1_217_000);
    expect(resultado.liquidacion.totalSaldoAFavor).toBe(1_401_000);
    expect(resultado.cedulaGeneral.rentaLiquidaGravable).toBe(60_689_000);
    expect(resultado.patrimonioBruto).toBe(69_875_000);
  });
});
