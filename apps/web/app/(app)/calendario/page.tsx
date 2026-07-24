'use client';

import { obtenerConstantes } from '@turenta/motor-fiscal';
import { useEffect, useState } from 'react';

import { formatearFechaLarga, vencimientosDe } from '@/lib/vencimientos';

import type { VencimientoTitular } from '@/lib/vencimientos';
import type { DeclaracionResumen } from '@turenta/core';

const ANIO = 2025;

export default function PaginaCalendario() {
  const [mios, setMios] = useState<VencimientoTitular[]>([]);
  useEffect(() => {
    void cargarVencimientosPropios().then(setMios);
  }, []);
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Calendario tributario</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Vencimientos oficiales de renta personas naturales, año gravable {ANIO} (Decreto 2229 de 2023), según
        los dos últimos dígitos de la cédula.
      </p>
      {mios.length > 0 && <MisFechas mios={mios} />}
      <TablaCalendario mios={mios} />
    </main>
  );
}

function MisFechas({ mios }: { mios: VencimientoTitular[] }) {
  return (
    <section className="mt-6 rounded-2xl border border-primario/30 bg-primario-suave p-4">
      <h2 className="text-sm font-bold">Tus fechas</h2>
      <ul className="mt-2 space-y-1.5">
        {mios.map((v) => (
          <li key={v.identificacion} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <strong className="font-semibold">{v.titular}</strong>
            <span className="text-texto-suave">(C.C. …{v.identificacion.slice(-2)})</span>
            <span>
              vence el <strong className="text-primario">{formatearFechaLarga(v.fechaIso)}</strong>
            </span>
            {v.dias >= 0 && <span className="text-xs text-texto-suave">— faltan {v.dias} días</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TablaCalendario({ mios }: { mios: VencimientoTitular[] }) {
  const fechas = obtenerConstantes(ANIO).calendarioVencimientos;
  const fechasMias = new Set(mios.map((v) => v.fechaIso));
  return (
    <section className="mt-6 overflow-x-auto rounded-2xl border border-borde bg-card">
      <table className="w-full min-w-96 text-sm">
        <thead>
          <tr className="bg-primario-suave text-left text-xs text-texto-suave">
            <th className="px-4 py-2.5">Últimos dígitos de la cédula</th>
            <th className="px-4 py-2.5">Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {fechas.map((fecha, i) => (
            <tr key={fecha} className={`border-t border-borde ${fechasMias.has(fecha) ? 'bg-primario-suave/60 font-semibold' : ''}`}>
              <td className="px-4 py-2 font-mono">{etiquetaDigitos(i)}</td>
              <td className="px-4 py-2">
                {formatearFechaLarga(fecha)}
                {fechasMias.has(fecha) && <span className="ml-2 rounded-md bg-primario px-1.5 py-0.5 text-[10px] font-bold text-white">Tu fecha</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function etiquetaDigitos(indice: number): string {
  const primero = String(indice * 2 + 1).padStart(2, '0');
  const segundo = String((indice * 2 + 2) % 100).padStart(2, '0');
  return `${primero} y ${segundo}`;
}

async function cargarVencimientosPropios(): Promise<VencimientoTitular[]> {
  const respuesta = await fetch('/api/declaraciones').catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const cuerpo = (await respuesta.json()) as { declaraciones: DeclaracionResumen[] };
  return vencimientosDe(cuerpo.declaraciones, new Date());
}
