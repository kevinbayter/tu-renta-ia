'use client';

import { ACTIVIDADES_ECONOMICAS_DIAN } from '@turenta/shared';
import { useMemo, useState } from 'react';

const ESPECIALES = new Set(['0010', '0020', '0081', '0082', '0090']);

/** Casilla 24: el catálogo oficial de la DIAN, con buscador porque son 507 opciones. */
export function SelectorActividad({
  valor,
  alCambiar,
  automatica,
}: {
  valor: string;
  alCambiar: (codigo: string) => void;
  /** Etiqueta de la opción vacía ("la sugerida por tus ingresos"); sin ella no se ofrece. */
  automatica?: string;
}) {
  const [filtro, setFiltro] = useState('');
  const opciones = useMemo(() => filtrar(filtro, valor), [filtro, valor]);
  return (
    <div className="space-y-1.5">
      <input
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Busca por código o palabra (ej: pensionados, software)"
        className="h-10 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
      />
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
      >
        {automatica !== undefined && <option value="">{automatica}</option>}
        <optgroup label="Personas naturales">
          {opciones.especiales.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{`${codigo} · ${nombre}`}</option>
          ))}
        </optgroup>
        <optgroup label="Actividades económicas (CIIU)">
          {opciones.ciiu.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{`${codigo} · ${nombre}`}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

/** The selected code always stays in the list, so filtering never silently changes the value. */
function filtrar(filtro: string, seleccionado: string) {
  const texto = normalizar(filtro);
  const coincide = ([codigo, nombre]: readonly [string, string]) =>
    codigo === seleccionado || texto === '' || codigo.startsWith(texto) || normalizar(nombre).includes(texto);
  const visibles = ACTIVIDADES_ECONOMICAS_DIAN.filter(coincide);
  return {
    especiales: visibles.filter(([codigo]) => ESPECIALES.has(codigo)),
    ciiu: visibles.filter(([codigo]) => !ESPECIALES.has(codigo)),
  };
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
