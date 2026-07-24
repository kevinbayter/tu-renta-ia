import type { ProgresoDeclaracion } from '@turenta/core';

/** Barra de progreso honesta del wizard: "Paso X de 4" + % real. */
export function BarraProgreso({ progreso, etiqueta }: { progreso: ProgresoDeclaracion; etiqueta: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs text-texto-suave">
        <span>{etiqueta}</span>
        <span>
          <strong className="font-semibold text-primario">{progreso.porcentaje}% completado</strong>
          {' · '}Paso {progreso.paso} de {progreso.totalPasos}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuenow={progreso.porcentaje} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primario transition-all" style={{ width: `${progreso.porcentaje}%` }} />
      </div>
    </div>
  );
}
