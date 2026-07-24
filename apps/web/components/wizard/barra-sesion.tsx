'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useDeclaracion } from '@/lib/store';

type EstadoSesion = { tipo: 'cargando' } | { tipo: 'anonimo' } | { tipo: 'activa'; email: string };

export function BarraSesion() {
  const [sesion, setSesion] = useState<EstadoSesion>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    void consultarSesion().then(setSesion);
  }, []);

  if (sesion.tipo === 'cargando') {
    return null;
  }
  if (sesion.tipo === 'anonimo') {
    return (
      <p className="mb-4 rounded-xl border border-borde bg-card px-3 py-2 text-xs text-texto-suave">
        Tu avance solo vive en este navegador.{' '}
        <Link href="/ingresar" className="font-semibold text-primario underline">
          Ingresa
        </Link>{' '}
        para guardarlo en la nube.
      </p>
    );
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-borde bg-card px-3 py-2 text-xs">
      <span className="text-texto-suave">☁ {sesion.email}</span>
      <span className="flex-1" />
      <BotonAccion etiqueta="Guardar" accion={() => guardarEnNube(setAviso)} />
      <BotonAccion etiqueta="Cargar" accion={() => cargarDeNube(setAviso)} />
      <BotonAccion etiqueta="Salir" accion={() => salir(setSesion)} />
      {aviso && <span className="w-full text-exito">{aviso}</span>}
    </div>
  );
}

function BotonAccion({ etiqueta, accion }: { etiqueta: string; accion: () => Promise<void> }) {
  return (
    <button
      type="button"
      onClick={() => void accion()}
      className="rounded-lg bg-primario-suave px-2.5 py-1 font-semibold text-primario"
    >
      {etiqueta}
    </button>
  );
}

async function consultarSesion(): Promise<EstadoSesion> {
  try {
    return await pedirSesion();
  } catch {
    return { tipo: 'anonimo' };
  }
}

async function pedirSesion(): Promise<EstadoSesion> {
  const respuesta = await fetch('/api/auth/sesion');
  if (!respuesta.ok) {
    return { tipo: 'anonimo' };
  }
  const cuerpo = (await respuesta.json()) as { sesion: { email: string } | null };
  return cuerpo.sesion ? { tipo: 'activa', email: cuerpo.sesion.email } : { tipo: 'anonimo' };
}

async function guardarEnNube(setAviso: (v: string | null) => void): Promise<void> {
  const s = useDeclaracion.getState();
  const estado = {
    paso: s.paso,
    documentos: s.documentos,
    respuestas: s.respuestas,
    mensajes: s.mensajes,
    entrevistaCompleta: s.entrevistaCompleta,
    resultado: s.resultado,
    declarante: s.declarante,
  };
  const respuesta = await fetch('/api/declaracion', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).catch(() => null);
  setAviso(respuesta?.ok ? '✓ Avance guardado en la nube' : 'No se pudo guardar');
  setTimeout(() => setAviso(null), 3000);
}

async function cargarDeNube(setAviso: (v: string | null) => void): Promise<void> {
  const respuesta = await fetch('/api/declaracion').catch(() => null);
  if (!respuesta?.ok) {
    setAviso('No se pudo cargar');
    return;
  }
  const cuerpo = (await respuesta.json()) as { estado: Record<string, unknown> | null };
  if (!cuerpo.estado) {
    setAviso('No tienes avance guardado todavía');
    setTimeout(() => setAviso(null), 3000);
    return;
  }
  useDeclaracion.getState().hidratar(cuerpo.estado);
  setAviso('✓ Avance cargado');
  setTimeout(() => setAviso(null), 3000);
}

async function salir(setSesion: (v: EstadoSesion) => void): Promise<void> {
  await fetch('/api/auth/sesion', { method: 'DELETE' }).catch(() => null);
  setSesion({ tipo: 'anonimo' });
}
