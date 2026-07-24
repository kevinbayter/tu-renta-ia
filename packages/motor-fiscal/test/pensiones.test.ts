import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { depurarPensiones } from '../src/depuracion/pensiones';
import { impuestoTabla241 } from '../src/liquidacion/tabla-241';
import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal } from '../src/modelo/tipos';

// Tope exento AG2025: 1.000 UVT × $49.799 × 12 meses = $597.588.000 (num. 5 art. 206).
const TOPE_ANUAL = 597_588_000;

function perfilPensionado(ajustes: Partial<PerfilFiscal> = {}): PerfilFiscal {
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

describe('depurarPensiones — num. 5 art. 206 E.T.', () => {
  it('sin pensiones: cédula en ceros', () => {
    expect(depurarPensiones(undefined, AG2025)).toEqual({
      ingresosBrutos: 0,
      incrngo: 0,
      rentaLiquida: 0,
      rentaExenta: 0,
      rentaLiquidaGravable: 0,
    });
  });

  it('mesada típica bajo 1.000 UVT/mes: todo exento, RLG 0', () => {
    const r = depurarPensiones(
      { ingresosBrutos: 43_918_000, aportesSaludYFsp: 5_270_000, retencionFuente: 0, mesesConPension: 12 },
      AG2025,
    );
    expect(r.rentaLiquida).toBe(38_648_000);
    expect(r.rentaExenta).toBe(38_648_000);
    expect(r.rentaLiquidaGravable).toBe(0);
  });

  it('mesada alta: grava solo el exceso sobre 1.000 UVT mensuales', () => {
    const r = depurarPensiones(
      { ingresosBrutos: 800_000_000, aportesSaludYFsp: 0, retencionFuente: 0, mesesConPension: 12 },
      AG2025,
    );
    expect(r.rentaExenta).toBe(TOPE_ANUAL);
    expect(r.rentaLiquidaGravable).toBe(800_000_000 - TOPE_ANUAL);
  });

  it('la exención se prorratea por meses con mesada', () => {
    const r = depurarPensiones(
      { ingresosBrutos: 400_000_000, aportesSaludYFsp: 0, retencionFuente: 0, mesesConPension: 6 },
      AG2025,
    );
    expect(r.rentaExenta).toBe(TOPE_ANUAL / 2);
    expect(r.rentaLiquidaGravable).toBe(400_000_000 - TOPE_ANUAL / 2);
  });

  it('meses inválidos caen a 12 y el INCRNGO no supera los ingresos', () => {
    const conMesesRaros = depurarPensiones(
      { ingresosBrutos: 700_000_000, aportesSaludYFsp: 0, retencionFuente: 0, mesesConPension: 99 },
      AG2025,
    );
    expect(conMesesRaros.rentaExenta).toBe(TOPE_ANUAL);
    const conSaludExcesiva = depurarPensiones(
      { ingresosBrutos: 10_000_000, aportesSaludYFsp: 15_000_000, retencionFuente: 0, mesesConPension: 0 },
      AG2025,
    );
    expect(conSaludExcesiva.incrngo).toBe(10_000_000);
    expect(conSaludExcesiva.rentaLiquidaGravable).toBe(0);
  });
});

describe('liquidarDeclaracion con pensiones — art. 331 (Ley 2277/2022)', () => {
  it('la RLG de pensiones se SUMA a la cédula general para la tabla 241', () => {
    const perfil = perfilPensionado({
      rentasPensiones: { ingresosBrutos: 700_000_000, aportesSaludYFsp: 0, retencionFuente: 1_000_000, mesesConPension: 12 },
    });
    const r = liquidarDeclaracion(perfil);
    const gravable = 700_000_000 - TOPE_ANUAL;
    expect(r.cedulaPensiones.rentaLiquidaGravable).toBe(gravable);
    expect(r.liquidacion.impuestoSobreRentaLiquida).toBe(impuestoTabla241(gravable, AG2025));
    expect(r.liquidacion.retenciones).toBe(1_000_000);
    expect(r.casillas['99']).toBe(700_000_000);
    expect(r.casillas['102']).toBe(TOPE_ANUAL);
    expect(r.casillas['103']).toBe(gravable);
  });

  it('pensionado con mesada normal: impuesto $0 y casillas de pensiones diligenciadas', () => {
    const perfil = perfilPensionado({
      rentasPensiones: { ingresosBrutos: 43_918_000, aportesSaludYFsp: 5_270_000, retencionFuente: 0, mesesConPension: 12 },
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.liquidacion.impuestoNetoRenta).toBe(0);
    expect(r.casillas['99']).toBe(43_918_000);
    expect(r.casillas['100']).toBe(5_270_000);
    expect(r.casillas['101']).toBe(38_648_000);
    expect(r.casillas['103']).toBe(0);
  });
});
