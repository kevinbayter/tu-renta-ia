'use client';

import { useEffect, useState } from 'react';

import { BarraLateral } from './barra-lateral';
import { BarraSuperior } from './barra-superior';
import { PaletaBusqueda } from './paleta-busqueda';
import { useSesionCliente } from '@/lib/sesion-cliente';

/** Shell de la app autenticada: sidebar fija (drawer en móvil) + topbar + contenido. */
export function Cascaron({ children }: { children: React.ReactNode }) {
  const sesion = useSesionCliente();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);

  useEffect(() => atajoBusqueda(() => setBusquedaAbierta(true)), []);

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 lg:block">
        <BarraLateral />
      </aside>
      {menuAbierto && <DrawerMovil alCerrar={() => setMenuAbierto(false)} />}
      <div className="flex min-h-dvh flex-1 flex-col lg:pl-60">
        <BarraSuperior
          sesion={sesion}
          alAbrirMenu={() => setMenuAbierto(true)}
          alAbrirBusqueda={() => setBusquedaAbierta(true)}
        />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
      {busquedaAbierta && <PaletaBusqueda alCerrar={() => setBusquedaAbierta(false)} />}
    </div>
  );
}

function DrawerMovil({ alCerrar }: { alCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <button type="button" aria-label="Cerrar menú" onClick={alCerrar} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-y-0 left-0 w-64">
        <BarraLateral alNavegar={alCerrar} />
      </div>
    </div>
  );
}

function atajoBusqueda(abrir: () => void): () => void {
  const manejador = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      abrir();
    }
  };
  window.addEventListener('keydown', manejador);
  return () => window.removeEventListener('keydown', manejador);
}
