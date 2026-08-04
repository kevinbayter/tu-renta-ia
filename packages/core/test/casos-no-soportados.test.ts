import { describe, expect, it } from 'vitest';

import { detectarCasosNoSoportados } from '../src/perfil/casos-no-soportados';

import type { RespuestasEntrevista } from '../src/perfil/respuestas';

const BASE: RespuestasEntrevista = {
  mesesConRelacionLaboral: 12,
  tieneDependiente387: false,
  dependientesAdicionales336: 0,
  pagosMedicinaPrepagadaConfirmados: 0,
  interesesVivienda: 0,
  interesesIcetex: 0,
  gmfTotalPagado: 0,
  rendimientosAdicionalesConComponente: 0,
  rendimientosSinComponente: 0,
  activosManuales: [],
  deudas: 0,
  declaracionesPrevias: 0,
  impuestoNetoAnioAnterior: 0,
  anticipoLiquidadoAnioAnterior: 0,
};

describe('detección de casos que el motor no liquida', () => {
  it('sin eventos marcados no reporta nada', () => {
    expect(detectarCasosNoSoportados(BASE)).toEqual([]);
    expect(detectarCasosNoSoportados({ ...BASE, eventoCripto: 0 })).toEqual([]);
  });

  it('reporta cada evento marcado con su etiqueta', () => {
    const casos = detectarCasosNoSoportados({
      ...BASE,
      eventoVentaActivos: 1,
      eventoHerenciaODonacion: 1,
      eventoPremiosOApuestas: 1,
      eventoCripto: 1,
      eventoActivosExterior: 1,
      eventoIngresosExterior: 1,
      eventoDividendos: 1,
    });
    expect(casos).toHaveLength(7);
    expect(casos.map((c) => c.clave)).toContain('eventoHerenciaODonacion');
    for (const caso of casos) {
      expect(caso.etiqueta.length).toBeGreaterThan(0);
      expect(caso.detalle.length).toBeGreaterThan(0);
    }
  });

  it('solo el valor 1 cuenta como marcado', () => {
    expect(detectarCasosNoSoportados({ ...BASE, eventoCripto: 2 })).toEqual([]);
  });
});
