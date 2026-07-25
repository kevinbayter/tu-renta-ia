import { describe, expect, it } from 'vitest';

import { fechaVencimiento, ultimosDosDigitos } from '../src/calendario/vencimientos';
import { AG2025 } from '../src/constantes/ag2025';

import type { ConstantesAnio } from '../src/constantes/tipos';

describe('calendario de vencimientos AG2025 (Decreto 2229/2023)', () => {
  it('tiene exactamente 50 fechas (pares 01-02 a 99-00)', () => {
    expect(AG2025.calendarioVencimientos).toHaveLength(50);
  });

  it('cédula terminada en 61 vence el 24 de septiembre de 2026', () => {
    expect(fechaVencimiento('1234567861', AG2025)).toBe('2026-09-24');
  });

  it('bordes del calendario: 01/02 primera fecha, 99/00 última', () => {
    expect(fechaVencimiento('1000000001', AG2025)).toBe('2026-08-12');
    expect(fechaVencimiento('1000000002', AG2025)).toBe('2026-08-12');
    expect(fechaVencimiento('1000000099', AG2025)).toBe('2026-10-26');
    expect(fechaVencimiento('1000000100', AG2025)).toBe('2026-10-26');
  });

  it('acepta identificaciones con puntos o espacios', () => {
    expect(fechaVencimiento('1.234.567.861', AG2025)).toBe('2026-09-24');
  });

  it('ultimosDosDigitos extrae correctamente', () => {
    expect(ultimosDosDigitos('1234567861')).toBe(61);
    expect(ultimosDosDigitos('900')).toBe(0);
    expect(() => ultimosDosDigitos('7')).toThrow('al menos dos dígitos');
  });

  it('calendario incompleto → error de configuración', () => {
    const rotas: ConstantesAnio = { ...AG2025, calendarioVencimientos: ['2026-08-12'] };
    expect(() => fechaVencimiento('1234567890', rotas)).toThrow('incompleto');
  });
});
