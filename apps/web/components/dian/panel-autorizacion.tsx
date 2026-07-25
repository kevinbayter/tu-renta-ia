'use client';

import { textoAutorizacion } from '@turenta/core';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import type { AlcanceAutorizacion } from '@turenta/core';

/**
 * Consentimiento informado previo: sin esto no se piden credenciales.
 *
 * El texto NO se redacta aquí: se renderiza el que genera `textoAutorizacion`
 * en el dominio, que es exactamente el que el servidor hashea como evidencia.
 * Si esta pantalla tuviera su propia redacción, guardaríamos la huella de algo
 * que el usuario nunca leyó.
 */
export function PanelAutorizacion({
  titular,
  alcances,
  recordar,
  alCambiarRecordar,
  alAceptar,
  alCancelar,
}: {
  titular: string;
  alcances: AlcanceAutorizacion[];
  recordar: boolean;
  alCambiarRecordar: (valor: boolean) => void;
  alAceptar: () => void;
  alCancelar: () => void;
}) {
  const [acepta, setAcepta] = useState(false);
  const texto = textoAutorizacion(titular || 'la registrada', alcances);

  return (
    <div className="pt-5">
      <p className="text-sm leading-relaxed">{texto.encabezado}</p>

      <div className="mt-4 rounded-2xl border border-borde bg-background p-4">
        <Lista titulo="Lo que haremos" items={texto.haremos} />
        <Lista titulo="Lo que NO haremos" items={texto.noHaremos} negativa />
      </div>

      {/* Marcarlo cambia el texto de arriba en vivo: se acepta exactamente lo
          que se va a hacer, incluido guardar el acceso. */}
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-borde p-3.5 transition hover:border-primario/40">
        <input
          type="checkbox"
          checked={recordar}
          onChange={(e) => {
            alCambiarRecordar(e.target.checked);
            setAcepta(false);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primario)]"
        />
        <span className="text-xs leading-relaxed">
          <strong>Recordar mi acceso</strong> para no escribir la contraseña en cada operación.
        </span>
      </label>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-borde p-3.5 transition hover:border-primario/40">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primario)]"
        />
        <span className="text-xs leading-relaxed">
          Autorizo lo anterior y declaro que:
          <span className="mt-1.5 block space-y-1">
            {texto.declaraciones.map((d) => (
              <span key={d} className="block">
                · {d}
              </span>
            ))}
          </span>
        </span>
      </label>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={alCancelar}
          className="h-11 flex-1 cursor-pointer rounded-2xl border border-borde font-semibold"
        >
          Mejor lo subo yo
        </button>
        <button
          type="button"
          disabled={!acepta}
          onClick={alAceptar}
          className="h-11 flex-1 cursor-pointer rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40"
        >
          Autorizo, continuar
        </button>
      </div>
    </div>
  );
}

function Lista({ titulo, items, negativa }: { titulo: string; items: string[]; negativa?: boolean }) {
  const tituloClase = negativa ? 'mt-3 text-texto-suave' : 'text-primario';
  return (
    <>
      <p className={`text-xs font-semibold uppercase tracking-wide ${tituloClase}`}>{titulo}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`flex items-start gap-2 text-xs leading-relaxed ${negativa ? 'text-texto-suave' : ''}`}
          >
            <Marca negativa={negativa} />
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

function Marca({ negativa }: { negativa?: boolean }) {
  if (negativa) {
    return (
      <span className="mt-0.5 shrink-0 font-bold text-error" aria-hidden>
        ✕
      </span>
    );
  }
  return <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primario" aria-hidden />;
}
