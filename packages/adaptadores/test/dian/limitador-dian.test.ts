import { describe, expect, it } from 'vitest';

import { LIMITES } from '@turenta/core';

import { LimitadorDian } from '../../src/dian/limitador-dian';

const CLAVE = { usuarioId: 'usuario-1', numeroDocumento: '1000000001' };
const OTRO_USUARIO = { usuarioId: 'usuario-2', numeroDocumento: '1000000002' };

/** Fake clock: limits are tested by moving time, not by waiting for it. */
function relojFalso(inicio = 1_800_000_000_000) {
  let ahora = inicio;
  return {
    leer: () => ahora,
    avanzarMinutos: (minutos: number) => {
      ahora += minutos * 60_000;
    },
  };
}

describe('limitador de conexiones con la DIAN', () => {
  it('permite el primer intento', () => {
    const limitador = new LimitadorDian(relojFalso().leer);
    expect(limitador.consultar(CLAVE).permitido).toBe(true);
  });

  it('bloquea al usuario tras agotar sus intentos', () => {
    const reloj = relojFalso();
    const limitador = new LimitadorDian(reloj.leer);
    for (let i = 0; i < LIMITES.usuario.maximo; i += 1) {
      limitador.registrarIntento(CLAVE);
    }
    expect(limitador.consultar(CLAVE).permitido).toBe(false);
  });

  it('vuelve a permitir cuando pasa la ventana', () => {
    const reloj = relojFalso();
    const limitador = new LimitadorDian(reloj.leer);
    for (let i = 0; i < LIMITES.usuario.maximo; i += 1) {
      limitador.registrarIntento(CLAVE);
    }
    expect(limitador.consultar(CLAVE).permitido).toBe(false);
    reloj.avanzarMinutos(LIMITES.usuario.ventanaMs / 60_000 + 1);
    expect(limitador.consultar(CLAVE).permitido).toBe(true);
  });

  it('dos credenciales rechazadas frenan a ese usuario una hora', () => {
    const reloj = relojFalso();
    const limitador = new LimitadorDian(reloj.leer);
    limitador.registrarFallo(CLAVE);
    limitador.registrarFallo(CLAVE);
    const veredicto = limitador.consultar(CLAVE);
    expect(veredicto.permitido).toBe(false);
    expect(veredicto.ambito).toBe('fallos');
    reloj.avanzarMinutos(59);
    expect(limitador.consultar(CLAVE).permitido).toBe(false);
    reloj.avanzarMinutos(2);
    expect(limitador.consultar(CLAVE).permitido).toBe(true);
  });

  it('el bloqueo de un usuario no afecta a otro', () => {
    const limitador = new LimitadorDian(relojFalso().leer);
    limitador.registrarFallo(CLAVE);
    limitador.registrarFallo(CLAVE);
    expect(limitador.consultar(CLAVE).permitido).toBe(false);
    expect(limitador.consultar(OTRO_USUARIO).permitido).toBe(true);
  });

  it('la misma cédula desde otra cuenta también cuenta: es la cuenta atacada', () => {
    const limitador = new LimitadorDian(relojFalso().leer);
    const mismaCedula = { usuarioId: 'otro-usuario', numeroDocumento: CLAVE.numeroDocumento };
    for (let i = 0; i < LIMITES.documento.maximo; i += 1) {
      limitador.registrarIntento(CLAVE);
    }
    expect(limitador.consultar(mismaCedula).permitido).toBe(false);
  });

  it('el portón de concurrencia bloquea mientras hay conexiones abiertas', async () => {
    const limitador = new LimitadorDian(relojFalso().leer);
    let dentro = false;
    await limitador.conPermiso(() => {
      dentro = limitador.consultar(OTRO_USUARIO).permitido;
      return Promise.resolve('listo');
    });
    // With two operations in flight, a third is refused.
    expect(dentro).toBe(true);
    const bloqueo = limitador.conPermiso(() =>
      limitador.conPermiso(() => Promise.resolve(limitador.consultar(OTRO_USUARIO).permitido)),
    );
    expect(await bloqueo).toBe(false);
  });

  it('libera el portón aunque la operación falle', async () => {
    const limitador = new LimitadorDian(relojFalso().leer);
    await limitador.conPermiso(() => Promise.reject(new Error('falló'))).catch(() => null);
    expect(limitador.consultar(CLAVE).permitido).toBe(true);
  });
});
