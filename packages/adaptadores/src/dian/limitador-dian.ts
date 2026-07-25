/**
 * Store of DIAN connection attempts. The decision lives in core
 * (`evaluarConexionDian`, pure); only state lives here.
 *
 * In memory on purpose: a single app instance is enough, and losing the counters
 * on restart beats adding a dependency to the critical path.
 */

import { evaluarConexionDian, MAXIMO_CONEXIONES_CONCURRENTES } from '@turenta/core';
import type { AmbitoLimite, Veredicto } from '@turenta/core';

export interface ClaveLimite {
  usuarioId: string;
  numeroDocumento: string;
}

/** Recent history only; older marks are dropped on read. */
const VENTANA_MAXIMA_MS = 60 * 60_000;

export class LimitadorDian {
  private readonly marcas = new Map<string, number[]>();
  private concurrentes = 0;

  constructor(private readonly ahora: () => number = () => Date.now()) {}

  /** Can it connect? Read-only: records nothing. */
  consultar(clave: ClaveLimite): Veredicto {
    if (this.concurrentes >= MAXIMO_CONEXIONES_CONCURRENTES) {
      return { permitido: false, ambito: 'global', esperarSegundos: 60 };
    }
    return evaluarConexionDian(
      {
        fallos: this.leer(`fallos:${clave.usuarioId}`),
        usuario: this.leer(`usuario:${clave.usuarioId}`),
        documento: this.leer(`documento:${clave.numeroDocumento}`),
        global: this.leer('global'),
      },
      this.ahora(),
    );
  }

  /** Records an attempt, successful or not. */
  registrarIntento(clave: ClaveLimite): void {
    this.anotar(`usuario:${clave.usuarioId}`);
    this.anotar(`documento:${clave.numeroDocumento}`);
    this.anotar('global');
  }

  /** Records that DIAN rejected the credentials: this is what stops an attack. */
  registrarFallo(clave: ClaveLimite): void {
    this.anotar(`fallos:${clave.usuarioId}`);
  }

  /** Concurrency gate: every open connection is a live Chromium. */
  async conPermiso<T>(operacion: () => Promise<T>): Promise<T> {
    this.concurrentes += 1;
    try {
      return await operacion();
    } finally {
      this.concurrentes -= 1;
    }
  }

  private leer(clave: string): number[] {
    const ahora = this.ahora();
    const vigentes = (this.marcas.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MAXIMA_MS);
    this.marcas.set(clave, vigentes);
    return vigentes;
  }

  private anotar(clave: string): void {
    this.marcas.set(clave, [...this.leer(clave), this.ahora()]);
  }
}

/** Scopes the UI can turn into a concrete message. */
export type AmbitoBloqueado = AmbitoLimite;
