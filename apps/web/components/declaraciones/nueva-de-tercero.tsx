'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useDeclaracion } from '@/lib/store';

/** Modal para iniciar la declaración de otra persona (tercero). */
export function NuevaDeTercero({ alCerrar }: { alCerrar: () => void }) {
  const router = useRouter();
  const [datos, setDatos] = useState({ nombres: '', apellidos: '', identificacion: '' });
  const listo = datos.nombres.trim() && datos.apellidos.trim() && datos.identificacion.length >= 5;

  const iniciar = () => {
    const store = useDeclaracion.getState();
    store.reiniciar();
    store.establecerTitular(datos, false, null);
    router.push('/declaracion');
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-card p-6">
        <h2 className="text-xl font-bold">Declaración de otra persona</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Datos del titular de la declaración (como aparecen en su cédula). Recuerda que necesitas su
          autorización para tratar sus datos.
        </p>
        <div className="mt-4 space-y-3">
          <Campo etiqueta="Nombre(s)" valor={datos.nombres} alCambiar={(v) => setDatos({ ...datos, nombres: v })} />
          <Campo etiqueta="Apellidos" valor={datos.apellidos} alCambiar={(v) => setDatos({ ...datos, apellidos: v })} />
          <Campo
            etiqueta="Cédula (sin puntos)"
            valor={datos.identificacion}
            alCambiar={(v) => setDatos({ ...datos, identificacion: v.replace(/\D/g, '') })}
            numerico
          />
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={alCerrar} className="h-11 flex-1 rounded-2xl border border-borde font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={iniciar}
            disabled={!listo}
            className="h-11 flex-1 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  alCambiar,
  numerico,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  numerico?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
      <input
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        inputMode={numerico ? 'numeric' : 'text'}
        className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
      />
    </label>
  );
}
