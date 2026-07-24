import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { obtenerConstantes } from '../src/constantes/registro';
import { depurarCedulaGeneral } from '../src/depuracion/cedula-general';
import { porcentajeCesantiasExentas } from '../src/depuracion/rentas-trabajo';
import { calcularAnticipo, porcentajeAnticipo } from '../src/liquidacion/anticipo';
import { impuestoTabla241 } from '../src/liquidacion/tabla-241';
import { liquidarDeclaracion } from '../src/motor';
import { pisoMil, redondearMil } from '../src/redondeo';

import type { ConstantesAnio } from '../src/constantes/tipos';
import type { PerfilFiscal } from '../src/modelo/tipos';

function perfilBase(ajustes: Partial<PerfilFiscal> = {}): PerfilFiscal {
  return {
    anioGravable: 2025,
    certificadosLaborales: [],
    rentasCapital: {
      rendimientosConComponente: 0,
      rendimientosSinComponente: 0,
      gmfPagado: 0,
      retencionFuente: 0,
    },
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
    historial: {
      declaracionesPrevias: 0,
      impuestoNetoAnioAnterior: 0,
      saldoFavorAnioAnterior: 0,
      anticipoLiquidadoAnioAnterior: 0,
    },
    ...ajustes,
  };
}

function certificadoSimple(pagos: number, extras: Record<string, number> = {}) {
  return {
    nitEmpleador: '900000000',
    pagosLaborales: pagos,
    cesantiasPagadas: 0,
    cesantiasConsignadas: 0,
    aportesSalud: 0,
    aportesPension: 0,
    retencionFuente: 0,
    ingresoPromedioSeisMeses: 0,
    ...extras,
  };
}

describe('redondeo (art. 577)', () => {
  it('redondea al mil más cercano', () => {
    expect(redondearMil(1_217_499)).toBe(1_217_000);
    expect(redondearMil(1_217_500)).toBe(1_218_000);
    expect(redondearMil(0)).toBe(0);
  });

  it('pisoMil trunca al mil inferior', () => {
    expect(pisoMil(1_217_999)).toBe(1_217_000);
  });
});

describe('registro de constantes', () => {
  it('devuelve AG2025', () => {
    expect(obtenerConstantes(2025).uvt).toBe(49_799);
  });

  it('rechaza años no soportados', () => {
    expect(() => obtenerConstantes(2019)).toThrow('no soportado');
  });
});

describe('tabla art. 241', () => {
  it('base nula o negativa → 0', () => {
    expect(impuestoTabla241(0, AG2025)).toBe(0);
    expect(impuestoTabla241(-5_000, AG2025)).toBe(0);
  });

  it('bajo 1.090 UVT → 0', () => {
    expect(impuestoTabla241(1_089 * AG2025.uvt, AG2025)).toBe(0);
  });

  it('rango 19%: 1.500 UVT → (410 × 19%) UVT', () => {
    const esperado = pisoMil(410 * 0.19 * AG2025.uvt);
    expect(impuestoTabla241(1_500 * AG2025.uvt, AG2025)).toBe(esperado);
  });

  it('rango 28% aplica UVT a sumar', () => {
    const esperado = pisoMil((300 * 0.28 + 116) * AG2025.uvt);
    expect(impuestoTabla241(2_000 * AG2025.uvt, AG2025)).toBe(esperado);
  });

  it('rango superior 39%', () => {
    const esperado = pisoMil((1_000 * 0.39 + 10_352) * AG2025.uvt);
    expect(impuestoTabla241(32_000 * AG2025.uvt, AG2025)).toBe(esperado);
  });

  it('tabla vacía → error de configuración', () => {
    const rotas = { ...AG2025, tabla241: [] } as ConstantesAnio;
    expect(() => impuestoTabla241(1_000_000, rotas)).toThrow('mal configuradas');
  });
});

describe('cesantías exentas (art. 206-4)', () => {
  it('promedio ≤ 350 UVT → 100%', () => {
    expect(porcentajeCesantiasExentas(350 * AG2025.uvt, AG2025)).toBe(1);
  });

  it('promedio en tramo 90%', () => {
    expect(porcentajeCesantiasExentas(400 * AG2025.uvt, AG2025)).toBe(0.9);
  });

  it('promedio > 650 UVT → 0%', () => {
    expect(porcentajeCesantiasExentas(700 * AG2025.uvt, AG2025)).toBe(0);
  });

  it('tabla vacía → error de configuración', () => {
    const rotas = { ...AG2025, tablaCesantias: [] } as ConstantesAnio;
    expect(() => porcentajeCesantiasExentas(1_000_000, rotas)).toThrow('sin tramo');
  });
});

describe('anticipo (arts. 807-809)', () => {
  it('porcentaje por número de declaración: 25/50/75', () => {
    expect(porcentajeAnticipo(0, AG2025)).toBe(0.25);
    expect(porcentajeAnticipo(1, AG2025)).toBe(0.5);
    expect(porcentajeAnticipo(5, AG2025)).toBe(0.75);
    expect(porcentajeAnticipo(-1, AG2025)).toBe(0.25);
  });

  it('primera declaración: solo procedimiento 1', () => {
    const historial = {
      declaracionesPrevias: 0,
      impuestoNetoAnioAnterior: 0,
      saldoFavorAnioAnterior: 0,
      anticipoLiquidadoAnioAnterior: 0,
    };
    expect(calcularAnticipo(4_000_000, 0, historial, AG2025)).toBe(1_000_000);
  });

  it('elige el procedimiento menor y nunca es negativo', () => {
    const historial = {
      declaracionesPrevias: 2,
      impuestoNetoAnioAnterior: 0,
      saldoFavorAnioAnterior: 0,
      anticipoLiquidadoAnioAnterior: 0,
    };
    // promedio (1.217.000+0)/2 × 75% = 456.375; retenciones 825.000 → 0
    expect(calcularAnticipo(1_217_000, 825_000, historial, AG2025)).toBe(0);
    // sin retenciones: gana el promedio → 456.000
    expect(calcularAnticipo(1_217_000, 0, historial, AG2025)).toBe(456_000);
  });

  it('procedimiento 1 gana cuando el año anterior fue más alto', () => {
    const historial = {
      declaracionesPrevias: 2,
      impuestoNetoAnioAnterior: 10_000_000,
      saldoFavorAnioAnterior: 0,
      anticipoLiquidadoAnioAnterior: 0,
    };
    expect(calcularAnticipo(2_000_000, 0, historial, AG2025)).toBe(1_500_000);
  });
});

describe('topes de deducciones', () => {
  it('dependientes 10% limitado por 32 UVT × meses', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(200_000_000)],
      deducciones: {
        mesesConRelacionLaboral: 2,
        tieneDependiente387: true,
        dependientesAdicionales336: 0,
        pagosMedicinaPrepagada: 0,
        interesesVivienda: 0,
        interesesIcetex: 0,
      },
    });
    const r = liquidarDeclaracion(perfil);
    // tope = 32 × 49.799 × 2 = 3.187.136 → 3.187.000 (10% sería 20.000.000)
    expect(r.cedulaGeneral.trabajo.deduccionDependientes).toBe(3_187_000);
  });

  it('medicina prepagada limitada a 192 UVT/año e intereses a sus topes', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(100_000_000)],
      deducciones: {
        mesesConRelacionLaboral: 12,
        tieneDependiente387: false,
        dependientesAdicionales336: 0,
        pagosMedicinaPrepagada: 50_000_000,
        interesesVivienda: 100_000_000,
        interesesIcetex: 10_000_000,
      },
    });
    const t = liquidarDeclaracion(perfil).cedulaGeneral.trabajo;
    expect(t.deduccionPrepagada).toBe(redondearMil(192 * AG2025.uvt));
    const topeIntereses = 1_200 * AG2025.uvt + 100 * AG2025.uvt;
    expect(t.deduccionIntereses).toBe(redondearMil(topeIntereses));
  });

  it('factura electrónica limitada a 240 UVT y dependientes adicionales a 4', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(500_000_000)],
      comprasFacturaElectronica: 5_000_000_000,
      deducciones: {
        mesesConRelacionLaboral: 12,
        tieneDependiente387: false,
        dependientesAdicionales336: 9,
        pagosMedicinaPrepagada: 0,
        interesesVivienda: 0,
        interesesIcetex: 0,
      },
    });
    const g = liquidarDeclaracion(perfil).cedulaGeneral;
    expect(g.deduccionFacturaElectronica).toBe(redondearMil(240 * AG2025.uvt));
    expect(g.deduccionDependientesAdicionales).toBe(redondearMil(4 * 72 * AG2025.uvt));
  });

  it('exenta del 25% limitada a 790 UVT y límite global a 1.340 UVT', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(1_000_000_000)],
    });
    const g = liquidarDeclaracion(perfil).cedulaGeneral;
    expect(g.trabajo.exenta25).toBe(redondearMil(790 * AG2025.uvt));
    expect(g.limiteGlobal).toBe(redondearMil(1_340 * AG2025.uvt));
  });
});

describe('asignación del límite entre subcédulas', () => {
  it('el remanente del límite pasa a rentas de capital (GMF deducible)', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(50_000_000)],
      rentasCapital: {
        rendimientosConComponente: 10_000_000,
        rendimientosSinComponente: 0,
        gmfPagado: 400_000,
        retencionFuente: 0,
      },
    });
    const g = liquidarDeclaracion(perfil).cedulaGeneral;
    expect(g.capital.asignadoLimitado).toBe(g.capital.deduccionGmf);
    expect(g.capital.rentaLiquidaOrdinaria).toBe(g.capital.rentaLiquida - g.capital.deduccionGmf);
  });
});

describe('liquidación y patrimonio', () => {
  it('perfil vacío liquida en ceros', () => {
    const r = liquidarDeclaracion(perfilBase());
    expect(r.liquidacion.impuestoNetoRenta).toBe(0);
    expect(r.liquidacion.totalSaldoAFavor).toBe(0);
    expect(r.liquidacion.saldoAPagar).toBe(0);
    expect(r.patrimonioLiquido).toBe(0);
  });

  it('saldo a pagar cuando el impuesto supera retenciones y saldos', () => {
    const perfil = perfilBase({
      certificadosLaborales: [certificadoSimple(300_000_000, { retencionFuente: 1_000_000 })],
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.liquidacion.saldoAPagar).toBeGreaterThan(0);
    expect(r.liquidacion.totalSaldoAFavor).toBe(0);
  });

  it('las deudas no dejan patrimonio líquido negativo', () => {
    const perfil = perfilBase({
      patrimonio: { activos: [{ descripcion: 'cuenta', valor: 1_000_000 }], deudas: 5_000_000 },
    });
    const r = liquidarDeclaracion(perfil);
    expect(r.patrimonioLiquido).toBe(0);
  });
});

describe('propiedades del motor', () => {
  it('más ingreso nunca baja el impuesto (monotonía)', () => {
    const impuestos = [80, 120, 200, 400].map((millones) => {
      const perfil = perfilBase({ certificadosLaborales: [certificadoSimple(millones * 1_000_000)] });
      return liquidarDeclaracion(perfil).liquidacion.impuestoNetoRenta;
    });
    const ordenado = [...impuestos].sort((a, b) => a - b);
    expect(impuestos).toEqual(ordenado);
  });

  it('la depuración nunca excede el límite global', () => {
    const perfil = perfilBase({
      certificadosLaborales: [
        certificadoSimple(90_000_000, { cesantiasPagadas: 30_000_000, ingresoPromedioSeisMeses: 5_000_000 }),
      ],
      deducciones: {
        mesesConRelacionLaboral: 12,
        tieneDependiente387: true,
        dependientesAdicionales336: 0,
        pagosMedicinaPrepagada: 9_000_000,
        interesesVivienda: 40_000_000,
        interesesIcetex: 0,
      },
    });
    const c = obtenerConstantes(2025);
    const g = depurarCedulaGeneral(perfil, c);
    const asignadoTotal = g.trabajo.asignadoLimitado + g.capital.asignadoLimitado;
    expect(asignadoTotal).toBeLessThanOrEqual(g.limiteGlobal);
  });
});
