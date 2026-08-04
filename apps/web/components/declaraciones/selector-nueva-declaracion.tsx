'use client';

import { UserRound, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { NuevaDeTercero } from './nueva-de-tercero';

/** Primer paso al pulsar "+ Nueva declaración": decidir el titular. */
export function SelectorNuevaDeclaracion({
  alCerrar,
  alPropia,
}: {
  alCerrar: () => void;
  alPropia: () => void;
}) {
  const [tercero, setTercero] = useState(false);
  if (tercero) {
    return <NuevaDeTercero alCerrar={alCerrar} />;
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-card p-6">
        <h2 className="text-xl font-bold">¿Para quién es esta declaración?</h2>
        <div className="mt-4 space-y-3">
          <Opcion
            icono={<UserRound size={20} />}
            titulo="A mi nombre"
            detalle="Tu propia declaración de renta, con los datos de tu perfil."
            alElegir={alPropia}
          />
          <Opcion
            icono={<UsersRound size={20} />}
            titulo="De otra persona"
            detalle="Elabora la declaración de un familiar o cliente con su autorización."
            alElegir={() => setTercero(true)}
          />
        </div>
        <button
          type="button"
          onClick={alCerrar}
          className="mt-5 h-11 w-full cursor-pointer rounded-2xl border border-borde font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Opcion({
  icono,
  titulo,
  detalle,
  alElegir,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
  alElegir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alElegir}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-borde p-4 text-left transition hover:border-primario/40 hover:bg-primario-suave/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primario-suave text-primario" aria-hidden>
        {icono}
      </span>
      <span>
        <span className="block font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-texto-suave">{detalle}</span>
      </span>
    </button>
  );
}
