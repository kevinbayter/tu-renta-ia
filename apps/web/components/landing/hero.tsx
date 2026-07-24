import { CheckCircle2, Lock, Timer } from 'lucide-react';
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
    <section className="border-b border-borde bg-background">
      <BarraNavegacion />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-10 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:pb-20 lg:pt-14">
        <ContenidoHero />
        <MockupPanel />
      </div>
    </section>
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
            className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
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
      <span className="inline-block rounded-full bg-primario-suave px-3 py-1 text-xs font-semibold text-primario">
        IA Fiscal que trabaja por ti
      </span>
      <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        Tu declaración de renta, <span className="text-primario">sin enredos</span>
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-texto-suave">
        TuRenta AI te guía paso a paso: sube tu exógena y tus certificados, la IA los lee con doble
        verificación, tú confirmas cada dato y un motor auditado calcula tu formulario 210.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/declaracion"
          className="rounded-2xl bg-primario px-6 py-3.5 font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Comenzar gratis
        </Link>
        <a
          href="#como"
          className="rounded-2xl border border-borde bg-card px-6 py-3.5 font-semibold transition hover:border-primario/40"
        >
          Ver cómo funciona
        </a>
      </div>
      <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
        <ChipConfianza Icono={Lock} texto="Cifrado y habeas data (Ley 1581)" />
        <ChipConfianza Icono={CheckCircle2} texto="Validado contra declaraciones reales" />
        <ChipConfianza Icono={Timer} texto="Gratis durante la beta" />
      </ul>
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
