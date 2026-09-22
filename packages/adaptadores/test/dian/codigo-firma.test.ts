import { describe, expect, it } from 'vitest';

import { extraerCodigo } from '../../src/dian/codigo-firma-muisca';

/**
 * El aviso de la DIAN llega entre una lista de comunicados con fechas y números
 * de formulario. Devolver uno de esos como código es peor que no encontrar
 * nada: el portal lo rechaza sin decir por qué y el usuario no entiende.
 */
describe('leer el código electrónico del aviso de la DIAN', () => {
  it('lo saca del texto que lo anuncia', () => {
    expect(extraerCodigo('Su código electrónico es: A1B2C3D4')).toBe('A1B2C3D4');
    expect(extraerCodigo('Código de verificación 839201')).toBe('839201');
    expect(extraerCodigo('Se informa clave dinámica: 55f3a9c1')).toBe('55f3a9c1');
  });

  it('no confunde la fecha del aviso con el código', () => {
    expect(extraerCodigo('Se informa código electrónico 20/09/2026')).toBeNull();
  });

  it('exige al menos un dígito: una palabra suelta no es un código', () => {
    expect(extraerCodigo('Código electrónico enviado correctamente')).toBeNull();
  });

  it('sin nada que lo anuncie no inventa un código', () => {
    expect(extraerCodigo('Generación de la firma electrónica exitosa. Formulario 4444444444444')).toBeNull();
    expect(extraerCodigo('')).toBeNull();
  });

  /**
   * Calcado a mano de la estructura del aviso real (20-sep-2026): el código va
   * seis palabras después de "clave dinámica", no pegado a ella, y el mensaje
   * sigue con fechas que no deben confundirse con él. Cifras y nombre ficticios.
   */
  it('lee el aviso de firmado del portal, donde el código va lejos del anuncio', () => {
    const aviso = `Comunicación de servicio Se ha generado una clave dinámica
      Señor (a) usuario (a): PEREZ PEREZ JUANA
      A continuación, se entrega la clave dinámica solicitada para realizar el trámite:
      QWer1234
      Tu clave dinámica está vigente desde 20/09/2026 03:59:18 PM hasta 20/09/2026 05:59:18 PM`;
    expect(extraerCodigo(aviso)).toBe('QWer1234');
  });

  it('aguanta los saltos de línea del correo del portal', () => {
    expect(extraerCodigo('Su código\n  electrónico\n\n  es\n  ZX9912')).toBe('ZX9912');
  });
});
