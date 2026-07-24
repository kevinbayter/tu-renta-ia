import Link from 'next/link';

import { IconoCheck, LogoMarca } from './iconos';
import { MockupResumen } from './mockup-resumen';

const ENLACES_NAV = [
  { href: '#como', texto: 'Cómo funciona' },
  { href: '#recibes', texto: 'Qué recibes' },
  { href: '#confianza', texto: 'Seguridad' },
  { href: '#faq', texto: 'Preguntas frecuentes' },
];

const INSIGNIAS = [
  'Cálculo determinista auditado — la IA nunca inventa cifras',
  'Tú confirmas cada dato antes de que se use',
  'Tus datos cifrados y eliminables cuando quieras',
];

export function Hero() {
  return (
    <section className="bg-marino text-white">
      <BarraNavegacion />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-20 lg:pt-14">
        <ContenidoHero />
        <MockupResumen />
      </div>
    </section>
  );
}

function BarraNavegacion() {
  return (
    <header className="border-b border-marino-borde/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <LogoMarca claro />
        <nav className="hidden items-center gap-7 lg:flex">
          {ENLACES_NAV.map((enlace) => (
            <a key={enlace.href} href={enlace.href} className="text-sm text-marino-texto transition hover:text-white">
              {enlace.texto}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/ingresar" className="text-sm font-medium text-marino-texto transition hover:text-white">
            Ingresar
          </Link>
          <Link
            href="/declaracion"
            className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
          >
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
}

function ContenidoHero() {
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full border border-marino-borde bg-marino-suave px-3 py-1 text-xs text-marino-texto">
        📅 Año gravable 2025 · Temporada del 12 de agosto al 26 de octubre de 2026
      </p>
      <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
        Tu declaración de renta,
        <br />
        <span className="text-acento">clara y sin enredos</span>
      </h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-marino-texto">
        Sube tus documentos y nuestra IA los lee por ti. Un motor de cálculo exacto — validado con
        declaraciones reales — liquida tu formulario 210 y te entrega el borrador con instrucciones para
        presentarlo en la DIAN.
      </p>
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Link
          href="/declaracion"
          className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-primario px-7 py-3 font-semibold text-white shadow-lg shadow-primario/25 transition hover:bg-primario-oscuro"
        >
          Calcular mi declaración <span aria-hidden>→</span>
        </Link>
        <span className="text-sm text-marino-texto">En ~15 minutos · Sin saber de impuestos</span>
      </div>
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {INSIGNIAS.map((texto) => (
          <div key={texto} className="flex items-start gap-2">
            <IconoCheck tenue />
            <p className="text-xs leading-relaxed text-marino-texto">{texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
