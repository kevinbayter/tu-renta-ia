/**
 * Builds the DIAN connection from the environment, same pattern as
 * `crearLlmDesdeEnv` and `crearEmailDesdeEnv`.
 *
 * With no worker configured the app still boots: the connection reports
 * 'servicio_no_disponible' and the manual path stays alive (PLAN-DIAN §1.4).
 */

import type { ConexionDianPort, ResultadoDescarga } from '@turenta/core';

import { ConexionDianRemota } from './conexion-dian-remota';


const SIN_WORKER: ResultadoDescarga = {
  exito: false,
  motivoFallo: 'servicio_no_disponible',
  detalle: 'La conexión automática con la DIAN no está habilitada en este despliegue',
};

class ConexionDianDeshabilitada implements ConexionDianPort {
  descargarExogena(): Promise<ResultadoDescarga> {
    return Promise.resolve(SIN_WORKER);
  }

  descargarDeclaracion(): Promise<ResultadoDescarga> {
    return Promise.resolve(SIN_WORKER);
  }

  diligenciarDeclaracion(): Promise<ResultadoDescarga> {
    return Promise.resolve(SIN_WORKER);
  }

  presentarDeclaracion(): Promise<ResultadoDescarga> {
    return Promise.resolve(SIN_WORKER);
  }
}

export function crearConexionDianDesdeEnv(env: Record<string, string | undefined>): ConexionDianPort {
  const url = env['WORKER_DIAN_URL'];
  const token = env['WORKER_DIAN_TOKEN'];
  if (!url || !token) {
    return new ConexionDianDeshabilitada();
  }
  return new ConexionDianRemota({ url, token });
}

const VARIABLES_DIAN = ['WORKER_DIAN_URL', 'WORKER_DIAN_TOKEN'] as const;

/** Lets the UI hide the button instead of offering something that will fail. */
export function conexionDianHabilitada(env: Record<string, string | undefined>): boolean {
  return variablesFaltantesDian(env).length === 0;
}

/**
 * Cuáles faltan, por nombre: sin esto, quien clona el repositorio ve que el
 * botón de presentar no aparece y no tiene ninguna pista de por qué.
 */
export function variablesFaltantesDian(env: Record<string, string | undefined>): string[] {
  return VARIABLES_DIAN.filter((nombre) => !env[nombre]);
}
