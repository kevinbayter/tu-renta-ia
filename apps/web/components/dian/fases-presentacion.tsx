'use client';

import { CheckCircle2, Download, KeyRound, Loader2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { formatearPesos } from '@/lib/tipos';

import type { Presentacion } from '@/lib/store';
import type { DiferenciaCasilla } from '@turenta/core';

export function Progreso({ avance }: { avance: string }) {
  return (
    <div className="pt-5 text-center">
      <Loader2 size={28} className="mx-auto animate-spin text-primario" aria-hidden />
      <p className="mt-3 font-semibold">Presentando tu declaración ante la DIAN…</p>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-medium text-primario">
        {avance}…
      </p>
      <p className="mt-2 text-xs text-texto-suave">
        Recorremos el formulario, comparamos cada cifra con la DIAN, firmamos y presentamos. Puede tardar
        varios minutos: no cierres esta ventana.
      </p>
    </div>
  );
}

/** El portal pidió el segundo factor: llega al correo o celular del RUT. */
export function PedirCodigo({ alEnviar }: { alEnviar: (codigo: string) => void }) {
  const [codigo, setCodigo] = useState('');
  return (
    <div className="pt-5">
      <p className="flex items-center gap-2 font-semibold">
        <KeyRound size={18} className="text-primario" aria-hidden /> La DIAN pidió un código
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-suave">
        No firmamos nada. La DIAN acaba de enviar un código al correo o celular registrados en el RUT.
        Escríbelo aquí y volvemos a intentarlo.
      </p>
      <input
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.trim())}
        inputMode="numeric"
        aria-label="Código de la firma electrónica"
        className="mt-3 h-12 w-full rounded-2xl border border-borde bg-background px-3 text-center font-mono text-lg tracking-widest outline-none focus:border-primario"
      />
      <button
        type="button"
        disabled={codigo.length < 4}
        onClick={() => alEnviar(codigo)}
        className="mt-3 h-12 w-full cursor-pointer rounded-2xl bg-primario font-semibold text-white disabled:opacity-40"
      >
        Firmar y presentar
      </button>
    </div>
  );
}

export function Presentada({ presentacion, acuse }: { presentacion: Presentacion; acuse?: string }) {
  return (
    <div className="rounded-3xl border border-exito/40 bg-exito-suave/40 p-5">
      <p className="flex items-center gap-2 font-semibold text-exito">
        <CheckCircle2 size={18} aria-hidden /> Presentaste tu declaración de renta
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        Quedó radicada ante la DIAN el {fecha(presentacion.presentadaEn)}, con el formulario{' '}
        <strong>{presentacion.numeroFormulario}</strong>. No tienes que hacer nada más.
      </p>
      {acuse && <BotonAcuse acuse={acuse} nombre={presentacion.nombreAcuse} />}
    </div>
  );
}

function BotonAcuse({ acuse, nombre }: { acuse: string; nombre: string }) {
  return (
    <a
      href={`data:application/pdf;base64,${acuse}`}
      download={nombre || 'acuse-dian.pdf'}
      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro"
    >
      <Download size={16} aria-hidden /> Descargar declaración presentada
    </a>
  );
}

function fecha(iso: string): string {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? 'hoy' : valor.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
}

/** Firmó pero no pudo presentar, o el portal calculó distinto: el usuario debe saberlo exactamente. */
export function Incompleta({ mensaje, diferencias }: { mensaje: string; diferencias: DiferenciaCasilla[] }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-semibold text-alerta">
        <TriangleAlert size={18} aria-hidden /> {mensaje}
      </p>
      {diferencias.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-texto-suave">
              <th>Casilla</th>
              <th className="text-right">TuRenta</th>
              <th className="text-right">DIAN</th>
            </tr>
          </thead>
          <tbody>
            {diferencias.map((d) => (
              <tr key={d.casilla}>
                <td>{d.casilla}</td>
                <td className="text-right font-mono">{formatearPesos(d.turenta)}</td>
                <td className="text-right font-mono">{formatearPesos(d.portal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
