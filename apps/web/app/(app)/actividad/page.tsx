'use client';

import { useEffect, useState } from 'react';

import { cargarActividad, FilaActividad } from '@/components/panel/panel-derecho';

import type { EventoActividad } from '@turenta/core';

export default function PaginaActividad() {
  const [eventos, setEventos] = useState<EventoActividad[] | null>(null);
  useEffect(() => {
    void cargarActividad(100).then(setEventos);
  }, []);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Actividad</h1>
      <p className="mt-1 text-sm text-texto-suave">Todo lo que ha pasado en tu cuenta, en orden.</p>
      <section className="mt-6 rounded-3xl border border-borde bg-card p-5">
        {eventos === null && <p className="text-sm text-texto-suave">Cargando…</p>}
        {eventos?.length === 0 && (
          <p className="py-6 text-center text-sm text-texto-suave">Aún no hay actividad registrada.</p>
        )}
        <ul className="space-y-4">
          {(eventos ?? []).map((e) => (
            <FilaActividad key={e.id} evento={e} />
          ))}
        </ul>
      </section>
    </main>
  );
}
