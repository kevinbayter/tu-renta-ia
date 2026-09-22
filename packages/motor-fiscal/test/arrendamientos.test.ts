import { describe, expect, it } from 'vitest';

import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal, RentasCapitalInput } from '../src/modelo/tipos';

const SIN_CAPITAL: RentasCapitalInput = {
  rendimientosConComponente: 0,
  rendimientosSinComponente: 0,
  gmfPagado: 0,
  retencionFuente: 0,
};

function perfil(ajustes: Partial<PerfilFiscal> = {}): PerfilFiscal {
  return {
    anioGravable: 2025,
    certificadosLaborales: [],
    rentasCapital: SIN_CAPITAL,
    deducciones: {
      mesesConRelacionLaboral: 0,
      tieneDependiente387: false,
      dependientesAdicionales336: 0,
      pagosMedicinaPrepagada: 0,
      interesesVivienda: 0,
      interesesIcetex: 0,
    },
    comprasFacturaElectronica: 0,
    patrimonio: { activos: [], deudas: 0 },
    historial: { declaracionesPrevias: 1, impuestoNetoAnioAnterior: 0, saldoFavorAnioAnterior: 0, anticipoLiquidadoAnioAnterior: 0 },
    ...ajustes,
  };
}

function conArriendo(ingresosBrutos: number, costosYGastos: number, retencionFuente = 0): Partial<PerfilFiscal> {
  return { rentasCapital: { ...SIN_CAPITAL, arrendamientos: { ingresosBrutos, costosYGastos, retencionFuente } } };
}

describe('arrendamientos — rentas de capital (art. 335-2 E.T.)', () => {
  it('van en las casillas 58-61 y no en las de rentas no laborales', () => {
    const r = liquidarDeclaracion(perfil(conArriendo(16_000_000, 1_900_000)));
    expect(r.casillas['58']).toBe(16_000_000);
    expect(r.casillas['60']).toBe(1_900_000);
    expect(r.casillas['61']).toBe(14_100_000);
    expect(r.casillas['74']).toBe(0);
    expect(r.cedulaGeneral.rentaLiquidaCedula).toBe(14_100_000);
  });

  it('se suman a los rendimientos financieros sin mezclar sus costos con el componente inflacionario', () => {
    const r = liquidarDeclaracion(
      perfil({
        rentasCapital: {
          rendimientosConComponente: 1_000_000,
          rendimientosSinComponente: 0,
          gmfPagado: 0,
          retencionFuente: 0,
          arrendamientos: { ingresosBrutos: 12_000_000, costosYGastos: 1_000_000, retencionFuente: 0 },
        },
      }),
    );
    expect(r.casillas['58']).toBe(13_000_000);
    expect(r.casillas['60']).toBe(1_000_000);
    expect(r.casillas['61']).toBe(13_000_000 - r.casillas['59']! - 1_000_000);
  });

  it('los costos del arriendo no pueden superar su ingreso (sin pérdidas cedulares)', () => {
    const r = liquidarDeclaracion(perfil(conArriendo(5_000_000, 8_000_000)));
    expect(r.casillas['60']).toBe(5_000_000);
    expect(r.casillas['61']).toBe(0);
  });

  it('la base del límite del 40% descuenta los costos del arriendo (art. 336-4)', () => {
    const r = liquidarDeclaracion(perfil(conArriendo(100_000_000, 40_000_000)));
    expect(r.cedulaGeneral.limiteGlobal).toBe(24_000_000);
  });

  it('la retención del arriendo (3,5%) va a la casilla 132 y genera saldo a favor si no hay impuesto', () => {
    const r = liquidarDeclaracion(perfil(conArriendo(16_000_000, 1_900_000, 560_000)));
    expect(r.casillas['132']).toBe(560_000);
    expect(r.casillas['126']).toBe(0);
    expect(r.casillas['137']).toBe(560_000);
  });

  it('pensionada con arriendo: pensión exenta, arriendo bajo 1.090 UVT → impuesto $0 y aplica el 1% de FE', () => {
    const r = liquidarDeclaracion(
      perfil({
        ...conArriendo(16_000_000, 1_900_000),
        rentasPensiones: { ingresosBrutos: 50_000_000, aportesSaludYFsp: 1_700_000, retencionFuente: 0, mesesConPension: 12 },
        comprasFacturaElectronica: 9_000_000,
      }),
    );
    expect(r.casillas['102']).toBe(r.casillas['101']);
    expect(r.casillas['103']).toBe(0);
    expect(r.casillas['28']).toBe(90_000);
    expect(r.casillas['97']).toBe(14_100_000 - 90_000);
    expect(r.casillas['126']).toBe(0);
  });
});
