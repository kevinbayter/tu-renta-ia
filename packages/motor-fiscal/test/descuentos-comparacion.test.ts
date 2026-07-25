import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { calcularDescuentos } from '../src/liquidacion/descuentos';
import { liquidarDeclaracion } from '../src/motor';
import { compararPatrimonio } from '../src/patrimonio/comparacion';

import type { PerfilFiscal } from '../src/modelo/tipos';

function perfilBase(ajustes: Partial<PerfilFiscal> = {}): PerfilFiscal {
  return {
    anioGravable: 2025,
    certificadosLaborales: [
      {
        nitEmpleador: '900000000',
        pagosLaborales: 150_000_000,
        cesantiasPagadas: 0,
        cesantiasConsignadas: 0,
        aportesSalud: 0,
        aportesPension: 0,
        retencionFuente: 0,
        ingresoPromedioSeisMeses: 0,
      },
    ],
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

describe('calcularDescuentos — arts. 257 y 258 E.T.', () => {
  it('sin donaciones: todo en ceros', () => {
    const r = calcularDescuentos(undefined, 5_000_000, AG2025);
    expect(r.total).toBe(0);
    expect(r.donacionesRealizadas).toBe(0);
  });

  it('descuenta el 25% de lo donado cuando cabe en el tope', () => {
    const r = calcularDescuentos({ donacionesEsal: 4_000_000 }, 10_000_000, AG2025);
    expect(r.porDonaciones).toBe(1_000_000);
    expect(r.limiteAplicado).toBe(2_500_000);
    expect(r.total).toBe(1_000_000);
  });

  it('aplica el tope del 25% del impuesto (art. 258) cuando la donación es grande', () => {
    const r = calcularDescuentos({ donacionesEsal: 40_000_000 }, 10_000_000, AG2025);
    expect(r.porDonaciones).toBe(2_500_000);
    expect(r.total).toBe(2_500_000);
  });

  it('con impuesto cero no hay descuento posible', () => {
    expect(calcularDescuentos({ donacionesEsal: 5_000_000 }, 0, AG2025).total).toBe(0);
  });

  it('ignora donaciones negativas', () => {
    expect(calcularDescuentos({ donacionesEsal: -1_000_000 }, 10_000_000, AG2025).total).toBe(0);
  });
});

describe('liquidarDeclaracion con descuentos', () => {
  it('el descuento baja el impuesto neto y se refleja en las casillas 123/125/126', () => {
    const sinDescuento = liquidarDeclaracion(perfilBase());
    const conDescuento = liquidarDeclaracion(perfilBase({ descuentos: { donacionesEsal: 4_000_000 } }));
    const esperado = sinDescuento.liquidacion.impuestoSobreRentaLiquida - 1_000_000;
    expect(conDescuento.liquidacion.impuestoNetoRenta).toBe(esperado);
    expect(conDescuento.casillas['123']).toBe(1_000_000);
    expect(conDescuento.casillas['125']).toBe(1_000_000);
    expect(conDescuento.casillas['126']).toBe(esperado);
    expect(conDescuento.casillas['121']).toBe(sinDescuento.liquidacion.impuestoSobreRentaLiquida);
  });
});

describe('compararPatrimonio — arts. 236-239 E.T.', () => {
  it('sin patrimonio anterior informado: no se evalúa', () => {
    const r = compararPatrimonio(undefined, 100_000_000, 20_000_000, 5_000_000);
    expect(r.aplica).toBe(false);
    expect(r.diferenciaSinJustificar).toBe(0);
  });

  it('incremento cubierto por rentas: nada por justificar', () => {
    const r = compararPatrimonio(
      { patrimonioLiquidoAnterior: 80_000_000, gananciaOcasionalNeta: 0, impuestosPagadosEnElAnio: 0, justificacionesDeclaradas: 0 },
      100_000_000,
      15_000_000,
      10_000_000,
    );
    expect(r.incremento).toBe(20_000_000);
    expect(r.capacidadDeJustificacion).toBe(25_000_000);
    expect(r.diferenciaSinJustificar).toBe(0);
  });

  it('incremento mayor que las rentas: señala la diferencia sin justificar', () => {
    const r = compararPatrimonio(
      { patrimonioLiquidoAnterior: 50_000_000, gananciaOcasionalNeta: 0, impuestosPagadosEnElAnio: 0, justificacionesDeclaradas: 0 },
      200_000_000,
      30_000_000,
      10_000_000,
    );
    expect(r.diferenciaSinJustificar).toBe(110_000_000);
  });

  it('las causas justificativas del art. 239 cierran la brecha', () => {
    const r = compararPatrimonio(
      {
        patrimonioLiquidoAnterior: 50_000_000,
        gananciaOcasionalNeta: 0,
        impuestosPagadosEnElAnio: 0,
        justificacionesDeclaradas: 110_000_000,
      },
      200_000_000,
      30_000_000,
      10_000_000,
    );
    expect(r.diferenciaSinJustificar).toBe(0);
  });

  it('los impuestos pagados en el año RESTAN capacidad (art. 237)', () => {
    const r = compararPatrimonio(
      { patrimonioLiquidoAnterior: 80_000_000, gananciaOcasionalNeta: 0, impuestosPagadosEnElAnio: 6_000_000, justificacionesDeclaradas: 0 },
      100_000_000,
      15_000_000,
      10_000_000,
    );
    expect(r.capacidadDeJustificacion).toBe(19_000_000);
    expect(r.diferenciaSinJustificar).toBe(1_000_000);
  });

  it('un incremento acorde a los ingresos del año NO deja brecha', () => {
    // Gana 150.000.000 y su patrimonio líquido sube justo 150.000.000: todo explicado.
    const perfil = perfilBase({
      patrimonio: { activos: [{ descripcion: 'Inmueble', valor: 300_000_000 }], deudas: 50_000_000 },
      comparacionPatrimonial: {
        patrimonioLiquidoAnterior: 100_000_000,
        gananciaOcasionalNeta: 0,
        impuestosPagadosEnElAnio: 0,
        justificacionesDeclaradas: 0,
      },
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.patrimonioLiquido).toBe(250_000_000);
    expect(r.comparacionPatrimonial.incremento).toBe(150_000_000);
    expect(r.comparacionPatrimonial.diferenciaSinJustificar).toBe(0);
  });

  it('un salto patrimonial mayor que los ingresos SÍ exige justificación', () => {
    const perfil = perfilBase({
      patrimonio: { activos: [{ descripcion: 'Inmuebles', valor: 600_000_000 }], deudas: 0 },
      comparacionPatrimonial: {
        patrimonioLiquidoAnterior: 100_000_000,
        gananciaOcasionalNeta: 0,
        impuestosPagadosEnElAnio: 0,
        justificacionesDeclaradas: 0,
      },
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.comparacionPatrimonial.incremento).toBe(500_000_000);
    // Capacidad ≈ 150.000.000 (RLG + exentas del año) → faltan ~350.000.000 por explicar.
    expect(r.comparacionPatrimonial.diferenciaSinJustificar).toBe(350_000_000);
  });
});
