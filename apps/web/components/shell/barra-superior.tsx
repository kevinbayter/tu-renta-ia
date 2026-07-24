'use client';

import { ChevronDown, LifeBuoy, LogOut, Menu, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';

import type { SesionCliente } from '@/lib/sesion-cliente';

export function BarraSuperior({
  sesion,
  alAbrirMenu,
  alAbrirBusqueda,
}: {
  sesion: SesionCliente;
  alAbrirMenu: () => void;
  alAbrirBusqueda: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-borde bg-card px-4 py-3 sm:px-6">
      <button type="button" onClick={alAbrirMenu} aria-label="Abrir menú" className="rounded-lg p-1.5 text-texto-suave lg:hidden">
        <Menu size={20} />
      </button>
      <BotonBusqueda alAbrir={alAbrirBusqueda} />
      <span className="flex-1" />
      <ZonaUsuario sesion={sesion} />
    </header>
  );
}

function BotonBusqueda({ alAbrir }: { alAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={alAbrir}
      className="flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-borde bg-background px-3 text-sm text-texto-suave transition hover:border-primario/40"
    >
      <Search size={16} aria-hidden />
      <span className="flex-1 text-left">Buscar en TuRenta AI…</span>
      <kbd className="hidden rounded-md border border-borde bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
    </button>
  );
}

function ZonaUsuario({ sesion }: { sesion: SesionCliente }) {
  if (sesion.fase === 'cargando') {
    return null;
  }
  if (sesion.fase === 'anonimo') {
    return (
      <Link href="/ingresar" className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro">
        Ingresar
      </Link>
    );
  }
  const nombre = sesion.perfil?.nombres ? `${sesion.perfil.nombres} ${sesion.perfil.apellidos}` : sesion.email;
  return <MenuUsuario nombre={nombre} />;
}

function MenuUsuario({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const salir = async () => {
    await fetch('/api/auth/sesion', { method: 'DELETE' }).catch(() => null);
    router.push('/');
    router.refresh();
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex items-center gap-2.5" aria-expanded={abierto}>
        <Avatar nombre={nombre} />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{nombre}</span>
          <span className="block text-xs text-texto-suave">Administrador</span>
        </span>
        <ChevronDown size={16} className="text-texto-suave" aria-hidden />
      </button>
      {abierto && <OpcionesUsuario alCerrar={() => setAbierto(false)} alSalir={() => void salir()} />}
    </div>
  );
}

function OpcionesUsuario({ alCerrar, alSalir }: { alCerrar: () => void; alSalir: () => void }) {
  return (
    <>
      <button type="button" aria-hidden tabIndex={-1} onClick={alCerrar} className="fixed inset-0 z-10 cursor-default" />
      <div className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-borde bg-card p-1.5 shadow-xl">
        <OpcionMenu href="/configuracion" Icono={Settings} etiqueta="Configuración" alCerrar={alCerrar} />
        <OpcionMenu href="/ayuda" Icono={LifeBuoy} etiqueta="Centro de ayuda" alCerrar={alCerrar} />
        <button
          type="button"
          onClick={alSalir}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-error transition hover:bg-alerta-suave"
        >
          <LogOut size={16} aria-hidden /> Salir
        </button>
      </div>
    </>
  );
}

function OpcionMenu({
  href,
  Icono,
  etiqueta,
  alCerrar,
}: {
  href: string;
  Icono: typeof Settings;
  etiqueta: string;
  alCerrar: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={alCerrar}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-background"
    >
      <Icono size={16} className="text-texto-suave" aria-hidden /> {etiqueta}
    </Link>
  );
}
