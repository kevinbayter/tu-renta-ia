import { errorDeTitularidad } from '@turenta/core';

import { obtenerRepositorio } from '@/server/composicion';

import type { SolicitudConexionDian } from '@turenta/core';

/** Reads who this user is and whom they prepare returns for; the rule itself lives in core. */
export async function verificarTitularidad(
  usuarioId: string,
  solicitud: SolicitudConexionDian,
): Promise<string | null> {
  const repositorio = obtenerRepositorio();
  const [perfil, declaraciones, personas] = await Promise.all([
    repositorio.obtenerPerfil(usuarioId),
    repositorio.listarDeclaraciones(usuarioId),
    repositorio.listarPersonas(usuarioId),
  ]);
  const deDeclaraciones = declaraciones.filter((d) => !d.titular.esPropia).map((d) => d.titular.identificacion);
  return errorDeTitularidad(solicitud, {
    cedulaUsuario: perfil?.identificacion ?? '',
    cedulasDeTerceros: [...deDeclaraciones, ...personas.map((p) => p.identificacion)],
  });
}
