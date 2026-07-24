'use client';

import { BotonDescargarBorrador, GuiaPresentacion } from './guia-presentacion';
import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { ResultadoDeclaracion } from '@/lib/tipos';

export function PasoResultado() {
  const resultado = useDeclaracion((s) => s.resultado);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  if (!resultado) {
    return (
      <section>
        <p className="text-sm text-texto-suave">Aún no hay cálculo.</p>
        <button type="button" onClick={() => irAPaso('revision')} className="mt-3 font-semibold text-primario">
          ← Volver a revisión
        </button>
      </section>
    );
  }
  return (
    <section aria-label="Resultado">
      <CifraPrincipal resultado={resultado} />
      <BotonDescargarBorrador resultado={resultado} />
      <Desglose resultado={resultado} />
      <GuiaPresentacion resultado={resultado} />
      <Casillas resultado={resultado} />
      <button
        type="button"
        onClick={() => irAPaso('revision')}
        className="mt-6 h-12 w-full rounded-2xl border border-borde bg-card font-semibold transition hover:border-primario"
      >
        ← Ajustar datos y recalcular
      </button>
      <p className="mt-4 rounded-xl bg-primario-suave p-3 text-xs text-texto-suave">
        Este borrador es informativo: la declaración oficial la diligencias, firmas y presentas tú en el
        portal MUISCA de la DIAN siguiendo la guía de arriba.
      </p>
    </section>
  );
}

function CifraPrincipal({ resultado }: { resultado: ResultadoDeclaracion }) {
  const esSaldoAFavor = resultado.liquidacion.totalSaldoAFavor > 0;
  const cifra = esSaldoAFavor ? resultado.liquidacion.totalSaldoAFavor : resultado.liquidacion.saldoAPagar;
  return (
    <div
      className={`rounded-3xl p-6 text-center ${esSaldoAFavor ? 'bg-exito-suave' : 'bg-alerta-suave'}`}
    >
      <p className="text-sm font-medium text-texto-suave">
        {esSaldoAFavor ? '🎉 Tienes saldo a favor' : 'Saldo a pagar a la DIAN'}
      </p>
      <p className={`mt-1 text-5xl font-bold tracking-tight ${esSaldoAFavor ? 'text-exito' : 'text-alerta'}`}>
        {formatearPesos(cifra)}
      </p>
      <p className="mt-2 text-xs text-texto-suave">Año gravable 2025 · Formulario 210</p>
    </div>
  );
}

function Desglose({ resultado }: { resultado: ResultadoDeclaracion }) {
  const g = resultado.cedulaGeneral;
  const l = resultado.liquidacion;
  const filas: [string, number][] = [
    ['Ingresos rentas de trabajo', g.trabajo.ingresosBrutos],
    ['Ingresos rentas de capital', g.capital.ingresosBrutos],
    ['Aportes salud y pensión (no gravados)', -g.trabajo.incrngo],
    ['Rentas exentas y deducciones aplicadas', -g.totalExentasYDeduccionesConFueraDeLimite - g.capital.incrngoComponenteInflacionario],
    ['Renta líquida gravable', g.rentaLiquidaGravable],
    ['Impuesto de renta', l.impuestoNetoRenta],
    ['Retenciones que ya te hicieron', -l.retenciones],
    ['Saldo a favor del año pasado', -l.saldoFavorAnterior],
  ];
  return (
    <details open className="mt-4 rounded-2xl border border-borde bg-card p-4">
      <summary className="cursor-pointer font-semibold">¿Cómo llegamos a esta cifra?</summary>
      <dl className="mt-3 space-y-2">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-texto-suave">{etiqueta}</dt>
            <dd className={`font-mono ${valor < 0 ? 'text-exito' : ''}`}>{formatearPesos(valor)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-texto-suave">
        Patrimonio bruto declarado: {formatearPesos(resultado.patrimonioBruto)} · Anticipo próximo año:{' '}
        {formatearPesos(resultado.liquidacion.anticipoAnioSiguiente)}
      </p>
    </details>
  );
}

function Casillas({ resultado }: { resultado: ResultadoDeclaracion }) {
  const entradas = Object.entries(resultado.casillas).sort(([a], [b]) => Number(a) - Number(b));
  return (
    <details className="mt-3 rounded-2xl border border-borde bg-card p-4">
      <summary className="cursor-pointer font-semibold">Casillas del formulario 210 (para expertos)</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-texto-suave">
              <th className="pb-1 pr-3">Casilla</th>
              <th className="pb-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map(([casilla, valor]) => (
              <tr key={casilla} className="border-t border-borde">
                <td className="py-1 pr-3 font-mono">{casilla}</td>
                <td className="py-1 text-right font-mono">{formatearPesos(valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
