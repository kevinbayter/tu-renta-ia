'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const LO_QUE_HAREMOS = [
  'Ingresar a tu cuenta de la DIAN con los datos que nos des ahora',
  'Descargar únicamente tu información exógena del año gravable 2025',
  'Cerrar la sesión y borrar tus credenciales de nuestra memoria',
];

const LO_QUE_NO_HAREMOS = [
  'Guardar tu contraseña — ni cifrada, ni en logs, en ningún lado',
  'Firmar ni presentar nada en tu nombre',
  'Volver a entrar sin que tú lo pidas',
];

/** Consentimiento informado previo: sin esto no se piden credenciales. */
export function PanelAutorizacion({
  titular,
  alAceptar,
  alCancelar,
}: {
  titular: string;
  alAceptar: () => void;
  alCancelar: () => void;
}) {
  const [acepta, setAcepta] = useState(false);
  return (
    <div className="pt-5">
      <p className="text-sm leading-relaxed">
        Para traer tu información necesitamos entrar a tu cuenta de la DIAN{' '}
        <strong>una sola vez, ahora mismo y contigo presente</strong>.
      </p>

      <div className="mt-4 rounded-2xl border border-borde bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primario">Lo que haremos</p>
        <ul className="mt-2 space-y-1.5">
          {LO_QUE_HAREMOS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primario" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-texto-suave">Lo que NO haremos</p>
        <ul className="mt-2 space-y-1.5">
          {LO_QUE_NO_HAREMOS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-texto-suave">
              <span className="mt-0.5 shrink-0 font-bold text-error" aria-hidden>
                ✕
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-borde p-3.5 transition hover:border-primario/40">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primario)]"
        />
        <span className="text-xs leading-relaxed">
          Autorizo a TuRenta AI a ingresar a mi cuenta de la DIAN (cédula <strong>{titular || 'la registrada'}</strong>)
          únicamente para descargar mi información exógena. Entiendo que esta autorización es{' '}
          <strong>puntual y revocable</strong>, que mis credenciales no se almacenan, y que puedo hacer este
          trámite yo mismo en el portal de la DIAN si lo prefiero.
        </span>
      </label>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={alCancelar} className="h-11 flex-1 rounded-2xl border border-borde font-semibold">
          Mejor la subo yo
        </button>
        <button
          type="button"
          disabled={!acepta}
          onClick={alAceptar}
          className="h-11 flex-1 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
        >
          Autorizo, continuar
        </button>
      </div>
    </div>
  );
}
