import { describe, expect, it } from 'vitest';

import { actividadEconomicaSugerida } from '../src/formulario210/actividad-economica';
import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal } from '../src/modelo/tipos';

function pensionadaConArriendo(): PerfilFiscal {
  return {
    anioGravable: 2025,
    certificadosLaborales: [],
    rentasCapital: {
      rendimientosConComponente: 0,
      rendimientosSinComponente: 0,
      gmfPagado: 0,
      retencionFuente: 0,
      arrendamientos: { ingresosBrutos: 40_000_000, costosYGastos: 0, retencionFuente: 0 },
    },
    rentasPensiones: { ingresosBrutos: 900_000_000, aportesSaludYFsp: 0, retencionFuente: 0, mesesConPension: 12 },
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
  };
}

describe('casillas de consolidación del 210', () => {
  it('la 111 suma la renta gravable general y la de pensiones: es la base de la tabla del art. 241', () => {
    const r = liquidarDeclaracion(pensionadaConArriendo());
    expect(r.casillas['103']).toBeGreaterThan(0);
    expect(r.casillas['111']).toBe(r.casillas['97']! + r.casillas['103']!);
    expect(r.casillas['116']).toBeGreaterThan(0);
  });
});

describe('actividad económica sugerida (casilla 24)', () => {
  it('sigue a la renta predominante', () => {
    expect(actividadEconomicaSugerida({ '32': 50_000_000, '99': 10_000_000 })).toBe('0010');
    expect(actividadEconomicaSugerida({ '58': 16_000_000, '99': 50_000_000 })).toBe('0020');
    expect(actividadEconomicaSugerida({ '58': 30_000_000, '99': 10_000_000 })).toBe('0090');
  });

  it('con honorarios predominantes el código CIIU solo está en el RUT: no se inventa', () => {
    expect(actividadEconomicaSugerida({ '43': 80_000_000, '32': 10_000_000 })).toBe('');
    expect(actividadEconomicaSugerida({})).toBe('');
  });
});
