import { describe, expect, it } from 'vitest';

import {
  autorizacionVigente,
  crearAutorizacion,
  MINUTOS_VIGENCIA_AUTORIZACION,
  permiteAlcance,
  textoAutorizacion,
} from '../src/dian/autorizacion';

const AHORA = new Date('2026-08-15T10:00:00Z');

function autorizacionDe(alcances: Parameters<typeof crearAutorizacion>[0]['alcances']) {
  return crearAutorizacion(
    {
      titularIdentificacion: '1234567890',
      operadorUsuarioId: 'usuario-1',
      alcances,
      textoAceptado: 'texto',
    },
    AHORA,
  );
}

describe('autorización para operar en la DIAN', () => {
  it('vence sola: no quedan permisos abiertos', () => {
    const auth = autorizacionDe(['leer_exogena']);
    expect(auth.expiraEn.getTime() - auth.otorgadaEn.getTime()).toBe(MINUTOS_VIGENCIA_AUTORIZACION * 60_000);
    expect(autorizacionVigente(auth, AHORA)).toBe(true);
    const despues = new Date(AHORA.getTime() + (MINUTOS_VIGENCIA_AUTORIZACION + 1) * 60_000);
    expect(autorizacionVigente(auth, despues)).toBe(false);
  });

  it('solo habilita los alcances enumerados: nunca se asume uno mayor', () => {
    const auth = autorizacionDe(['leer_exogena']);
    expect(permiteAlcance(auth, 'leer_exogena', AHORA)).toBe(true);
    expect(permiteAlcance(auth, 'presentar_declaracion', AHORA)).toBe(false);
    expect(permiteAlcance(auth, 'leer_declaraciones', AHORA)).toBe(false);
  });

  it('una autorización vencida no habilita ni siquiera su propio alcance', () => {
    const auth = autorizacionDe(['leer_exogena']);
    const tarde = new Date(AHORA.getTime() + 60 * 60_000);
    expect(permiteAlcance(auth, 'leer_exogena', tarde)).toBe(false);
  });

  it('el texto legal dice lo esencial: no almacenamos, vence, es revocable', () => {
    const texto = textoAutorizacion('1234567890', ['leer_exogena']);
    expect(texto).toContain('1234567890');
    expect(texto).toContain('NO serán almacenadas');
    expect(texto).toContain('revocable');
    expect(texto).toContain('manualmente en el portal de la DIAN');
  });

  it('distingue titular de operador (base del futuro B2B con contadores)', () => {
    const auth = crearAutorizacion(
      {
        titularIdentificacion: '99999999',
        operadorUsuarioId: 'contador-7',
        alcances: ['leer_exogena'],
        textoAceptado: 'texto',
      },
      AHORA,
    );
    expect(auth.titularIdentificacion).not.toBe(auth.operadorUsuarioId);
  });
});
