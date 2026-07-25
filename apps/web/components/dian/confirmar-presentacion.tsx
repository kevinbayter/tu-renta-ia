'use client';

import { AlertTriangle, FileCheck2, Send } from 'lucide-react';
import { useState } from 'react';

import { formatearPesos } from '@/lib/tipos';

/**
 * Última compuerta antes de radicar ante la DIAN. Presentar es IRREVERSIBLE
 * (corregir después implica una declaración de corrección, con sus plazos y
 * eventuales sanciones), así que exige confirmación consciente: el usuario ve
 * exactamente qué se va a radicar y debe marcar que lo revisó.
 */
export function ConfirmarPresentacion({
  resumen,
  alConfirmar,
  alCancelar,
}: {
  resumen: {
    anioGravable: number;
    titular: string;
    identificacion: string;
    saldoAFavor: number;
    saldoAPagar: number;
  };
  alConfirmar: () => void;
  alCancelar: () => void;
}) {
  const [reviso, setReviso] = useState(false);
  const aFavor = resumen.saldoAFavor > 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-alerta-suave text-alerta" aria-hidden>
          <AlertTriangle size={24} />
        </span>
        <h2 className="mt-3 text-xl font-bold">¿Presentar tu declaración ante la DIAN?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">
          Esto radica oficialmente tu declaración del año gravable {resumen.anioGravable}.{' '}
          <strong className="text-foreground">La presentación no se puede deshacer</strong>: si después
          encuentras un error, tendrías que presentar una declaración de corrección.
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

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
          <input
            type="checkbox"
            checked={reviso}
            onChange={(e) => setReviso(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primario)]"
          />
          <span>
            Revisé el borrador completo y confirmo que la información es correcta. Entiendo que{' '}
            <strong>soy el declarante y el responsable</strong> de lo que aquí se presenta, y autorizo
            radicarla con mi firma electrónica.
          </span>
        </label>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={alCancelar} className="h-12 flex-1 rounded-2xl border border-borde font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!reviso}
            onClick={alConfirmar}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
          >
            <Send size={16} aria-hidden /> Presentar
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-texto-suave">
          ¿Prefieres hacerlo tú? Puedes presentarla directamente en el portal de la DIAN con nuestra guía.
        </p>
      </div>
    </div>
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
