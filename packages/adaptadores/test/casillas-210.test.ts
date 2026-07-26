import { describe, expect, it } from 'vitest';

import { anioGravableDe, extraerCasillas210 } from '../src/extraccion/certificados/casillas-210';

/**
 * Deterministic reading of an already filed form 210. Figures are invented but
 * the layouts mimic how PDF text extraction usually delivers the form.
 */

const CON_ETIQUETAS = `
DIAN Declaración de Renta y Complementarios Personas Naturales
Año 2024
31 Total patrimonio líquido 111.111.000
126 Impuesto neto de renta 2.222.000
133 Anticipo renta para el año gravable siguiente 333.000
137 Total saldo a favor 444.000
`;

const SOLO_NUMEROS = `
Formulario 210
Año gravable: 2023
31 555.555.000
126 6.666.000
133 777.000
137 888.000
`;

describe('lectura determinista del formulario 210', () => {
  it('lee las casillas cuando vienen con su etiqueta', () => {
    expect(extraerCasillas210(CON_ETIQUETAS)).toEqual({
      anioGravable: 2024,
      patrimonioLiquido: 111111000,
      impuestoNetoRenta: 2222000,
      anticipoAnioSiguiente: 333000,
      totalSaldoAFavor: 444000,
    });
  });

  it('lee las casillas cuando solo viene el número', () => {
    const leido = extraerCasillas210(SOLO_NUMEROS);
    expect(leido?.anioGravable).toBe(2023);
    expect(leido?.patrimonioLiquido).toBe(555555000);
    expect(leido?.impuestoNetoRenta).toBe(6666000);
  });

  it('una casilla ausente vale cero, no rompe la lectura', () => {
    const sinSaldo = CON_ETIQUETAS.replace('137 Total saldo a favor 444.000', '');
    expect(extraerCasillas210(sinSaldo)?.totalSaldoAFavor).toBe(0);
  });

  it('devuelve null si no reconoce el formato: mejor el modelo que un número inventado', () => {
    // Sin esto, una cifra equivocada distorsionaría la declaración entera.
    expect(extraerCasillas210('un texto cualquiera sin casillas')).toBeNull();
    expect(extraerCasillas210('Año 2024 pero sin patrimonio')).toBeNull();
  });

  it('toma el año gravable del encabezado, no una fecha cualquiera', () => {
    expect(anioGravableDe('Año 2024')).toBe(2024);
    expect(anioGravableDe('Año gravable: 2023')).toBe(2023);
    expect(anioGravableDe('sin año')).toBeNull();
  });

  it('ignora años imposibles para una declaración', () => {
    expect(anioGravableDe('Año 1999')).toBeNull();
  });

  it('entiende el formato de miles con puntos', () => {
    const leido = extraerCasillas210(CON_ETIQUETAS);
    // 111.111.000 son ciento once millones, no ciento once.
    expect(leido?.patrimonioLiquido).toBeGreaterThan(100_000_000);
  });
});
