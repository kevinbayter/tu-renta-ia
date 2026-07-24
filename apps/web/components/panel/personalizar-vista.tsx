'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import type { PreferenciasUsuario } from '@turenta/core';

const WIDGETS = [
  { clave: 'recomendaciones', etiqueta: 'Recomendaciones de tu IA Fiscal' },
  { clave: 'asistente', etiqueta: 'Asistente Fiscal IA (panel derecho)' },
  { clave: 'vencimientos', etiqueta: 'Próximos vencimientos' },
  { clave: 'actividad', etiqueta: 'Actividad reciente' },
] as const;

/** Botón "Personalizar vista": muestra/oculta widgets del panel y lo persiste. */
export function PersonalizarVista({
  preferencias,
  alCambiar,
}: {
  preferencias: PreferenciasUsuario;
  alCambiar: (p: PreferenciasUsuario) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  const alternar = async (clave: (typeof WIDGETS)[number]['clave']) => {
    const nuevas: PreferenciasUsuario = {
      ...preferencias,
      widgets: { ...preferencias.widgets, [clave]: !preferencias.widgets[clave] },
    };
    alCambiar(nuevas);
    await fetch('/api/preferencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevas),
    }).catch(() => null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 rounded-xl border border-borde bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primario/40"
      >
        Personalizar vista <SlidersHorizontal size={15} aria-hidden />
      </button>
      {abierto && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setAbierto(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-borde bg-card p-3 shadow-xl">
            <p className="px-1 text-sm font-semibold">Widgets del panel</p>
            <div className="mt-2 space-y-1">
              {WIDGETS.map(({ clave, etiqueta }) => (
                <label key={clave} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-background">
                  {etiqueta}
                  <input
                    type="checkbox"
                    checked={preferencias.widgets[clave]}
                    onChange={() => void alternar(clave)}
                    className="h-4 w-4 accent-[var(--primario)]"
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
