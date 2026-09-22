'use client';

import { textoAutorizacion } from '@turenta/core';
import { AlertTriangle, FileCheck2, Send } from 'lucide-react';
import { useState } from 'react';

import { formatearPesos } from '@/lib/tipos';

import type { AlcanceAutorizacion } from '@turenta/core';

export interface ResumenPresentacion {
  anioGravable: number;
  titular: string;
  identificacion: string;
  saldoAFavor: number;
  saldoAPagar: number;
}

/**
 * Única compuerta antes de radicar: qué se presenta, qué autoriza y listo.
 *
 * Antes eran dos pantallas —autorización y confirmación— que pedían lo mismo
 * dos veces. La autorización sigue viniendo de `textoAutorizacion`, que es lo
 * que el servidor hashea: si esta pantalla lo redactara por su cuenta,
 * guardaríamos la huella de algo que el usuario nunca leyó.
 */
export function ConfirmarPresentacion({
  resumen,
  deOtro,
  alcances,
  recordar,
  alCambiarRecordar,
  alConfirmar,
  alCancelar,
}: {
  resumen: ResumenPresentacion;
  deOtro: string | null;
  alcances: AlcanceAutorizacion[];
  recordar: boolean;
  alCambiarRecordar: (valor: boolean) => void;
  alConfirmar: () => void;
  alCancelar: () => void;
}) {
  const [acepta, setAcepta] = useState(false);
  const aFavor = resumen.saldoAFavor > 0;
  const texto = textoAutorizacion(resumen.identificacion || 'la registrada', alcances, deOtro !== null);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-modal>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-alerta-suave text-alerta" aria-hidden>
          <AlertTriangle size={24} />
        </span>
        <h2 className="mt-3 text-xl font-bold">¿Presentar tu declaración ante la DIAN?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">
          Queda radicada oficialmente y{' '}
          <strong className="text-foreground">solo se cambia con una declaración de corrección</strong>.
        </p>

        <div className="mt-4 rounded-2xl border border-borde bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-texto-suave">
            <FileCheck2 size={13} className="text-primario" aria-hidden /> Esto es lo que se radicará
          </p>
          <dl className="mt-2.5 space-y-1.5 text-sm">
            <Fila etiqueta="Titular" valor={resumen.titular} />
            <Fila etiqueta="Cédula" valor={resumen.identificacion} />
            <Fila etiqueta="Año gravable" valor={String(resumen.anioGravable)} />
            <div className="flex items-baseline justify-between gap-3 border-t border-borde pt-1.5">
              <dt className="font-semibold">{aFavor ? 'Saldo a favor' : 'Saldo a pagar'}</dt>
              <dd className={`font-mono font-bold ${aFavor ? 'text-exito' : 'text-alerta'}`}>
                {formatearPesos(aFavor ? resumen.saldoAFavor : resumen.saldoAPagar)}
              </dd>
            </div>
          </dl>
        </div>

        <Recordar deOtro={deOtro} recordar={recordar} alCambiar={(v) => { alCambiarRecordar(v); setAcepta(false); }} />

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primario)]"
          />
          <span>
            {texto.encabezado.replace(/:$/, '')} <strong>{texto.haremos.join('. ')}</strong>.{' '}
            {texto.declaraciones.join(' ')}
          </span>
        </label>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={alCancelar} className="h-12 flex-1 cursor-pointer rounded-2xl border border-borde font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!acepta}
            onClick={alConfirmar}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} aria-hidden /> Presentar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Marcarlo cambia el texto que se acepta, así que desmarca la aceptación. */
function Recordar({ deOtro, recordar, alCambiar }: { deOtro: string | null; recordar: boolean; alCambiar: (valor: boolean) => void }) {
  return (
    <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-borde p-3 transition hover:border-primario/40">
      <input
        type="checkbox"
        checked={recordar}
        onChange={(e) => alCambiar(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primario)]"
      />
      <span className="text-xs leading-relaxed">
        <strong>{deOtro === null ? 'Recordar mi acceso' : `Recordar el acceso de ${deOtro}`}</strong> para no escribir la contraseña cada vez.
      </span>
    </label>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-texto-suave">{etiqueta}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}
