import { describe, expect, it } from 'vitest';

import { detectarAdvertencias, detectarCasosNoSoportados } from '../src/perfil/casos-no-soportados';

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
      eventoIngresosExterior: 1,
      eventoDividendos: 1,
      eventoRetirosAfcSinRequisitos: 1,
    });
    expect(casos).toHaveLength(7);
    expect(casos.map((c) => c.clave)).toContain('eventoHerenciaODonacion');
    for (const caso of casos) {
      expect(caso.etiqueta.length).toBeGreaterThan(0);
      expect(caso.detalle.length).toBeGreaterThan(0);
    }
  });

  it('los activos en el exterior son advertencia, no bloqueo', () => {
    expect(detectarCasosNoSoportados({ ...BASE, eventoActivosExterior: 1 })).toEqual([]);
    const avisos = detectarAdvertencias({ ...BASE, eventoActivosExterior: 1 });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]?.detalle).toContain('formulario 160');
    expect(detectarAdvertencias(BASE)).toEqual([]);
  });

  it('solo el valor 1 cuenta como marcado', () => {
    expect(detectarCasosNoSoportados({ ...BASE, eventoCripto: 2 })).toEqual([]);
  });

  it('venta, herencia y premios dejan de ser casos cuando sus datos ya están capturados', () => {
    const conDatos = detectarCasosNoSoportados({
      ...BASE,
      eventoVentaActivos: 1,
      ventasActivos: [
        {
          descripcion: 'Carro',
          fechaAdquisicion: '2020-01-15',
          fechaVenta: '2025-03-01',
          precioVenta: 40_000_000,
          costoFiscal: 50_000_000,
          esViviendaHabitacion: false,
          destinoAfcOHipoteca: false,
          retencionFuente: 0,
        },
      ],
      eventoPremiosOApuestas: 1,
      premiosRecibidos: [{ descripcion: 'Lotería', valor: 5_000_000, retencionFuente: 1_000_000 }],
      eventoHerenciaODonacion: 1,
      herenciasRecibidas: [
        { descripcion: 'Casa', tipo: 'vivienda_causante', esLegitimarioOConyuge: true, valor: 300_000_000 },
      ],
    });
    expect(conDatos).toEqual([]);
  });

  it('el evento marcado SIN datos capturados sigue dejando la declaración incompleta', () => {
    const casos = detectarCasosNoSoportados({ ...BASE, eventoVentaActivos: 1 });
    expect(casos).toHaveLength(1);
    expect(casos[0]?.etiqueta).toContain('sin datos');
  });
});
