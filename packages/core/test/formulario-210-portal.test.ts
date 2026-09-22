import { describe, expect, it } from 'vitest';

import {
  CASILLAS_ENTRADA_210,
  CASILLAS_VERIFICADAS_210,
  diferenciasConPortal,
  anclasSinLeer,
  montoDelPortal,
  nombreDeSeccion210,
  valoresDeEntrada210,
} from '../src/dian/formulario-210-portal';

const MOTOR = { '32': 50_000_000, '58': 16_181_000, '59': 1_000, '60': 2_235_000, '61': 13_945_000, '297': 9_361_000 };

describe('el 210 del portal: qué se digita y qué se verifica', () => {
  it('ninguna casilla es a la vez de entrada y verificada', () => {
    const entrada = new Set(CASILLAS_ENTRADA_210);
    expect(CASILLAS_VERIFICADAS_210.filter((c) => entrada.has(c))).toEqual([]);
  });

  it('digita las compras (297), no el 1% (28): el portal lo calcula', () => {
    const valores = valoresDeEntrada210(MOTOR);
    expect(valores['297']).toBe(9_361_000);
    expect(valores).not.toHaveProperty('28');
  });

  it('los salarios del motor (32) van a la casilla 355 del portal', () => {
    expect(valoresDeEntrada210(MOTOR)['355']).toBe(50_000_000);
  });

  it('lo que el motor no produce se digita en 0 para pisar la sugerida de la DIAN', () => {
    const valores = valoresDeEntrada210(MOTOR);
    expect(valores['74']).toBe(0);
    expect(Object.keys(valores)).toHaveLength(CASILLAS_ENTRADA_210.length);
  });

  it('reporta solo las casillas calculadas que el portal mostró y no cuadran', () => {
    expect(diferenciasConPortal(MOTOR, { '61': 13_945_000, '91': 13_945_000, '97': 13_851_000 })).toEqual([
      { casilla: '91', turenta: 0, portal: 13_945_000 },
      { casilla: '97', turenta: 0, portal: 13_851_000 },
    ]);
    expect(diferenciasConPortal({ ...MOTOR, '91': 13_945_000 }, { '91': 13_945_000 })).toEqual([]);
  });

  it('lee montos con separadores de miles de cualquier tipo', () => {
    expect(montoDelPortal('16,181,000')).toBe(16_181_000);
    expect(montoDelPortal('16.181.000')).toBe(16_181_000);
    expect(montoDelPortal('')).toBe(0);
  });
});

describe('nombre de la sección para el progreso', () => {
  it('reconoce la sección por una casilla propia', () => {
    expect(nombreDeSeccion210(['58', '59', '60', '61'])).toBe('rentas de capital');
    expect(nombreDeSeccion210(['111', '116', '122', '126'])).toBe('liquidación privada');
    expect(nombreDeSeccion210(['136', '137'])).toBe('total a pagar');
  });

  it('una sección desconocida no inventa nombre', () => {
    expect(nombreDeSeccion210(['999'])).toBe('');
  });
});

describe('recorrido completo antes de guardar', () => {
  it('si el robot solo vio la primera sección, faltan todas las anclas', () => {
    expect(anclasSinLeer({ '5': 0, '286': 1, '24': 20 })).toEqual(['31', '91', '111']);
  });

  it('con patrimonio, cédula general y liquidación leídas, está completo', () => {
    expect(anclasSinLeer({ '31': 1, '91': 0, '111': 0 })).toEqual([]);
  });
});
