import { Bell, Search, Sparkles } from 'lucide-react';

import { LogoMarca } from './iconos';

/**
 * Mockup del dashboard real para el hero. EJEMPLO ILUSTRATIVO (sin datos de
 * personas reales) con matemática verdadera de la tabla art. 241 AG2025:
 * 95.400.000 − 38.160.000 = 57.240.000 gravable → impuesto 562.000;
 * retenciones 1.800.000 → 1.238.000 a favor.
 */

const MENU = ['Dashboard', 'Mis declaraciones', 'Documentos', 'IA Fiscal', 'Calendario'];

export function MockupPanel() {
  return (
    <div className="overflow-hidden rounded-3xl border border-borde bg-card text-foreground shadow-2xl shadow-black/10">
      <div className="flex items-center gap-3 border-b border-borde px-4 py-2.5">
        <LogoMarca />
        <span className="ml-2 hidden flex-1 items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-[10px] text-texto-suave sm:flex">
          <Search size={11} aria-hidden /> Buscar en TuRenta AI…
        </span>
        <Bell size={14} className="text-texto-suave" aria-hidden />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primario-suave text-[10px] font-bold text-primario" aria-hidden>
          TU
        </span>
      </div>
      <div className="grid grid-cols-[92px_1fr] sm:grid-cols-[118px_1fr]">
        <BarraLateralMini />
        <div className="space-y-3 p-3.5">
          <div>
            <p className="text-sm font-bold">Hola 👋</p>
            <p className="text-[10px] text-texto-suave">Este es el resumen de tu declaración 2025.</p>
          </div>
          <TarjetasMini />
          <FilaDeclaracionMini />
          <AsistenteMini />
          <p className="flex items-center gap-1.5 text-[10px] text-texto-suave">
            <span className="text-primario">✓</span> Ejemplo ilustrativo · cálculo real con la tabla del art. 241 y UVT 2025
          </p>
        </div>
      </div>
    </div>
  );
}

function BarraLateralMini() {
  return (
    <nav className="space-y-0.5 border-r border-borde bg-background/60 p-2">
      {MENU.map((item, i) => (
        <span
          key={item}
          className={`flex items-center gap-1 truncate rounded-lg px-2 py-1.5 text-[10px] ${
            i === 0 ? 'bg-primario-suave font-semibold text-primario' : 'text-texto-suave'
          }`}
        >
          {item}
          {item === 'IA Fiscal' && <span className="rounded bg-primario-suave px-1 text-[8px] font-bold text-primario">Beta</span>}
        </span>
      ))}
    </nav>
  );
}

function TarjetasMini() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-borde p-2.5">
        <p className="text-[9px] text-texto-suave">Saldo a favor</p>
        <p className="text-sm font-bold text-primario">$1.238.000</p>
      </div>
      <div className="rounded-xl border border-borde p-2.5">
        <p className="text-[9px] text-texto-suave">Progreso</p>
        <p className="text-sm font-bold">80%</p>
        <div className="mt-1 h-1 rounded-full bg-background">
          <div className="h-full w-4/5 rounded-full bg-primario" />
        </div>
      </div>
      <div className="rounded-xl border border-borde p-2.5">
        <p className="text-[9px] text-texto-suave">Vencimiento</p>
        <p className="text-[10px] font-semibold leading-tight">Según los dígitos de tu cédula</p>
      </div>
    </div>
  );
}

function FilaDeclaracionMini() {
  return (
    <div className="rounded-xl border border-borde p-3">
      <p className="text-[10px] font-semibold">Mis declaraciones</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primario-suave text-[9px] font-bold text-primario" aria-hidden>
          TU
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold">Tu declaración · 2025</p>
          <p className="text-[9px] text-exito">A favor +$1.238.000</p>
        </div>
        <span className="rounded-lg bg-primario px-2.5 py-1 text-[9px] font-semibold text-white">Continuar</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] text-texto-suave">
        <span>Progreso de la declaración</span>
        <span className="font-semibold text-primario">80% · Paso 4 de 5</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-background">
        <div className="h-full w-4/5 rounded-full bg-primario" />
      </div>
    </div>
  );
}

function AsistenteMini() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-primario-suave px-3 py-2">
      <Sparkles size={12} className="shrink-0 text-primario" aria-hidden />
      <p className="truncate text-[10px]">
        <strong>Asistente Fiscal IA:</strong> ¿Qué gastos puedo deducir?
      </p>
    </div>
  );
}
