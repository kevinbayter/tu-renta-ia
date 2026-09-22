import type { Credenciales } from './formulario-credenciales';
import type { AlcanceAutorizacion } from '@turenta/core';

export interface RespuestaApi {
  nombreArchivo?: string;
  contenidoBase64?: string;
  mensaje?: string;
  motivoFallo?: string;
}

export function cuerpoConexion(
  credenciales: Credenciales,
  destino: { titular: string; deOtro: string | null; anioGravable: number },
  aceptados: AlcanceAutorizacion[],
): Record<string, unknown> {
  return {
    ...credenciales,
    titular: destino.titular,
    enNombreDeOtro: destino.deOtro !== null,
    anioGravable: destino.anioGravable,
    recordarAcceso: aceptados.includes('recordar_acceso'),
    alcancesAceptados: aceptados,
  };
}

/** Un cuerpo ilegible dejaría el modal clavado en "progreso": se trata como fallo. */
export async function pedir(ruta: string, cuerpo: Record<string, unknown>): Promise<RespuestaApi | null> {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).catch(() => null);
  if (!respuesta) {
    return null;
  }
  return (await respuesta.json().catch(() => null)) as RespuestaApi | null;
}
