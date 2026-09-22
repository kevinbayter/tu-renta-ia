'use client';

import { GENEROS_DIAN } from '@turenta/core';

/** Casilla 286 del 210, con los mismos códigos que el portal de la DIAN. */
export function SelectorGenero({
  valor,
  alCambiar,
  etiqueta = 'Género',
}: {
  valor: string;
  alCambiar: (codigo: string) => void;
  etiqueta?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
      >
        <option value="">Selecciona…</option>
        {GENEROS_DIAN.map((g) => (
          <option key={g.codigo} value={g.codigo}>
            {g.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
