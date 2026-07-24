'use client';

import { ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { BarraProgreso } from '@/components/ui/barra-progreso';
import { DialogoConfirmar } from '@/components/ui/dialogo-confirmar';
import { InsigniaEstado } from '@/components/ui/insignia-estado';
import { cargarDeclaracionEnStore } from '@/lib/declaraciones-acciones';
import { formatearFechaLarga, vencimientosDe } from '@/lib/vencimientos';

import type { DeclaracionResumen } from '@turenta/core';

export function FilaPanel({ declaracion, alCambiar }: { declaracion: DeclaracionResumen; alCambiar: () => void }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const continuar = async () => {
    setOcupado(true);
    const ok = await cargarDeclaracionEnStore(declaracion);
    setOcupado(false);
    if (ok) {
      router.push('/declaracion');
    }
  };
  return (
    <article className="rounded-2xl border border-borde bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Identidad declaracion={declaracion} />
        <Dato etiqueta="Año gravable" valor={String(declaracion.anioGravable)} />
        <Dato etiqueta="Vencimiento" valor={vencimientoDe(declaracion)} />
        <div className="min-w-28">
          <p className="text-xs text-texto-suave">Estado</p>
          <div className="mt-1">
            <InsigniaEstado declaracion={declaracion} />
          </div>
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void continuar()}
            disabled={ocupado}
            className="flex items-center gap-1 rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
          >
            {ocupado ? '…' : 'Continuar'} <ChevronRight size={15} aria-hidden />
          </button>
          <MenuFila declaracion={declaracion} alCambiar={alCambiar} />
        </div>
      </div>
      <div className="mt-3">
        <BarraProgreso progreso={declaracion.progreso} etiqueta="Progreso de la declaración" />
      </div>
    </article>
  );
}

function Identidad({ declaracion }: { declaracion: DeclaracionResumen }) {
  const nombre = `${declaracion.titular.nombres} ${declaracion.titular.apellidos}`.trim();
  return (
    <div className="flex min-w-52 items-center gap-3">
      <Avatar nombre={nombre} tamano="lg" />
      <div>
        <p className="font-semibold">
          {nombre}{' '}
          {declaracion.titular.esPropia && (
            <span className="ml-1 rounded-md bg-primario-suave px-1.5 py-0.5 text-[11px] font-semibold text-primario">Titular</span>
          )}
        </p>
        <p className="text-xs text-texto-suave">
          {declaracion.titular.esPropia ? 'A nombre propio' : `C.C. ${declaracion.titular.identificacion}`}
        </p>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-texto-suave">{etiqueta}</p>
      <p className="mt-1 text-sm font-semibold">{valor}</p>
    </div>
  );
}

function MenuFila({ declaracion, alCambiar }: { declaracion: DeclaracionResumen; alCambiar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const eliminar = async () => {
    await fetch(`/api/declaraciones?id=${declaracion.id}`, { method: 'DELETE' }).catch(() => null);
    setConfirmando(false);
    alCambiar();
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-label="Más acciones" className="rounded-xl p-2 text-texto-suave transition hover:bg-background">
        <MoreVertical size={17} />
      </button>
      {abierto && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setAbierto(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-borde bg-card p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setConfirmando(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-error transition hover:bg-alerta-suave"
            >
              <Trash2 size={15} aria-hidden /> Eliminar
            </button>
          </div>
        </>
      )}
      {confirmando && (
        <DialogoConfirmar
          titulo="¿Eliminar esta declaración?"
          descripcion={`Se borrará la declaración ${String(declaracion.anioGravable)} de ${declaracion.titular.nombres} ${declaracion.titular.apellidos} con todo su avance. Esta acción no se puede deshacer.`}
          textoConfirmar="Sí, eliminar"
          alConfirmar={() => void eliminar()}
          alCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function vencimientoDe(declaracion: DeclaracionResumen): string {
  const vencimiento = vencimientosDe([declaracion], new Date())[0];
  return vencimiento ? formatearFechaLarga(vencimiento.fechaIso) : '—';
}
