import { describe, expect, it } from 'vitest';

import { MARCA_REDACTADO } from '@turenta/core';

import { clasificarError, detalleDeError, fallo } from '../../src/dian/motivos-fallo';

const CLAVE = 'clave-centinela-123';

describe('clasificación de errores del portal', () => {
  it('un timeout de Playwright es tiempo_agotado', () => {
    // Literal Playwright message, so the test breaks if it changes.
    const error = new Error('locator.click: Timeout 45000ms exceeded.');
    expect(clasificarError(error)).toBe('tiempo_agotado');
  });

  it('un error de red es portal_no_disponible', () => {
    expect(clasificarError(new Error('page.goto: net::ERR_CONNECTION_REFUSED'))).toBe('portal_no_disponible');
    expect(clasificarError(new Error('connect ECONNREFUSED 127.0.0.1:443'))).toBe('portal_no_disponible');
  });

  it('lo que no se reconoce cae en desconocido, no en un motivo que mienta', () => {
    expect(clasificarError(new Error('algo raro'))).toBe('desconocido');
    expect(clasificarError('ni siquiera es un Error')).toBe('desconocido');
    expect(clasificarError(null)).toBe('desconocido');
  });

  it('fallo() nunca marca éxito ni devuelve contenido', () => {
    const resultado = fallo('estructura_cambiada', 'detalle');
    expect(resultado.exito).toBe(false);
    expect(resultado.contenido).toBeUndefined();
  });
});

describe('detalle publicable de un error', () => {
  it('descarta el volcado del DOM que Playwright adjunta', () => {
    // The Call log can carry the whole portal page, with taxpayer data.
    const error = new Error(
      `Timeout 45000ms exceeded.\nCall log:\n  - waiting for locator\n  - <html>PEPITA PEREZ 79.123.456</html>`,
    );
    const detalle = detalleDeError(error, [CLAVE]);
    expect(detalle).toBe('Error: Timeout 45000ms exceeded.');
    expect(detalle).not.toContain('PEPITA PEREZ');
  });

  it('borra la contraseña aunque el portal la haya devuelto en el eco', () => {
    const detalle = detalleDeError(new Error(`falló enviando ${CLAVE}`), [CLAVE]);
    expect(detalle).not.toContain(CLAVE);
    expect(detalle).toContain(MARCA_REDACTADO);
  });
});
