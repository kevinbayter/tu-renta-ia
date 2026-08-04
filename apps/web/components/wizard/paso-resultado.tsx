'use client';

import { detectarCasosNoSoportados } from '@turenta/core';
import { TriangleAlert } from 'lucide-react';

import { BotonDescargarBorrador, GuiaPresentacion } from './guia-presentacion';
import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { CasoNoSoportado } from '@turenta/core';
import type { ResultadoDeclaracion } from '@/lib/tipos';

export function PasoResultado() {
  const resultado = useDeclaracion((s) => s.resultado);
  const respuestas = useDeclaracion((s) => s.respuestas);
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
  const casos = detectarCasosNoSoportados(respuestas);
  const incompleta = casos.length > 0;
  return (
    <section aria-label="Resultado">
      {incompleta && <AvisoIncompleta casos={casos} />}
      <CifraPrincipal resultado={resultado} parcial={incompleta} />
      {!incompleta && <BotonDescargarBorrador resultado={resultado} />}
      <Desglose resultado={resultado} />
      {!incompleta && <GuiaPresentacion resultado={resultado} />}
      <Casillas resultado={resultado} />
      <button
        type="button"
        onClick={() => irAPaso('revision')}
        className="mt-6 h-12 w-full rounded-2xl border border-borde bg-card font-semibold transition hover:border-primario"
      >
        ← Ajustar datos y recalcular
      </button>
      {!incompleta && (
        <p className="mt-4 rounded-xl bg-primario-suave p-3 text-xs text-texto-suave">
          Este borrador es informativo: la declaración oficial la diligencias, firmas y presentas tú en el
          portal MUISCA de la DIAN siguiendo la guía de arriba.
        </p>
      )}
    </section>
  );
}

/** Sin borrador ni guía: entregar un PDF a medias es invitar a presentarlo así. */
function AvisoIncompleta({ casos }: { casos: CasoNoSoportado[] }) {
  return (
    <div role="alert" className="mb-4 rounded-3xl border border-alerta/40 bg-alerta-suave p-5">
      <p className="flex items-center gap-2 font-bold text-alerta">
        <TriangleAlert size={18} aria-hidden /> Tu declaración está incompleta
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        Nos contaste sobre situaciones que TuRenta todavía no sabe liquidar. El cálculo de abajo NO las
        incluye, así que no es tu declaración completa y por eso no habilitamos la descarga del borrador
        ni la guía de presentación:
      </p>
      <ul className="mt-3 space-y-2">
        {casos.map((caso) => (
          <li key={caso.clave} className="text-sm leading-relaxed">
            <span className="font-semibold">{caso.etiqueta}.</span>{' '}
            <span className="text-texto-suave">{caso.detalle}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed">
        Para presentar tu declaración con estos casos necesitas un contador. Presentarla sin incluirlos
        puede costarte la sanción por inexactitud de la DIAN.
      </p>
    </div>
  );
}

function CifraPrincipal({ resultado, parcial }: { resultado: ResultadoDeclaracion; parcial?: boolean }) {
  const esSaldoAFavor = resultado.liquidacion.totalSaldoAFavor > 0;
  const cifra = esSaldoAFavor ? resultado.liquidacion.totalSaldoAFavor : resultado.liquidacion.saldoAPagar;
  if (parcial) {
    return (
      <div className="rounded-3xl border border-borde bg-card p-6 text-center">
        <p className="text-sm font-medium text-texto-suave">Cálculo parcial (no incluye todos tus casos)</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-texto-suave">{formatearPesos(cifra)}</p>
        <p className="mt-2 text-xs text-texto-suave">
          {esSaldoAFavor ? 'Saldo a favor parcial' : 'Saldo a pagar parcial'} · Año gravable 2025
        </p>
      </div>
    );
  }
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
  const go = resultado.gananciasOcasionales;
  const l = resultado.liquidacion;
  const filas: [string, number][] = [
    ['Ingresos rentas de trabajo', g.trabajo.ingresosBrutos],
    ['Ingresos rentas de capital', g.capital.ingresosBrutos],
    ['Aportes salud y pensión (no gravados)', -g.trabajo.incrngo],
    ['Rentas exentas y deducciones aplicadas', -g.totalExentasYDeduccionesConFueraDeLimite - g.capital.incrngoComponenteInflacionario],
    ['Renta líquida gravable', g.rentaLiquidaGravable],
    ...(resultado.dividendos.baseParaTabla > 0
      ? ([['Dividendos que entran a la base', resultado.dividendos.baseParaTabla]] as [string, number][])
      : []),
    ['Impuesto de renta', l.impuestoNetoRenta],
    ...(go.ingresos > 0
      ? ([
          ['Ganancias ocasionales (ventas, herencias, premios)', go.ingresos],
          ['Costos y exenciones de ganancias ocasionales', -(go.costos + go.exentas)],
          ['Impuesto de ganancias ocasionales', l.impuestoGananciasOcasionales],
        ] as [string, number][])
      : []),
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
