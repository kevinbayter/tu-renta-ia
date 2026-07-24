'use client';

import { PREFERENCIAS_POR_DEFECTO } from '@turenta/core';
import { useEffect, useState } from 'react';

import type { PreferenciasUsuario } from '@turenta/core';

/** Preferencia de correos: los avisos de vencimiento (30/15/5 días) por email. */
export function SeccionNotificaciones() {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null);

  useEffect(() => {
    void cargar().then(setPreferencias);
  }, []);

  const alternar = async () => {
    const base = preferencias ?? PREFERENCIAS_POR_DEFECTO;
    const nuevas = { ...base, emailsVencimiento: !base.emailsVencimiento };
    setPreferencias(nuevas);
    await fetch('/api/preferencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevas),
    }).catch(() => null);
  };

  return (
    <section className="mt-6 rounded-3xl border border-borde bg-card p-5">
      <h2 className="font-semibold">Notificaciones</h2>
      <label className="mt-3 flex items-center justify-between gap-4 text-sm">
        <span>
          Recibir por correo los avisos críticos de vencimiento (a 30, 15 y 5 días).
          <span className="block text-xs text-texto-suave">Las notificaciones dentro de la app siempre están activas.</span>
        </span>
        <input
          type="checkbox"
          checked={preferencias?.emailsVencimiento ?? true}
          onChange={() => void alternar()}
          className="h-4 w-4 shrink-0 accent-[var(--primario)]"
        />
      </label>
    </section>
  );
}

async function cargar(): Promise<PreferenciasUsuario> {
  const respuesta = await fetch('/api/preferencias').catch(() => null);
  if (!respuesta?.ok) {
    return PREFERENCIAS_POR_DEFECTO;
  }
  const cuerpo = (await respuesta.json()) as { preferencias: PreferenciasUsuario };
  return cuerpo.preferencias;
}
