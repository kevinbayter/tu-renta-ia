import { obtenerBovedaDian } from '@/server/composicion';

import type { AccesoGuardado, ResultadoDescarga, SobreCifrado } from '@turenta/core';

/**
 * Stored DIAN access, at the user's explicit request.
 *
 * This layer moves a sealed envelope it cannot open: the key lives in the
 * isolated worker. Losing the database therefore leaks no password.
 */

export interface AccesoParaOperar {
  cifrado: SobreCifrado | undefined;
  numeroDocumento: string | undefined;
  tipoDocumento: string | undefined;
  id: string | undefined;
}

const SIN_ACCESO: AccesoParaOperar = {
  cifrado: undefined,
  numeroDocumento: undefined,
  tipoDocumento: undefined,
  id: undefined,
};

/** What we already have stored for this taxpayer, if anything. */
export async function accesoDe(usuarioId: string, titular: string): Promise<AccesoParaOperar> {
  const guardado = await obtenerBovedaDian()
    .buscar(usuarioId, titular)
    .catch(() => null);
  return guardado ? aAcceso(guardado) : SIN_ACCESO;
}

function aAcceso(guardado: AccesoGuardado): AccesoParaOperar {
  return {
    cifrado: guardado.cifrado,
    numeroDocumento: guardado.numeroDocumento,
    tipoDocumento: guardado.tipoDocumento,
    id: guardado.id,
  };
}

/**
 * Persists the envelope the worker sealed. Never called unless the operation
 * succeeded and the user ticked the box, since only then is it both consented
 * and known to work.
 */
export async function guardarSiProcede(
  resultado: ResultadoDescarga,
  usuarioId: string,
  titular: string,
  credencial: { tipoDocumento: string; numeroDocumento: string },
): Promise<void> {
  if (!resultado.cifrado) {
    return;
  }
  await obtenerBovedaDian()
    .guardar(usuarioId, titular, { ...credencial, cifrado: resultado.cifrado })
    .catch(() => null);
}

/** A stored access that stops working is dropped: it only causes friction. */
export async function olvidarSiCaduco(
  resultado: ResultadoDescarga,
  usuarioId: string,
  titular: string,
): Promise<void> {
  const caduco = resultado.motivoFallo === 'acceso_caducado' || resultado.motivoFallo === 'credenciales_invalidas';
  if (!caduco) {
    return;
  }
  await obtenerBovedaDian().olvidar(usuarioId, titular).catch(() => null);
}

export async function marcarUso(id: string | undefined, ahora: Date): Promise<void> {
  if (id === undefined) {
    return;
  }
  await obtenerBovedaDian().marcarUso(id, ahora).catch(() => null);
}
