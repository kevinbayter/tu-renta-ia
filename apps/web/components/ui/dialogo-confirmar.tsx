'use client';

/** Confirmación con el look de la plataforma (reemplaza al confirm nativo del navegador). */
export function DialogoConfirmar({
  titulo,
  descripcion,
  textoConfirmar,
  alConfirmar,
  alCancelar,
}: {
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  alConfirmar: () => void;
  alCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal>
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-left shadow-2xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-alerta-suave text-xl" aria-hidden>
          🗑
        </span>
        <h2 className="mt-3 text-lg font-bold">{titulo}</h2>
        <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={alCancelar}
            className="h-11 flex-1 rounded-2xl border border-borde font-semibold transition hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            className="h-11 flex-1 rounded-2xl bg-error font-semibold text-white transition hover:opacity-90"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
