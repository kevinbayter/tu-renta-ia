import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { depurarDividendos } from '../src/depuracion/dividendos';
import { impuestoTabla241 } from '../src/liquidacion/tabla-241';
import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal } from '../src/modelo/tipos';

/**
 * Respaldo: normativa/ag2025/10-dividendos.md (arts. 242 y 254-1, Ley 2277).
 * Umbral 1.090 UVT × $49.799 = $54.280.910.
 */

describe('cédula de dividendos (art. 242)', () => {
  it('los no gravados van completos a la base de la tabla', () => {
    const d = depurarDividendos({ noGravados: 100_000_000, gravados: 0, retencionFuente: 0 }, AG2025);
    expect(d.baseParaTabla).toBe(100_000_000);
    expect(d.impuestoGravados35).toBe(0);
  });

  it('los gravados pagan 35% y el neto va a la tabla', () => {
    const d = depurarDividendos({ noGravados: 0, gravados: 100_000_000, retencionFuente: 0 }, AG2025);
    expect(d.impuestoGravados35).toBe(35_000_000);
    expect(d.netoGravadosATabla).toBe(65_000_000);
    expect(d.baseParaTabla).toBe(65_000_000);
    expect(d.descuento).toBe(0);
  });
});

describe('descuento por dividendos (art. 254-1)', () => {
  it('no hay descuento por debajo de 1.090 UVT', () => {
    const d = depurarDividendos({ noGravados: 50_000_000, gravados: 0, retencionFuente: 0 }, AG2025);
    expect(d.descuento).toBe(0);
  });

  it('19% marginal sobre el exceso de 1.090 UVT', () => {
    // (100.000.000 − 54.280.910) × 19% = 8.686.627 → miles: 8.687.000.
    const d = depurarDividendos({ noGravados: 100_000_000, gravados: 0, retencionFuente: 0 }, AG2025);
    expect(d.descuento).toBe(8_687_000);
  });
});

describe('integración con la declaración', () => {
  const perfil: PerfilFiscal = {
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
    dividendos: { noGravados: 100_000_000, gravados: 20_000_000, retencionFuente: 6_857_000 },
  };

  it('suma la base, aplica el descuento y llena las casillas 107/108', () => {
    const r = liquidarDeclaracion(perfil);
    // Base tabla: 100M + (20M − 7M del 35%) = 113M.
    const impuestoTabla = impuestoTabla241(113_000_000, AG2025);
    expect(r.liquidacion.impuestoSobreRentaLiquida).toBe(impuestoTabla);
    expect(r.liquidacion.impuestoDividendosGravados).toBe(7_000_000);
    expect(r.liquidacion.descuentos.porDividendos).toBe(8_687_000);
    expect(r.liquidacion.impuestoNetoRenta).toBe(impuestoTabla + 7_000_000 - 8_687_000);
    expect(r.liquidacion.retenciones).toBe(6_857_000);
    expect(r.casillas['107']).toBe(100_000_000);
    expect(r.casillas['108']).toBe(20_000_000);
    expect(r.casillas['121']).toBe(impuestoTabla + 7_000_000);
  });

  it('sin dividendos nada cambia frente al comportamiento previo', () => {
    const { dividendos, ...sinDividendos } = perfil;
    expect(dividendos).toBeDefined();
    const r = liquidarDeclaracion(sinDividendos);
    expect(r.dividendos.baseParaTabla).toBe(0);
    expect(r.liquidacion.impuestoNetoRenta).toBe(0);
  });
});
