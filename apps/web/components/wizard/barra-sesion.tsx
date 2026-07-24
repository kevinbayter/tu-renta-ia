'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useDeclaracion } from '@/lib/store';
// (titular y guardado por declaración: ver /declaraciones para el historial)

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
      <TitularActual />
      <span className="flex-1" />
      <Link href="/declaraciones" className="rounded-lg bg-primario-suave px-2.5 py-1 font-semibold text-primario">
        Mis declaraciones
      </Link>
      <BotonAccion etiqueta="Guardar" accion={() => guardarEnNube(setAviso)} />
      <BotonAccion etiqueta="Salir" accion={() => salir(setSesion)} />
      {aviso && <span className="w-full text-exito">{aviso}</span>}
    </div>
  );
}

function TitularActual() {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  if (esPropia === null || !declarante.nombres) {
    return null;
  }
  return (
    <span className="rounded-lg bg-background px-2 py-0.5 text-texto-suave">
      {esPropia ? 'Mi declaración' : `Para: ${declarante.nombres} ${declarante.apellidos}`}
    </span>
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
  if (!s.declarante.nombres || !s.declarante.identificacion) {
    setAviso('Completa el titular (nombres y cédula) en el paso Revisión antes de guardar');
    setTimeout(() => setAviso(null), 4000);
    return;
  }
  const estado = {
    paso: s.paso,
    documentos: s.documentos,
    respuestas: s.respuestas,
    mensajes: s.mensajes,
    entrevistaCompleta: s.entrevistaCompleta,
    resultado: s.resultado,
    declarante: s.declarante,
  };
  const respuesta = await fetch('/api/declaraciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anioGravable: 2025,
      titular: { ...s.declarante, esPropia: s.esPropia ?? true },
      estado,
    }),
  }).catch(() => null);
  await registrarIdGuardado(respuesta);
  setAviso(respuesta?.ok ? '✓ Avance guardado en la nube' : 'No se pudo guardar');
  setTimeout(() => setAviso(null), 3000);
}

async function registrarIdGuardado(respuesta: Response | null): Promise<void> {
  if (!respuesta?.ok) {
    return;
  }
  const cuerpo = (await respuesta.json()) as { id?: string };
  if (cuerpo.id) {
    useDeclaracion.getState().establecerDeclaracionId(cuerpo.id);
  }
}

async function salir(setSesion: (v: EstadoSesion) => void): Promise<void> {
  await fetch('/api/auth/sesion', { method: 'DELETE' }).catch(() => null);
  setSesion({ tipo: 'anonimo' });
}
