import { describe, expect, it } from 'vitest';

import { clasificarResultado } from '../src/declaracion/clasificacion';
import { progresoDeclaracion } from '../src/declaracion/progreso';

describe('progresoDeclaracion — 5 pasos', () => {
  it('declaración recién creada: paso 1 (exógena), 0%', () => {
    expect(progresoDeclaracion({ paso: 'exogena', documentos: [] })).toEqual({
      paso: 1,
      totalPasos: 5,
      porcentaje: 0,
    });
  });

  it('exógena cargada y en documentos: paso 2, 20%', () => {
    const estado = { paso: 'documentos', documentos: [{ tipo: 'exogena' }] };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 2, totalPasos: 5, porcentaje: 20 });
  });

  it('exógena + certificados, en la entrevista: paso 3, 40%', () => {
    const estado = { paso: 'entrevista', documentos: [{ tipo: 'exogena' }, { tipo: 'certificado_220' }] };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 3, totalPasos: 5, porcentaje: 40 });
  });

  it('entrevista completa en revisión sin calcular: paso 4, 60%', () => {
    const estado = {
      paso: 'revision',
      documentos: [{ tipo: 'exogena' }, { tipo: 'certificado_220' }],
      entrevistaCompleta: true,
      resultado: null,
    };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 4, totalPasos: 5, porcentaje: 60 });
  });

  it('terminada con todos los hitos: paso 5, 100%', () => {
    const estado = {
      paso: 'resultado',
      documentos: [{ tipo: 'exogena' }, { tipo: 'certificado_220' }],
      entrevistaCompleta: true,
      resultado: { casillas: {} },
    };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 5, totalPasos: 5, porcentaje: 100 });
  });

  it('terminada pero sin certificados: 80% — el hito de certificados queda pendiente', () => {
    const estado = {
      paso: 'resultado',
      documentos: [{ tipo: 'exogena' }],
      entrevistaCompleta: true,
      resultado: { casillas: {} },
    };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 5, totalPasos: 5, porcentaje: 80 });
  });

  it('tolera estados desconocidos o corruptos', () => {
    expect(progresoDeclaracion(null)).toEqual({ paso: 1, totalPasos: 5, porcentaje: 0 });
    expect(progresoDeclaracion({ paso: 'otro' })).toEqual({ paso: 1, totalPasos: 5, porcentaje: 0 });
  });
});

describe('clasificarResultado — estados honestos', () => {
  it('sin resultado calculado: en progreso', () => {
    expect(clasificarResultado(null, null)).toBe('en_progreso');
  });

  it('saldo a favor positivo', () => {
    expect(clasificarResultado(1_401_000, 0)).toBe('saldo_a_favor');
  });

  it('a pagar solo cuando el valor es mayor que cero', () => {
    expect(clasificarResultado(0, 350_000)).toBe('a_pagar');
  });

  it('cero y cero: sin saldo — JAMÁS "pendiente de pago $0"', () => {
    expect(clasificarResultado(0, 0)).toBe('sin_saldo');
    expect(clasificarResultado(0, null)).toBe('sin_saldo');
  });
});
