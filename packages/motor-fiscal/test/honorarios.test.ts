import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { depurarCedulaGeneral } from '../src/depuracion/cedula-general';
import { liquidarDeclaracion } from '../src/motor';

import type { PerfilFiscal } from '../src/modelo/tipos';

/**
 * Respaldo: normativa/ag2025/12-honorarios-independientes.md
 * (art. 206 par. 5 y art. 336 num. 4, Ley 2277: costos O 25%, nunca ambos).
 */

function perfil(ajustes: Partial<PerfilFiscal>): PerfilFiscal {
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

describe('elección costos vs 25% (art. 336-4)', () => {
  it('con costos altos gana la vía de costos', () => {
    // Costos: 100 − 10 − 50 = 40M. Exento: 90 − 22,5 = 67,5M → gana costos.
    const cedula = depurarCedulaGeneral(
      perfil({ honorarios: { ingresos: 100_000_000, costos: 50_000_000, aportesObligatorios: 10_000_000, retencionFuente: 0 } }),
      AG2025,
    );
    expect(cedula.honorarios.modo).toBe('costos');
    expect(cedula.honorarios.costos).toBe(50_000_000);
    expect(cedula.honorarios.exenta25).toBe(0);
    expect(cedula.rentaLiquidaGravable).toBe(40_000_000);
  });

  it('con costos bajos gana la exención del 25%', () => {
    // Costos: 100 − 10 − 5 = 85M. Exento: 90 − 22,5 = 67,5M → gana el 25%.
    const cedula = depurarCedulaGeneral(
      perfil({ honorarios: { ingresos: 100_000_000, costos: 5_000_000, aportesObligatorios: 10_000_000, retencionFuente: 0 } }),
      AG2025,
    );
    expect(cedula.honorarios.modo).toBe('renta_exenta_25');
    expect(cedula.honorarios.costos).toBe(0);
    expect(cedula.honorarios.exenta25).toBe(22_500_000);
    expect(cedula.rentaLiquidaGravable).toBe(67_500_000);
  });

  it('nunca aplica costos y 25% a la vez', () => {
    const cedula = depurarCedulaGeneral(
      perfil({ honorarios: { ingresos: 80_000_000, costos: 30_000_000, aportesObligatorios: 0, retencionFuente: 0 } }),
      AG2025,
    );
    const h = cedula.honorarios;
    expect(h.costos === 0 || h.exenta25 === 0).toBe(true);
  });
});

describe('tope de 790 UVT compartido con el 25% del asalariado', () => {
  it('si el asalariado agotó el tope, los honorarios no llevan 25%', () => {
    const cedula = depurarCedulaGeneral(
      perfil({
        certificadosLaborales: [
          {
            nitEmpleador: '900000000',
            pagosLaborales: 200_000_000,
            cesantiasPagadas: 0,
            cesantiasConsignadas: 0,
            aportesSalud: 0,
            aportesPension: 0,
            retencionFuente: 0,
            ingresoPromedioSeisMeses: 16_600_000,
          },
        ],
        honorarios: { ingresos: 100_000_000, costos: 0, aportesObligatorios: 0, retencionFuente: 0 },
      }),
      AG2025,
    );
    // 790 UVT = 39.341.210; el asalariado usa 39.341.000 → resto redondeado a miles = 0.
    expect(cedula.trabajo.exenta25).toBe(39_341_000);
    expect(cedula.honorarios.exenta25).toBe(0);
  });
});

describe('integración con la declaración', () => {
  it('la retención de honorarios entra al total y las casillas 43-57 se llenan', () => {
    const r = liquidarDeclaracion(
      perfil({ honorarios: { ingresos: 100_000_000, costos: 50_000_000, aportesObligatorios: 10_000_000, retencionFuente: 5_000_000 } }),
    );
    expect(r.liquidacion.retenciones).toBe(5_000_000);
    expect(r.casillas['43']).toBe(100_000_000);
    expect(r.casillas['44']).toBe(10_000_000);
    expect(r.casillas['45']).toBe(50_000_000);
    expect(r.casillas['46']).toBe(40_000_000);
    expect(r.casillas['57']).toBe(40_000_000);
  });

  it('sin honorarios las casillas 43-57 no aparecen y nada cambia', () => {
    const r = liquidarDeclaracion(perfil({}));
    expect(r.casillas['43']).toBeUndefined();
    expect(r.cedulaGeneral.honorarios.ingresosBrutos).toBe(0);
    expect(r.liquidacion.impuestoNetoRenta).toBe(0);
  });
});
