import { describe, expect, it } from 'vitest';

import { notificacionesDeVencimiento } from '../src/notificaciones/vencimientos';

const BASE = { titular: 'Ana Ramírez', identificacion: '123456', anioGravable: 2025, fechaLegible: '24 de sep de 2026' };

describe('notificacionesDeVencimiento', () => {
  it('no notifica cuando faltan más de 60 días', () => {
    expect(notificacionesDeVencimiento([{ ...BASE, dias: 61 }])).toEqual([]);
  });

  it('usa el umbral más cercano y marca críticos los de 30 días o menos', () => {
    const [a60] = notificacionesDeVencimiento([{ ...BASE, dias: 59 }]);
    expect(a60?.claveIdempotencia).toBe('vencimiento-123456-2025-60');
    expect(a60?.esCritica).toBe(false);
    const [a15] = notificacionesDeVencimiento([{ ...BASE, dias: 12 }]);
    expect(a15?.claveIdempotencia).toBe('vencimiento-123456-2025-15');
    expect(a15?.esCritica).toBe(true);
  });

  it('vencida: aviso crítico con clave propia', () => {
    const [vencida] = notificacionesDeVencimiento([{ ...BASE, dias: -3 }]);
    expect(vencida?.claveIdempotencia).toBe('vencimiento-123456-2025-vencida');
    expect(vencida?.esCritica).toBe(true);
    expect(vencida?.titulo).toContain('vencida');
  });
});
