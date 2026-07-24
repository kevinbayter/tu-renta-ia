import { CheckCircle2, FileCheck2, Lock, ShieldCheck, Timer } from 'lucide-react';
import Link from 'next/link';

import { LogoMarca } from './iconos';
import { MockupPanel } from './mockup-panel';

const ENLACES_NAV = [
  { href: '#caracteristicas', texto: 'Características' },
  { href: '#como', texto: 'Cómo funciona' },
  { href: '#precios', texto: 'Precios' },
  { href: '#faq', texto: 'Preguntas' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-borde bg-background">
      <BarraNavegacion />
      <FondoHero />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
        <ContenidoHero />
        <VitrinaMockup />
      </div>
    </section>
  );
}

/** Capa decorativa: patrón de puntos + brillos verdes difuminados. */
function FondoHero() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="heroe-puntos absolute inset-0" />
      <div className="heroe-brillo absolute -top-32 left-[-10%] h-[480px] w-[480px] rounded-full" />
      <div className="heroe-brillo absolute right-[-12%] top-16 h-[560px] w-[560px] rounded-full opacity-80" />
    </div>
  );
}

function BarraNavegacion() {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <LogoMarca />
        <nav className="hidden items-center gap-7 lg:flex">
          {ENLACES_NAV.map((enlace) => (
            <a key={enlace.href} href={enlace.href} className="text-sm font-medium text-texto-suave transition hover:text-foreground">
              {enlace.texto}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/ingresar" className="text-sm font-medium text-texto-suave transition hover:text-foreground">
            Iniciar sesión
          </Link>
          <Link
            href="/declaracion"
            className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primario/25 transition hover:-translate-y-0.5 hover:bg-primario-oscuro"
          >
            Comenzar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}

function ContenidoHero() {
  return (
    <div>
      <span className="animar-entrada inline-flex items-center gap-2 rounded-full bg-primario-suave px-3.5 py-1.5 text-xs font-semibold text-primario">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primario opacity-70 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primario" />
        </span>
        IA Fiscal que trabaja por ti
      </span>
      <h1 className="animar-entrada mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-6xl" style={{ animationDelay: '0.1s' }}>
        Tu declaración de renta, <PalabraSubrayada>sin enredos</PalabraSubrayada>
      </h1>
      <p className="animar-entrada mt-5 max-w-lg text-lg leading-relaxed text-texto-suave" style={{ animationDelay: '0.2s' }}>
        Sube tu exógena y tus certificados: la IA los lee con doble verificación, tú confirmas cada dato
        y un motor auditado calcula tu formulario 210.
      </p>
      <div className="animar-entrada mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.3s' }}>
        <Link
          href="/declaracion"
          className="rounded-2xl bg-primario px-7 py-4 font-semibold text-white shadow-xl shadow-primario/30 transition hover:-translate-y-0.5 hover:bg-primario-oscuro"
        >
          Comenzar gratis
        </Link>
        <a
          href="#como"
          className="rounded-2xl border border-borde bg-card px-7 py-4 font-semibold transition hover:-translate-y-0.5 hover:border-primario/40"
        >
          Ver cómo funciona
        </a>
      </div>
      <ul className="animar-entrada mt-8 flex flex-wrap gap-x-5 gap-y-2" style={{ animationDelay: '0.45s' }}>
        <ChipConfianza Icono={Lock} texto="Cifrado y habeas data (Ley 1581)" />
        <ChipConfianza Icono={CheckCircle2} texto="Validado contra declaraciones reales" />
        <ChipConfianza Icono={Timer} texto="Gratis durante la beta" />
      </ul>
    </div>
  );
}

/** Subrayado a mano alzada que se dibuja solo al cargar. */
function PalabraSubrayada({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap text-primario">
      {children}
      <svg viewBox="0 0 320 24" aria-hidden className="absolute -bottom-3 left-0 w-full">
        <path
          d="M6 17 C 80 6, 150 20, 314 9"
          fill="none"
          stroke="var(--acento)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.55"
          className="trazo-subrayado"
        />
      </svg>
    </span>
  );
}

function VitrinaMockup() {
  return (
    <div className="animar-entrada-derecha relative" style={{ animationDelay: '0.25s' }}>
      <div aria-hidden className="heroe-brillo absolute -inset-10 rounded-full opacity-90" />
      <div className="relative transition-transform duration-500 lg:rotate-1 lg:hover:rotate-0">
        <MockupPanel />
      </div>
      <TarjetaFlotante posicion="-left-5 top-8" retardo="0s" Icono={ShieldCheck} texto="Doble verificación IA" />
      <TarjetaFlotante posicion="-right-4 bottom-14" retardo="1.6s" Icono={FileCheck2} texto="Borrador 210 oficial" />
    </div>
  );
}

function TarjetaFlotante({
  posicion,
  retardo,
  Icono,
  texto,
}: {
  posicion: string;
  retardo: string;
  Icono: typeof ShieldCheck;
  texto: string;
}) {
  return (
    <div
      className={`flotante absolute z-10 hidden items-center gap-2 rounded-2xl border border-borde bg-card px-3.5 py-2.5 text-xs font-semibold shadow-xl lg:flex ${posicion}`}
      style={{ animationDelay: retardo }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primario-suave text-primario" aria-hidden>
        <Icono size={15} />
      </span>
      {texto}
    </div>
  );
}

function ChipConfianza({ Icono, texto }: { Icono: typeof Lock; texto: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs text-texto-suave">
      <Icono size={13} className="shrink-0 text-primario" aria-hidden />
      {texto}
    </li>
  );
}

/** Franja de confianza con hechos verificables — nada de cifras infladas ni reseñas. */
export function BandaConfianza() {
  const hechos = [
    'Motor de cálculo validado peso a peso contra declaraciones reales presentadas ante la DIAN',
    'Cada documento se lee DOS veces con IA y tú confirmas los valores',
    'Cada regla del cálculo cita la norma que la respalda',
  ];
  return (
    <section className="border-b border-borde bg-card">
      <ul className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-8 sm:grid-cols-3">
        {hechos.map((hecho) => (
          <li key={hecho} className="flex items-start gap-2 text-sm leading-relaxed text-texto-suave">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primario" aria-hidden />
            {hecho}
          </li>
        ))}
      </ul>
    </section>
  );
}
