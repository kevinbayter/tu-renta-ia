'use client';

import { CalendarDays, CircleDollarSign, FileText, Users } from 'lucide-react';

import { formatearFechaLarga, vencimientosDe } from '@/lib/vencimientos';
import { formatearPesos } from '@/lib/tipos';

import type { DeclaracionResumen } from '@turenta/core';

export function TarjetasMetricas({ lista }: { lista: DeclaracionResumen[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricaDeclaraciones lista={lista} />
      <MetricaSaldo lista={lista} />
      <MetricaVencimiento lista={lista} />
      <MetricaPersonas lista={lista} />
    </div>
  );
}

function MetricaDeclaraciones({ lista }: { lista: DeclaracionResumen[] }) {
  return (
    <Tarjeta Icono={FileText} titulo="Declaraciones" valor={String(lista.length)} detalle="Este año gravable" />
  );
}

function MetricaSaldo({ lista }: { lista: DeclaracionResumen[] }) {
  const conResultado = lista.filter((d) => d.saldoAFavor !== null);
  const neto = conResultado.reduce((acc, d) => acc + (d.saldoAFavor ?? 0) - (d.saldoAPagar ?? 0), 0);
  if (conResultado.length === 0) {
    return <Tarjeta Icono={CircleDollarSign} titulo="Saldo total" valor="—" detalle="Aún sin cálculos" />;
  }
  const detalle = neto > 0 ? 'A favor' : neto < 0 ? 'A pagar' : 'Sin saldo';
  return <Tarjeta Icono={CircleDollarSign} titulo="Saldo total" valor={formatearPesos(Math.abs(neto))} detalle={detalle} />;
}

function MetricaVencimiento({ lista }: { lista: DeclaracionResumen[] }) {
  const proximo = vencimientosDe(lista, new Date())[0];
  if (!proximo) {
    return <Tarjeta Icono={CalendarDays} titulo="Próximo vencimiento" valor="—" detalle="Crea tu primera declaración" />;
  }
  const detalle = proximo.dias >= 0 ? `Faltan ${proximo.dias} días` : `Venció hace ${-proximo.dias} días`;
  return (
    <Tarjeta Icono={CalendarDays} titulo="Próximo vencimiento" valor={formatearFechaLarga(proximo.fechaIso)} detalle={detalle} compacto />
  );
}

function MetricaPersonas({ lista }: { lista: DeclaracionResumen[] }) {
  const cedulas = new Set(lista.map((d) => d.titular.identificacion));
  const propia = lista.some((d) => d.titular.esPropia);
  const otras = cedulas.size - (propia ? 1 : 0);
  const detalle = propia ? (otras > 0 ? `Tú y ${otras} más` : 'Solo tú') : `${cedulas.size} personas`;
  return <Tarjeta Icono={Users} titulo="Personas administradas" valor={String(cedulas.size)} detalle={detalle} />;
}

function Tarjeta({
  Icono,
  titulo,
  valor,
  detalle,
  compacto,
}: {
  Icono: typeof FileText;
  titulo: string;
  valor: string;
  detalle: string;
  compacto?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-borde bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario-suave text-primario" aria-hidden>
          <Icono size={19} />
        </span>
        <p className="text-sm text-texto-suave">{titulo}</p>
      </div>
      <p className={`mt-3 font-bold ${compacto ? 'text-xl' : 'text-2xl'}`}>{valor}</p>
      <p className="mt-0.5 text-xs text-texto-suave">{detalle}</p>
    </div>
  );
}
