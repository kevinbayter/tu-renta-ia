import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { liquidarGananciasOcasionales } from '../src/liquidacion/ganancias-ocasionales';
import { liquidarDeclaracion } from '../src/motor';

import type { GananciasOcasionalesInput, PerfilFiscal, VentaActivoInput } from '../src/modelo/tipos';

/**
 * Respaldo: normativa/ag2025/09-ganancias-ocasionales.md (arts. 300-317, Ley 2277).
 * Cifras a mano con UVT 2025 = $49.799:
 *   311-1: 5.000 UVT = 248.995.000 · 307-1: 13.000 UVT = 647.387.000
 *   307-3: 3.250 UVT = 161.846.750 · 307-4 tope: 1.625 UVT = 80.923.375
 */

function entrada(parcial: Partial<GananciasOcasionalesInput>): GananciasOcasionalesInput {
  return { ventas: [], herencias: [], premios: [], ...parcial };
}

function venta(parcial: Partial<VentaActivoInput>): VentaActivoInput {
  return {
    descripcion: 'Apartamento',
    fechaAdquisicion: '2020-05-10',
    fechaVenta: '2025-06-01',
    precioVenta: 300_000_000,
    costoFiscal: 200_000_000,
    esViviendaHabitacion: false,
    destinoAfcOHipoteca: false,
    retencionFuente: 0,
    ...parcial,
  };
}

describe('regla de los 2 años (art. 300)', () => {
  it('venta con 2+ años es ganancia ocasional al 15%', () => {
    const go = liquidarGananciasOcasionales(entrada({ ventas: [venta({ retencionFuente: 3_000_000 })] }), AG2025);
    expect(go.ingresos).toBe(300_000_000);
    expect(go.costos).toBe(200_000_000);
    expect(go.baseTarifaGeneral).toBe(100_000_000);
    expect(go.impuesto).toBe(15_000_000);
    expect(go.retenciones).toBe(3_000_000);
    expect(go.ventasARentaOrdinaria).toEqual({ ingresos: 0, costos: 0 });
  });

  it('exactamente 2 años ya es ganancia ocasional', () => {
    const go = liquidarGananciasOcasionales(
      entrada({ ventas: [venta({ fechaAdquisicion: '2023-06-01', fechaVenta: '2025-06-01' })] }),
      AG2025,
    );
    expect(go.baseTarifaGeneral).toBe(100_000_000);
  });

  it('venta con menos de 2 años va a renta ordinaria, no a GO', () => {
    const go = liquidarGananciasOcasionales(
      entrada({ ventas: [venta({ fechaAdquisicion: '2024-03-01', fechaVenta: '2025-06-01' })] }),
      AG2025,
    );
    expect(go.impuesto).toBe(0);
    expect(go.ingresos).toBe(0);
    expect(go.ventasARentaOrdinaria).toEqual({ ingresos: 300_000_000, costos: 200_000_000 });
  });

  it('una fecha ilegible se trata como <2 años (lectura conservadora)', () => {
    const go = liquidarGananciasOcasionales(
      entrada({ ventas: [venta({ fechaAdquisicion: 'no sé' })] }),
      AG2025,
    );
    expect(go.ventasARentaOrdinaria.ingresos).toBe(300_000_000);
  });
});

describe('exención por venta de vivienda de habitación (art. 311-1)', () => {
  it('con destinación AFC/hipoteca exime hasta 5.000 UVT de la utilidad', () => {
    // Utilidad 300M → exentas 248.995.000 → base 51.005.000 → 15% = 7.650.750 → miles: 7.651.000.
    const go = liquidarGananciasOcasionales(
      entrada({
        ventas: [venta({ precioVenta: 500_000_000, esViviendaHabitacion: true, destinoAfcOHipoteca: true })],
      }),
      AG2025,
    );
    expect(go.exentas).toBe(248_995_000);
    expect(go.baseTarifaGeneral).toBe(51_005_000);
    expect(go.impuesto).toBe(7_651_000);
  });

  it('sin destinación AFC/hipoteca NO hay exención', () => {
    const go = liquidarGananciasOcasionales(
      entrada({
        ventas: [venta({ precioVenta: 500_000_000, esViviendaHabitacion: true, destinoAfcOHipoteca: false })],
      }),
      AG2025,
    );
    expect(go.exentas).toBe(0);
    expect(go.impuesto).toBe(45_000_000);
  });
});

describe('herencias y donaciones (arts. 302-307)', () => {
  it('vivienda del causante a un hijo: 13.000 UVT + 3.250 UVT la dejan exenta', () => {
    // 700M − 647.387.000 = 52.613.000 restante, cubierto por las 3.250 UVT del legitimario.
    const go = liquidarGananciasOcasionales(
      entrada({
        herencias: [
          { descripcion: 'Casa de mi padre', tipo: 'vivienda_causante', esLegitimarioOConyuge: true, valor: 700_000_000 },
        ],
      }),
      AG2025,
    );
    expect(go.ingresos).toBe(700_000_000);
    expect(go.exentas).toBe(700_000_000);
    expect(go.impuesto).toBe(0);
  });

  it('donación a un tercero: 20% exento con tope de 1.625 UVT', () => {
    const go = liquidarGananciasOcasionales(
      entrada({
        herencias: [
          { descripcion: 'Donación', tipo: 'otros_bienes', esLegitimarioOConyuge: false, valor: 100_000_000 },
        ],
      }),
      AG2025,
    );
    expect(go.exentas).toBe(20_000_000);
    expect(go.baseTarifaGeneral).toBe(80_000_000);
    expect(go.impuesto).toBe(12_000_000);
  });

  it('el tope de 1.625 UVT limita el 20% en donaciones grandes', () => {
    // 20% de 600M = 120M > tope 80.923.375 → exentas 80.923.000 (miles) sobre la suma.
    const go = liquidarGananciasOcasionales(
      entrada({
        herencias: [
          { descripcion: 'Donación', tipo: 'otros_bienes', esLegitimarioOConyuge: false, valor: 600_000_000 },
        ],
      }),
      AG2025,
    );
    expect(go.exentas).toBe(80_923_000);
    expect(go.impuesto).toBe(77_862_000); // (600M − 80.923.375→ base 519.077.000) × 15%
  });
});

describe('premios y apuestas (art. 317)', () => {
  it('tributan al 20% con la retención como abono', () => {
    const go = liquidarGananciasOcasionales(
      entrada({ premios: [{ descripcion: 'BetPlay', valor: 10_000_000, retencionFuente: 2_000_000 }] }),
      AG2025,
    );
    expect(go.basePremios).toBe(10_000_000);
    expect(go.impuesto).toBe(2_000_000);
    expect(go.retenciones).toBe(2_000_000);
  });
});

describe('integración con la declaración completa', () => {
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
    gananciasOcasionales: {
      ventas: [venta({ retencionFuente: 3_000_000 })],
      herencias: [],
      premios: [{ descripcion: 'Lotería', valor: 10_000_000, retencionFuente: 2_000_000 }],
    },
  };

  it('suma el impuesto de GO al total a cargo y llena las casillas 112-115 y 127', () => {
    const r = liquidarDeclaracion(perfil);
    expect(r.gananciasOcasionales.impuesto).toBe(17_000_000); // 15M + 2M
    expect(r.liquidacion.impuestoNetoRenta).toBe(0);
    expect(r.liquidacion.totalImpuestoACargo).toBe(17_000_000);
    expect(r.liquidacion.retenciones).toBe(5_000_000);
    expect(r.liquidacion.saldoAPagar).toBe(12_000_000);
    expect(r.casillas['112']).toBe(310_000_000);
    expect(r.casillas['113']).toBe(200_000_000);
    expect(r.casillas['115']).toBe(110_000_000);
    expect(r.casillas['127']).toBe(17_000_000);
  });

  it('las ventas cortas suben la renta ordinaria de la cédula general', () => {
    const conVentaCorta: PerfilFiscal = {
      ...perfil,
      gananciasOcasionales: {
        ventas: [venta({ fechaAdquisicion: '2024-08-01', fechaVenta: '2025-02-01', precioVenta: 50_000_000, costoFiscal: 30_000_000 })],
        herencias: [],
        premios: [],
      },
    };
    const r = liquidarDeclaracion(conVentaCorta);
    expect(r.cedulaGeneral.noLaborales.ingresosBrutos).toBe(50_000_000);
    expect(r.cedulaGeneral.noLaborales.rentaLiquida).toBe(20_000_000);
    expect(r.gananciasOcasionales.impuesto).toBe(0);
  });

  it('la GO neta alimenta la comparación patrimonial', () => {
    const conComparacion: PerfilFiscal = {
      ...perfil,
      comparacionPatrimonial: {
        patrimonioLiquidoAnterior: 100_000_000,
        gananciaOcasionalNeta: 0,
        impuestosPagadosEnElAnio: 0,
        justificacionesDeclaradas: 0,
      },
      patrimonio: { activos: [{ descripcion: 'Cuenta', valor: 200_000_000 }], deudas: 0 },
    };
    const r = liquidarDeclaracion(conComparacion);
    // Capacidad = RLG 0 + exentas 0 + GO neta (310M − 200M = 110M) − impuestos 0.
    expect(r.comparacionPatrimonial.capacidadDeJustificacion).toBe(110_000_000);
  });
});
