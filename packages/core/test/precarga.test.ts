import { describe, expect, it } from 'vitest';

import { precargarDesdeExogena } from '../src/exogena/precarga';

import type { ExogenaParseada, FilaExogena } from '../src/exogena/tipos';

function fila(parcial: Partial<FilaExogena>): FilaExogena {
  return {
    nitInformante: '900000000',
    nombreInformante: 'ENTIDAD',
    detalle: '',
    valor: 0,
    usoSugerido: '',
    infoAdicional: '',
    ...parcial,
  };
}

const EXOGENA: ExogenaParseada = {
  anioGravable: 2025,
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [
    // Rendimientos de cesantías (Colfondos) → rendimientosSinComponente
    fila({
      nombreInformante: 'FONDO DE CESANTIAS EJEMPLO',
      detalle: 'Valor de los intereses o rendimientos causados en el periodo (Formato del fondo de cesantías). Empleado',
      valor: 382_694,
      usoSugerido: 'R58 Ingresos brutos por rentas de capital',
    }),
    // Carteras colectivas → rendimientosAdicionalesConComponente (sin duplicar "Valor Total")
    fila({
      nombreInformante: 'FIDUCIARIA EJEMPLO DOS S.A.',
      detalle: 'Cartera Colectiva Rendimientos Pagados (Titular Principal) (Concepto: 6)',
      valor: 6_103,
      usoSugerido: 'R58',
    }),
    fila({
      nombreInformante: 'FIDUCIARIA EJEMPLO DOS S.A.',
      detalle: 'Valor Total Rendimientos pagados',
      valor: 6_103,
      usoSugerido: 'R58',
    }),
    // Rendimientos bancarios (5063) — NO precargar (vienen del certificado del banco)
    fila({
      nombreInformante: 'NU COLOMBIA',
      detalle: 'Intereses y rendimientos financieros pagados (Concepto: 5063)',
      valor: 786_273,
      usoSugerido: 'R58',
    }),
    // Saldo bancario — NO sugerir como activo (viene del certificado)
    fila({
      nombreInformante: 'NU COLOMBIA',
      detalle: 'Saldo cuentas bancarias (Titular Principal)',
      valor: 20_902_486,
      usoSugerido: 'R29 Patrimonio Bruto',
    }),
    // Saldo de FIC — SÍ sugerir como activo
    fila({
      nombreInformante: 'FIDUCIARIA EJEMPLO UNO S.A.',
      detalle: 'Saldo Inversión en fondos de inversión colectiva (Titular Principal)',
      valor: 1_467_428,
      usoSugerido: 'R29 Patrimonio Bruto (si el saldo es positivo)',
    }),
  ],
};

describe('precarga desde exógena', () => {
  const precarga = precargarDesdeExogena(EXOGENA);

  it('precarga rendimientos de cesantías y de carteras colectivas sin duplicar', () => {
    expect(precarga.respuestas.rendimientosSinComponente).toBe(382_694);
    expect(precarga.respuestas.rendimientosAdicionalesConComponente).toBe(6_103);
  });

  it('sugiere como activos los saldos no bancarios', () => {
    expect(precarga.sugerenciasActivos).toHaveLength(1);
    expect(precarga.sugerenciasActivos[0]?.valor).toBe(1_467_428);
  });

  it('el resumen menciona los valores precargados para el prompt', () => {
    expect(precarga.resumen).toContain('382.694');
    expect(precarga.resumen).toContain('CONFIRMAR');
    expect(precarga.resumen).toContain('FIDUCIARIA EJEMPLO UNO');
  });
});
