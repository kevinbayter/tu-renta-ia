'use client';

import { CalendarDays, CheckCircle2, Download, FileUp, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { vencimientosDe } from '@/lib/vencimientos';

import type { DeclaracionResumen, EventoActividad } from '@turenta/core';

export function PanelDerecho({ lista }: { lista: DeclaracionResumen[] }) {
  return (
    <aside className="space-y-4" aria-label="Resumen lateral">
      <ProximosVencimientos lista={lista} />
      <ActividadReciente />
    </aside>
  );
}

const ICONOS_ACTIVIDAD: Record<string, typeof CheckCircle2> = {
  declaracion_guardada: CheckCircle2,
  exogena_importada: FileUp,
  documento_procesado: FileUp,
  borrador_descargado: Download,
  persona_guardada: UserPlus,
  declaracion_eliminada: Trash2,
};

function ActividadReciente() {
  const [eventos, setEventos] = useState<EventoActividad[]>([]);
  useEffect(() => {
    void cargarActividad(3).then(setEventos);
  }, []);
  if (eventos.length === 0) {
    return null;
  }
  return (
    <section className="rounded-2xl border border-borde bg-card p-5">
      <h2 className="font-semibold">Actividad reciente</h2>
      <ul className="mt-4 space-y-3">
        {eventos.map((e) => (
          <FilaActividad key={e.id} evento={e} />
        ))}
      </ul>
      <Link href="/actividad" className="mt-4 inline-block text-sm font-semibold text-primario">
        Ver toda la actividad →
      </Link>
    </section>
  );
}

export function FilaActividad({ evento }: { evento: EventoActividad }) {
  const Icono = ICONOS_ACTIVIDAD[evento.tipo] ?? CheckCircle2;
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primario-suave text-primario" aria-hidden>
        <Icono size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-snug">{evento.descripcion}</p>
        <p className="mt-0.5 text-xs text-texto-suave">{tiempoRelativo(evento.creadaEn)}</p>
      </div>
    </li>
  );
}

function tiempoRelativo(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutos < 60) {
    return minutos <= 1 ? 'Hace un momento' : `Hace ${minutos} minutos`;
  }
  const horas = Math.round(minutos / 60);
  if (horas < 24) {
    return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
  }
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}

export async function cargarActividad(limite: number): Promise<EventoActividad[]> {
  const respuesta = await fetch(`/api/actividad?limite=${String(limite)}`).catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const cuerpo = (await respuesta.json()) as { actividad: EventoActividad[] };
  return cuerpo.actividad;
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
