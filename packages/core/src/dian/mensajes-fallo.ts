/**
 * User-facing wording for each failure reason. This is domain vocabulary, not
 * HTTP detail: both DIAN routes share it.
 */

import type { MotivoFalloDian } from '../puertos/conexion-dian-port';

interface Mensaje {
  texto: string;
  /** 404 for "nothing to bring", 502 when something actually broke. */
  estado: number;
}

const MENSAJES: Record<MotivoFalloDian, Mensaje> = {
  credenciales_invalidas: {
    texto: 'La DIAN no aceptó esos datos. Revisa tu documento y contraseña.',
    estado: 502,
  },
  portal_no_disponible: {
    texto: 'El portal de la DIAN no está respondiendo en este momento.',
    estado: 502,
  },
  estructura_cambiada: {
    texto: 'El portal de la DIAN cambió y no pudimos completar la descarga.',
    estado: 502,
  },
  requiere_verificacion: {
    texto: 'La DIAN pidió una verificación adicional que debes hacer tú directamente.',
    estado: 502,
  },
  tiempo_agotado: { texto: 'La DIAN tardó demasiado en responder.', estado: 504 },
  sin_declaracion: {
    texto: 'No encontramos una declaración presentada de ese año en tu cuenta de la DIAN.',
    estado: 404,
  },
  servicio_no_disponible: {
    texto: 'La conexión automática no está disponible ahora mismo.',
    estado: 503,
  },
  desconocido: { texto: 'No pudimos completar la conexión.', estado: 502 },
};

export function mensajeDeFallo(motivo: MotivoFalloDian | undefined): string {
  return MENSAJES[motivo ?? 'desconocido'].texto;
}

export function estadoDeFallo(motivo: MotivoFalloDian | undefined): number {
  return MENSAJES[motivo ?? 'desconocido'].estado;
}

/** Not an error: a first-time filer simply has nothing to bring. */
export function esFaltaDeDatos(motivo: MotivoFalloDian | undefined): boolean {
  return motivo === 'sin_declaracion';
}
