import { describe, expect, it } from 'vitest';

import { liquidarDeclaracion } from '../src/index';

import type { PerfilFiscal } from '../src/index';

/**
 * GOLDEN TEST — Caso dorado: declaración real AG2025 de Ana Ramírez elaborada con
 * referencia (2026-07-18). Fuente: docs/ y research/00-caso-dorado-ag2025.md.
 * Este test es SAGRADO: si un cambio del motor lo rompe, el motor está mal (o hay
 * una decisión normativa nueva que debe documentarse en normativa/ag2025/ primero).
 */

// Valores tomados de los documentos reales (sin redondear):
const PERFIL_DORADO: PerfilFiscal = {
  anioGravable: 2025,
  certificadosLaborales: [
    {
      // 220 Comercial Andina 01/01–09/09: brutos 95.741.000 (incluye cesantías 5.535.000 + 6.156.000)
      nitEmpleador: '900111222',
      pagosLaborales: 84_050_000,
      cesantiasPagadas: 5_535_000,
      cesantiasConsignadas: 6_156_000,
      aportesSalud: 2_126_000,
      aportesPension: 2_638_000,
      retencionFuente: 386_000,
      ingresoPromedioSeisMeses: 6_403_000,
    },
    {
      // 220 Servicios Telecom 04/11–31/12: brutos 17.493.000
      nitEmpleador: '900333444',
      pagosLaborales: 17_493_000,
      cesantiasPagadas: 0,
      cesantiasConsignadas: 0,
      aportesSalud: 631_000,
      aportesPension: 789_000,
      retencionFuente: 396_000,
      ingresoPromedioSeisMeses: 7_885_000,
    },
  ],
  rentasCapital: {
    // Nu 786.273 + FIC Ejemplo Dos 6.103 (base componente inflacionario)
    rendimientosConComponente: 792_376,
    // Rendimientos de cesantías Colfondos (sin componente inflacionario)
    rendimientosSinComponente: 382_694,
    gmfPagado: 34_913,
    retencionFuente: 42_541,
  },
  deducciones: {
    mesesConRelacionLaboral: 11,
    tieneDependiente387: true,
    dependientesAdicionales336: 1,
    pagosMedicinaPrepagada: 3_199_749,
    interesesVivienda: 0,
    interesesIcetex: 0,
  },
  comprasFacturaElectronica: 39_680_528,
  patrimonio: {
    activos: [
      { descripcion: 'Bienes personales', valor: 24_500_000 },
      { descripcion: 'Ejemplo Dos cuenta', valor: 6_909 },
      { descripcion: 'Nu cuenta ahorros', valor: 20_902_486 },
      { descripcion: 'FIC Ejemplo Dos', valor: 15_205 },
      { descripcion: 'Fondo Uno (Fiduciaria Uno)', valor: 1_467_428 },
      { descripcion: 'Comisionista (Comisionista Ejemplo)', valor: 682_355 },
      { descripcion: 'CxC apartamento', valor: 20_900_000 },
      { descripcion: 'CxC saldo a favor DIAN', valor: 1_401_000 },
    ],
    deudas: 0,
  },
  historial: {
    declaracionesPrevias: 2,
    impuestoNetoAnioAnterior: 0,
    saldoFavorAnioAnterior: 1_793_000,
    anticipoLiquidadoAnioAnterior: 0,
  },
};

describe('caso dorado — referencia AG2025 Ana Ramírez', () => {
  const resultado = liquidarDeclaracion(PERFIL_DORADO);

  it('reproduce los 4 resultados principales', () => {
    expect(resultado.liquidacion.impuestoNetoRenta).toBe(1_217_000);
    expect(resultado.liquidacion.totalSaldoAFavor).toBe(1_401_000);
    expect(resultado.liquidacion.saldoAPagar).toBe(0);
    expect(resultado.cedulaGeneral.rentaLiquidaGravable).toBe(60_689_000);
  });

  it('reproduce la depuración de rentas de trabajo', () => {
    const t = resultado.cedulaGeneral.trabajo;
    expect(t.ingresosBrutos).toBe(113_234_000);
    expect(t.incrngo).toBe(6_184_000);
    expect(t.rentaLiquida).toBe(107_050_000);
    expect(t.deduccionDependientes).toBe(11_323_000);
    expect(t.deduccionPrepagada).toBe(3_200_000);
    expect(t.totalDeduccionesImputables).toBe(14_523_000);
    expect(t.cesantiasExentas).toBe(11_691_000);
    expect(t.exenta25).toBe(20_209_000);
    expect(t.totalRentasExentas).toBe(31_900_000);
    expect(t.solicitadoExentasYDeducciones).toBe(46_423_000);
    expect(t.asignadoLimitado).toBe(43_114_000);
    expect(t.rentaLiquidaOrdinaria).toBe(63_936_000);
  });

  it('reproduce la depuración de rentas de capital', () => {
    const k = resultado.cedulaGeneral.capital;
    expect(k.ingresosBrutos).toBe(1_175_000);
    expect(k.incrngoComponenteInflacionario).toBe(439_000);
    expect(k.rentaLiquida).toBe(736_000);
    expect(k.deduccionGmf).toBe(17_000);
    expect(k.asignadoLimitado).toBe(0);
    expect(k.rentaLiquidaOrdinaria).toBe(736_000);
  });

  it('reproduce el límite global y los beneficios fuera del límite', () => {
    const g = resultado.cedulaGeneral;
    expect(g.limiteGlobal).toBe(43_114_000);
    expect(g.deduccionFacturaElectronica).toBe(397_000);
    expect(g.deduccionDependientesAdicionales).toBe(3_586_000);
    expect(g.totalExentasYDeduccionesConFueraDeLimite).toBe(47_097_000);
    expect(g.rentaLiquidaCedula).toBe(107_786_000);
  });

  it('reproduce patrimonio, retenciones y anticipo', () => {
    expect(resultado.patrimonioBruto).toBe(69_875_000);
    expect(resultado.deudas).toBe(0);
    expect(resultado.patrimonioLiquido).toBe(69_875_000);
    expect(resultado.liquidacion.retenciones).toBe(825_000);
    expect(resultado.liquidacion.anticipoAnioSiguiente).toBe(0);
  });

  it('reproduce las casillas del borrador 210 de referencia', () => {
    const c = resultado.casillas;
    expect(c['28']).toBe(397_000);
    expect(c['29']).toBe(69_875_000);
    expect(c['30']).toBe(0);
    expect(c['31']).toBe(69_875_000);
    expect(c['32']).toBe(113_234_000);
    expect(c['33']).toBe(6_184_000);
    expect(c['34']).toBe(107_050_000);
    expect(c['36']).toBe(31_900_000);
    expect(c['37']).toBe(31_900_000);
    expect(c['39']).toBe(14_523_000);
    expect(c['40']).toBe(14_523_000);
    expect(c['41']).toBe(43_114_000);
    expect(c['42']).toBe(63_936_000);
    expect(c['58']).toBe(1_175_000);
    expect(c['59']).toBe(439_000);
    expect(c['61']).toBe(736_000);
    expect(c['67']).toBe(17_000);
    expect(c['68']).toBe(17_000);
    expect(c['69']).toBe(0);
    expect(c['70']).toBe(736_000);
    expect(c['73']).toBe(736_000);
    expect(c['91']).toBe(107_786_000);
    expect(c['92']).toBe(47_097_000);
    expect(c['93']).toBe(60_689_000);
    expect(c['97']).toBe(60_689_000);
    expect(c['116']).toBe(1_217_000);
    expect(c['121']).toBe(1_217_000);
    expect(c['126']).toBe(1_217_000);
    expect(c['127']).toBe(0);
    expect(c['129']).toBe(1_217_000);
    expect(c['130']).toBe(0);
    expect(c['131']).toBe(1_793_000);
    expect(c['132']).toBe(825_000);
    expect(c['133']).toBe(0);
    expect(c['134']).toBe(0);
    expect(c['136']).toBe(0);
    expect(c['137']).toBe(1_401_000);
    expect(c['138']).toBe(1);
    expect(c['139']).toBe(3_586_000);
  });
});
