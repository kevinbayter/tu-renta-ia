'use client';

import {
  CalendarDays,
  FileText,
  Gem,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogoMarca } from '@/components/landing/iconos';

interface ItemNav {
  ruta: string;
  etiqueta: string;
  Icono: typeof LayoutDashboard;
  beta?: boolean;
}

const NAVEGACION: ItemNav[] = [
  { ruta: '/panel', etiqueta: 'Dashboard', Icono: LayoutDashboard },
  { ruta: '/declaraciones', etiqueta: 'Mis declaraciones', Icono: FileText },
  { ruta: '/clientes', etiqueta: 'Clientes', Icono: Users },
  { ruta: '/ia-fiscal', etiqueta: 'IA Fiscal', Icono: Sparkles, beta: true },
  { ruta: '/calendario', etiqueta: 'Calendario tributario', Icono: CalendarDays },
  { ruta: '/facturacion', etiqueta: 'Facturación', Icono: Receipt },
  { ruta: '/plan', etiqueta: 'Plan y suscripción', Icono: Gem },
  { ruta: '/configuracion', etiqueta: 'Configuración', Icono: Settings },
];

export function BarraLateral({ alNavegar }: { alNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col border-r border-borde bg-card">
      <div className="px-5 py-5">
        <Link href="/" aria-label="Ir al inicio">
          <LogoMarca />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Navegación principal">
        {NAVEGACION.map((item) => (
          <ItemNavegacion key={item.ruta} item={item} activo={pathname.startsWith(item.ruta)} alNavegar={alNavegar} />
        ))}
      </nav>
      <div className="space-y-3 p-4">
        <TarjetaPlan />
        <TarjetaAyuda />
      </div>
    </div>
  );
}

function ItemNavegacion({ item, activo, alNavegar }: { item: ItemNav; activo: boolean; alNavegar?: () => void }) {
  return (
    <Link
      href={item.ruta}
      onClick={alNavegar}
      aria-current={activo ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        activo ? 'bg-primario-suave font-semibold text-primario' : 'text-texto-suave hover:bg-background hover:text-foreground'
      }`}
    >
      <item.Icono size={18} strokeWidth={activo ? 2.2 : 1.8} aria-hidden />
      {item.etiqueta}
      {item.beta && (
        <span className="ml-auto rounded-md bg-primario-suave px-1.5 py-0.5 text-[10px] font-bold text-primario">Beta</span>
      )}
    </Link>
  );
}

function TarjetaPlan() {
  return (
    <Link href="/plan" className="block rounded-2xl border border-borde bg-background p-3.5 transition hover:border-primario/40">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <span aria-hidden>💎</span> Plan Beta
      </p>
      <p className="mt-1 text-xs leading-relaxed text-texto-suave">
        Gratis mientras estamos en beta: todas las funcionalidades incluidas.
      </p>
      <span className="mt-1.5 inline-block text-xs font-semibold text-primario">Ver mi plan →</span>
    </Link>
  );
}

function TarjetaAyuda() {
  return (
    <Link href="/ayuda" className="block rounded-2xl border border-borde bg-background p-3.5 transition hover:border-primario/40">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <LifeBuoy size={15} aria-hidden className="text-primario" /> ¿Necesitas ayuda?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-texto-suave">Preguntas frecuentes y contacto directo.</p>
      <span className="mt-1.5 inline-block text-xs font-semibold text-primario">Centro de ayuda →</span>
    </Link>
  );
}
