import { describe, expect, it } from 'vitest';

import { clasificarResultado } from '../src/declaracion/clasificacion';
import { progresoDeclaracion } from '../src/declaracion/progreso';

describe('progresoDeclaracion', () => {
  it('declaración recién creada: paso 1, 0%', () => {
    expect(progresoDeclaracion({ paso: 'documentos', documentos: [] })).toEqual({
      paso: 1,
      totalPasos: 4,
      porcentaje: 0,
    });
  });

  it('con documentos y en la entrevista: paso 2, 25%', () => {
    expect(progresoDeclaracion({ paso: 'entrevista', documentos: [{}] })).toEqual({
      paso: 2,
      totalPasos: 4,
      porcentaje: 25,
    });
  });

  it('entrevista completa en revisión sin calcular: paso 3, 50%', () => {
    const estado = { paso: 'revision', documentos: [{}], entrevistaCompleta: true, resultado: null };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 3, totalPasos: 4, porcentaje: 50 });
  });

  it('terminada: paso 4, 100%', () => {
    const estado = { paso: 'resultado', documentos: [{}], entrevistaCompleta: true, resultado: { casillas: {} } };
    expect(progresoDeclaracion(estado)).toEqual({ paso: 4, totalPasos: 4, porcentaje: 100 });
  });

  it('tolera estados desconocidos o corruptos', () => {
    expect(progresoDeclaracion(null)).toEqual({ paso: 1, totalPasos: 4, porcentaje: 0 });
    expect(progresoDeclaracion({ paso: 'otro' })).toEqual({ paso: 1, totalPasos: 4, porcentaje: 0 });
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
