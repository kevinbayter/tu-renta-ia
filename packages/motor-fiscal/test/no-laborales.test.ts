import { describe, expect, it } from 'vitest';

import { depurarNoLaborales } from '../src/depuracion/no-laborales';
import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal } from '../src/modelo/tipos';

function perfilConNoLaborales(ajustes: Partial<PerfilFiscal> = {}): PerfilFiscal {
  return {
    anioGravable: 2025,
    certificadosLaborales: [],
    rentasCapital: { rendimientosConComponente: 0, rendimientosSinComponente: 0, gmfPagado: 0, retencionFuente: 0 },
    deducciones: {
      mesesConRelacionLaboral: 12,
      tieneDependiente387: false,
      dependientesAdicionales336: 0,
      pagosMedicinaPrepagada: 0,
      interesesVivienda: 0,
      interesesIcetex: 0,
    },
    comprasFacturaElectronica: 0,
    patrimonio: { activos: [], deudas: 0 },
    historial: { declaracionesPrevias: 0, impuestoNetoAnioAnterior: 0, saldoFavorAnioAnterior: 0, anticipoLiquidadoAnioAnterior: 0 },
    ...ajustes,
  };
}

describe('depurarNoLaborales — arts. 335-336 E.T.', () => {
  it('sin ingresos: todo en ceros', () => {
    expect(depurarNoLaborales(undefined)).toEqual({ ingresosBrutos: 0, costosYGastos: 0, rentaLiquida: 0 });
  });

  it('arriendo vía mandato con costos procedentes', () => {
    const r = depurarNoLaborales({ ingresosBrutos: 16_180_000, costosYGastos: 2_500_000, retencionFuente: 0 });
    expect(r.rentaLiquida).toBe(13_680_000);
  });

  it('los costos no pueden exceder los ingresos (sin pérdidas cedulares)', () => {
    const r = depurarNoLaborales({ ingresosBrutos: 10_000_000, costosYGastos: 14_000_000, retencionFuente: 0 });
    expect(r.costosYGastos).toBe(10_000_000);
    expect(r.rentaLiquida).toBe(0);
  });
});

describe('liquidarDeclaracion con rentas no laborales', () => {
  it('la renta líquida no laboral entra a la cédula general y a las casillas 74-90', () => {
    const perfil = perfilConNoLaborales({
      rentasNoLaborales: { ingresosBrutos: 16_180_000, costosYGastos: 2_500_000, retencionFuente: 100_000 },
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.cedulaGeneral.noLaborales.rentaLiquida).toBe(13_680_000);
    expect(r.cedulaGeneral.rentaLiquidaCedula).toBe(13_680_000);
    expect(r.casillas['74']).toBe(16_180_000);
    expect(r.casillas['77']).toBe(2_500_000);
    expect(r.casillas['78']).toBe(13_680_000);
    expect(r.casillas['87']).toBe(13_680_000);
    expect(r.casillas['90']).toBe(13_680_000);
    expect(r.liquidacion.retenciones).toBe(100_000);
  });

  it('la base del límite del 40% descuenta los costos (art. 336-4)', () => {
    const perfil = perfilConNoLaborales({
      rentasNoLaborales: { ingresosBrutos: 100_000_000, costosYGastos: 40_000_000, retencionFuente: 0 },
    });
    const r = liquidarDeclaracion(perfil);
    // 40% × (100M − 40M) = 24M (bajo el tope de 1.340 UVT)
    expect(r.cedulaGeneral.limiteGlobal).toBe(24_000_000);
  });
});
