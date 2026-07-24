import { clasificarResultado } from '@turenta/core';

import { formatearPesos } from '@/lib/tipos';

import type { DeclaracionResumen } from '@turenta/core';

/** Estado honesto de la declaración: jamás "pendiente de pago" con $0. */
export function InsigniaEstado({ declaracion }: { declaracion: DeclaracionResumen }) {
  const estado = clasificarResultado(declaracion.saldoAFavor, declaracion.saldoAPagar);
  if (estado === 'en_progreso') {
    return <Insignia clases="bg-alerta-suave text-alerta" texto="En progreso" />;
  }
  if (estado === 'saldo_a_favor') {
    return <Insignia clases="bg-exito-suave text-exito" texto={`A favor +${formatearPesos(declaracion.saldoAFavor ?? 0)}`} />;
  }
  if (estado === 'a_pagar') {
    return <Insignia clases="bg-alerta-suave text-alerta" texto={`A pagar ${formatearPesos(declaracion.saldoAPagar ?? 0)}`} />;
  }
  return <Insignia clases="bg-background text-texto-suave" texto="Sin saldo" />;
}

function Insignia({ clases, texto }: { clases: string; texto: string }) {
  return <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-medium ${clases}`}>{texto}</span>;
}
