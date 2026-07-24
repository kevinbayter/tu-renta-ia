'use client';

import { fechaVencimiento, obtenerConstantes } from '@turenta/motor-fiscal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { DeclaracionResumen } from '@turenta/core';

export function FilaDeclaracion({ declaracion }: { declaracion: DeclaracionResumen }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  const continuar = async () => {
    setOcupado(true);
    const ok = await cargarEnStore(declaracion);
    setOcupado(false);
    if (ok) {
      router.push('/declaracion');
    }
  };

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar la declaración ${String(declaracion.anioGravable)} de ${declaracion.titular.nombres}?`)) {
      return;
    }
    await fetch(`/api/declaraciones?id=${declaracion.id}`, { method: 'DELETE' }).catch(() => null);
    window.location.reload();
  };

  return (
    <tr className="border-b border-borde last:border-0">
      <td className="px-3 py-3">
        <p className="font-medium">
          {declaracion.titular.nombres} {declaracion.titular.apellidos}
        </p>
        <p className="text-xs text-texto-suave">
          {declaracion.titular.esPropia ? 'A nombre propio' : `C.C. ${declaracion.titular.identificacion}`}
        </p>
      </td>
      <td className="px-3 py-3 font-mono">{declaracion.anioGravable}</td>
      <td className="px-3 py-3">{vencimientoDe(declaracion)}</td>
      <td className="px-3 py-3">
        <Estado declaracion={declaracion} />
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          onClick={() => void continuar()}
          disabled={ocupado}
          className="rounded-xl bg-primario px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
        >
          {ocupado ? '…' : 'Continuar'}
        </button>
        <button
          type="button"
          onClick={() => void eliminar()}
          aria-label="Eliminar declaración"
          className="ml-2 rounded-xl px-2 py-1.5 text-xs text-texto-suave hover:text-error"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}

function Estado({ declaracion }: { declaracion: DeclaracionResumen }) {
  if (declaracion.saldoAFavor === null) {
    return <span className="rounded-lg bg-alerta-suave px-2 py-0.5 text-xs text-alerta">En progreso</span>;
  }
  const esFavor = declaracion.saldoAFavor > 0;
  const texto = esFavor
    ? `A favor ${formatearPesos(declaracion.saldoAFavor)}`
    : `A pagar ${formatearPesos(declaracion.saldoAPagar ?? 0)}`;
  return <span className="rounded-lg bg-exito-suave px-2 py-0.5 text-xs text-exito">{texto}</span>;
}

function vencimientoDe(declaracion: DeclaracionResumen): string {
  try {
    const fecha = fechaVencimiento(declaracion.titular.identificacion, obtenerConstantes(declaracion.anioGravable));
    return formatearFecha(fecha);
  } catch {
    return '—';
  }
}

function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(dia)} de ${meses[Number(mes) - 1] ?? ''} de ${anio ?? ''}`;
}

async function cargarEnStore(declaracion: DeclaracionResumen): Promise<boolean> {
  const respuesta = await fetch(`/api/declaraciones/${declaracion.id}`).catch(() => null);
  if (!respuesta?.ok) {
    return false;
  }
  const { estado } = (await respuesta.json()) as { estado: Record<string, unknown> };
  const store = useDeclaracion.getState();
  store.reiniciar();
  store.hidratar(estado);
  store.establecerTitular(
    {
      nombres: declaracion.titular.nombres,
      apellidos: declaracion.titular.apellidos,
      identificacion: declaracion.titular.identificacion,
    },
    declaracion.titular.esPropia,
    declaracion.id,
  );
  return true;
}
