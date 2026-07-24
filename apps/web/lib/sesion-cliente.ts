'use client';

import { useEffect, useState } from 'react';

import type { PerfilUsuario } from '@turenta/core';

export type SesionCliente =
  | { fase: 'cargando' }
  | { fase: 'anonimo' }
  | { fase: 'activa'; email: string; perfil: PerfilUsuario | null };

/** Sesión + perfil para el shell (topbar, panel). Una sola consulta por montaje. */
export function useSesionCliente(): SesionCliente {
  const [sesion, setSesion] = useState<SesionCliente>({ fase: 'cargando' });
  useEffect(() => {
    void consultar().then(setSesion);
  }, []);
  return sesion;
}

async function consultar(): Promise<SesionCliente> {
  try {
    return await pedirSesionYPerfil();
  } catch {
    return { fase: 'anonimo' };
  }
}

async function pedirSesionYPerfil(): Promise<SesionCliente> {
  const respuesta = await fetch('/api/auth/sesion');
  if (!respuesta.ok) {
    return { fase: 'anonimo' };
  }
  const { sesion } = (await respuesta.json()) as { sesion: { email: string } | null };
  if (!sesion) {
    return { fase: 'anonimo' };
  }
  const perfil = await pedirPerfil();
  return { fase: 'activa', email: sesion.email, perfil };
}

async function pedirPerfil(): Promise<PerfilUsuario | null> {
  const respuesta = await fetch('/api/perfil').catch(() => null);
  if (!respuesta?.ok) {
    return null;
  }
  const cuerpo = (await respuesta.json()) as { perfil: PerfilUsuario | null };
  return cuerpo.perfil;
}
