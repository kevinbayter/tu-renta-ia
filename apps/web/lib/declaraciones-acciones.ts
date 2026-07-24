'use client';

import { useDeclaracion } from './store';
import { RESPUESTAS_INICIALES } from './tipos';

import type { DeclaracionResumen, PerfilUsuario } from '@turenta/core';

/** Carga una declaración guardada al store del wizard (para "Continuar"). */
export async function cargarDeclaracionEnStore(declaracion: DeclaracionResumen): Promise<boolean> {
  const respuesta = await fetch(`/api/declaraciones/${declaracion.id}`).catch(() => null);
  if (!respuesta?.ok) {
    return false;
  }
  const { estado } = (await respuesta.json()) as { estado: Record<string, unknown> };
  const store = useDeclaracion.getState();
  store.reiniciar();
  store.hidratar(estado);
  store.establecerTitular(
    {
      nombres: declaracion.titular.nombres,
      apellidos: declaracion.titular.apellidos,
      identificacion: declaracion.titular.identificacion,
    },
    declaracion.titular.esPropia,
    declaracion.id,
  );
  return true;
}

/** Prepara el store para una declaración nueva a nombre del usuario. */
export function iniciarDeclaracionPropia(perfil: PerfilUsuario, declaracionId: string | null): void {
  const estado = useDeclaracion.getState();
  estado.reiniciar();
  estado.actualizarRespuestas(RESPUESTAS_INICIALES);
  estado.establecerTitular(
    { nombres: perfil.nombres, apellidos: perfil.apellidos, identificacion: perfil.identificacion },
    true,
    declaracionId,
  );
}

/** Id de la declaración propia existente del año (para retomarla en vez de duplicar). */
export function idDeclaracionPropia(lista: DeclaracionResumen[], anioGravable: number): string | null {
  return lista.find((d) => d.titular.esPropia && d.anioGravable === anioGravable)?.id ?? null;
}
