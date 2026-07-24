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

/** Guarda el avance del wizard en la nube (upsert por titular + año). */
export async function guardarDeclaracionEnNube(): Promise<{ ok: boolean; mensaje: string }> {
  const s = useDeclaracion.getState();
  if (!s.declarante.nombres || !s.declarante.identificacion) {
    return { ok: false, mensaje: 'Completa el titular (nombres y cédula) en el paso Revisión antes de guardar' };
  }
  const respuesta = await fetch('/api/declaraciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anioGravable: 2025, titular: { ...s.declarante, esPropia: s.esPropia ?? true }, estado: estadoParaGuardar() }),
  }).catch(() => null);
  if (!respuesta?.ok) {
    return { ok: false, mensaje: 'No se pudo guardar' };
  }
  const cuerpo = (await respuesta.json()) as { id?: string };
  if (cuerpo.id) {
    useDeclaracion.getState().establecerDeclaracionId(cuerpo.id);
  }
  return { ok: true, mensaje: '✓ Avance guardado en la nube' };
}

function estadoParaGuardar(): Record<string, unknown> {
  const s = useDeclaracion.getState();
  return {
    paso: s.paso,
    documentos: s.documentos,
    respuestas: s.respuestas,
    mensajes: s.mensajes,
    entrevistaCompleta: s.entrevistaCompleta,
    resultado: s.resultado,
    declarante: s.declarante,
  };
}

/** Prepara el store para una declaración nueva de un tercero (persona administrada). */
export function iniciarDeclaracionDeTercero(
  titular: { nombres: string; apellidos: string; identificacion: string },
  declaracionId: string | null,
): void {
  const estado = useDeclaracion.getState();
  estado.reiniciar();
  estado.actualizarRespuestas(RESPUESTAS_INICIALES);
  estado.establecerTitular(titular, false, declaracionId);
}
