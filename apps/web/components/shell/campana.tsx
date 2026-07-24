'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { NotificacionUsuario } from '@turenta/core';

/** Campana de notificaciones: badge con no-leídas reales y panel con la lista. */
export function Campana() {
  const [abierta, setAbierta] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionUsuario[]>([]);

  useEffect(() => {
    void cargar().then(setNotificaciones);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const marcarLeidas = async () => {
    await fetch('/api/notificaciones', { method: 'POST' }).catch(() => null);
    setNotificaciones(notificaciones.map((n) => ({ ...n, leida: true })));
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        aria-label={`Notificaciones (${String(noLeidas)} sin leer)`}
        className="relative rounded-xl p-2 text-texto-suave transition hover:bg-background"
      >
        <Bell size={19} />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primario px-1 text-[10px] font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>
      {abierta && (
        <PanelNotificaciones
          notificaciones={notificaciones}
          hayNoLeidas={noLeidas > 0}
          alMarcarLeidas={() => void marcarLeidas()}
          alCerrar={() => setAbierta(false)}
        />
      )}
    </div>
  );
}

function PanelNotificaciones({
  notificaciones,
  hayNoLeidas,
  alMarcarLeidas,
  alCerrar,
}: {
  notificaciones: NotificacionUsuario[];
  hayNoLeidas: boolean;
  alMarcarLeidas: () => void;
  alCerrar: () => void;
}) {
  return (
    <>
      <button type="button" aria-hidden tabIndex={-1} onClick={alCerrar} className="fixed inset-0 z-10 cursor-default" />
      <div className="absolute right-0 top-11 z-20 w-80 rounded-2xl border border-borde bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-borde px-4 py-2.5">
          <p className="text-sm font-semibold">Notificaciones</p>
          {hayNoLeidas && (
            <button type="button" onClick={alMarcarLeidas} className="text-xs font-semibold text-primario">
              Marcar todas leídas
            </button>
          )}
        </div>
        {notificaciones.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-texto-suave">Estás al día: no tienes notificaciones.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto p-1.5">
            {notificaciones.map((n) => (
              <li key={n.id} className={`rounded-xl px-3 py-2.5 ${n.leida ? '' : 'bg-primario-suave/50'}`}>
                <p className="text-sm font-medium">{n.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-texto-suave">{n.cuerpo}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

async function cargar(): Promise<NotificacionUsuario[]> {
  const respuesta = await fetch('/api/notificaciones').catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const cuerpo = (await respuesta.json()) as { notificaciones: NotificacionUsuario[] };
  return cuerpo.notificaciones;
}
