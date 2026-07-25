import { describe, expect, it } from 'vitest';

import {
  evaluarAmbito,
  evaluarConexionDian,
  LIMITES,
  vigentes,
} from '../src/dian/limite-conexiones';

/** Fixed instant: limits are tested by moving this number, not by waiting. */
const AHORA = 1_800_000_000_000;

function hace(minutos: number): number {
  return AHORA - minutos * 60_000;
}

describe('límites de conexión con el MUISCA', () => {
  it('deja pasar cuando no hay intentos previos', () => {
    expect(evaluarConexionDian({}, AHORA)).toEqual({ permitido: true, esperarSegundos: 0 });
  });

  it('descarta las marcas fuera de la ventana', () => {
    const marcas = [hace(60), hace(1)];
    expect(vigentes(marcas, LIMITES.usuario.ventanaMs, AHORA)).toEqual([hace(1)]);
  });

  it('bloquea al usuario tras agotar sus intentos en la ventana', () => {
    const marcas = [hace(1), hace(2), hace(3)];
    const veredicto = evaluarAmbito('usuario', marcas, AHORA);
    expect(veredicto.permitido).toBe(false);
    expect(veredicto.ambito).toBe('usuario');
    expect(veredicto.esperarSegundos).toBeGreaterThan(0);
  });

  it('vuelve a permitir cuando las marcas envejecen fuera de la ventana', () => {
    const marcas = [hace(20), hace(21), hace(22)];
    expect(evaluarAmbito('usuario', marcas, AHORA).permitido).toBe(true);
  });

  it('dos credenciales rechazadas frenan una hora: eso es un ataque de credenciales', () => {
    const veredicto = evaluarAmbito('fallos', [hace(1), hace(2)], AHORA);
    expect(veredicto.permitido).toBe(false);
    // Queda cerca de una hora de espera, no unos segundos.
    expect(veredicto.esperarSegundos).toBeGreaterThan(50 * 60);
  });

  it('el ámbito más específico manda sobre el global', () => {
    const veredicto = evaluarConexionDian(
      {
        fallos: [hace(1), hace(2)],
        usuario: [hace(1), hace(2), hace(3)],
        global: Array.from({ length: 10 }, () => hace(1)),
      },
      AHORA,
    );
    expect(veredicto.ambito).toBe('fallos');
  });

  it('el techo global protege aunque cada usuario esté dentro de su límite', () => {
    const veredicto = evaluarConexionDian(
      { global: Array.from({ length: LIMITES.global.maximo }, () => hace(1)) },
      AHORA,
    );
    expect(veredicto.permitido).toBe(false);
    expect(veredicto.ambito).toBe('global');
  });

  it('esperarSegundos nunca es 0 cuando se bloquea: Retry-After debe ser útil', () => {
    // La marca más antigua está justo al borde de salir de la ventana.
    const alBorde = AHORA - LIMITES.usuario.ventanaMs + 100;
    const veredicto = evaluarAmbito('usuario', [alBorde, hace(1), hace(2)], AHORA);
    expect(veredicto.permitido).toBe(false);
    expect(veredicto.esperarSegundos).toBeGreaterThanOrEqual(1);
  });

  it('bloquea a la misma cédula consultada desde varias cuentas nuestras', () => {
    const marcas = Array.from({ length: LIMITES.documento.maximo }, () => hace(1));
    expect(evaluarConexionDian({ documento: marcas }, AHORA).ambito).toBe('documento');
  });
});
