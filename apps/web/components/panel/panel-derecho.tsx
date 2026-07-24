'use client';

import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { vencimientosDe } from '@/lib/vencimientos';

import type { DeclaracionResumen } from '@turenta/core';

export function PanelDerecho({ lista }: { lista: DeclaracionResumen[] }) {
  return (
    <aside className="space-y-4" aria-label="Resumen lateral">
      <ProximosVencimientos lista={lista} />
    </aside>
  );
}

function ProximosVencimientos({ lista }: { lista: DeclaracionResumen[] }) {
  const vencimientos = vencimientosDe(lista, new Date()).slice(0, 3);
  return (
    <section className="rounded-2xl border border-borde bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primario-suave text-primario" aria-hidden>
          <CalendarDays size={16} />
        </span>
        Próximos vencimientos
      </h2>
      {vencimientos.length === 0 ? (
        <p className="mt-4 text-sm text-texto-suave">Cuando crees una declaración verás aquí su fecha límite.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {vencimientos.map((v) => (
            <li key={v.identificacion} className="flex items-center gap-3">
              <FechaCorta iso={v.fechaIso} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Declaración {v.titular}</p>
                <p className="text-xs text-texto-suave">Año gravable {v.anioGravable}</p>
              </div>
              {v.dias >= 0 && (
                <span className="shrink-0 rounded-lg bg-exito-suave px-2 py-0.5 text-xs font-semibold text-exito">{v.dias} días</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link href="/calendario" className="mt-4 inline-block text-sm font-semibold text-primario">
        Ver calendario completo →
      </Link>
    </section>
  );
}

function FechaCorta({ iso }: { iso: string }) {
  const [, mes, dia] = iso.split('-');
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primario-suave leading-none" aria-hidden>
      <strong className="text-sm text-primario">{Number(dia)}</strong>
      <span className="mt-0.5 text-[9px] font-semibold text-primario">{meses[Number(mes) - 1]}</span>
    </span>
  );
}
