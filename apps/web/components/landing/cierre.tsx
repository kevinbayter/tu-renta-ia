import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { LogoMarca } from './iconos';

export const PREGUNTAS = [
  {
    pregunta: '¿Necesito saber de impuestos?',
    respuesta:
      'No. Subes tus documentos, confirmas los datos que la IA extrajo y respondes unas preguntas en lenguaje normal. Nosotros nos encargamos de la técnica tributaria.',
  },
  {
    pregunta: '¿Quién presenta la declaración ante la DIAN?',
    respuesta:
      'Tú, con nuestra guía paso a paso — es gratis y toma pocos minutos en el portal de la DIAN. Eres siempre el titular y quien firma; nosotros preparamos todo para que solo transcribas.',
  },
  {
    pregunta: '¿Qué pasa con mis documentos y datos?',
    respuesta:
      'Viajan cifrados, se usan solo para tu declaración y puedes eliminar tu cuenta con todo lo tuyo en un clic (Ley 1581 de 2012). No vendemos ni compartimos tus datos.',
  },
  {
    pregunta: '¿Y si mi caso es complejo?',
    respuesta:
      'Hoy cubrimos empleados, pensionados, arriendos e ingresos de inversiones (la mayoría de los declarantes). Si tu caso excede el alcance — dividendos, activos en el exterior — te lo decimos de frente en vez de improvisar.',
  },
];

export function PreguntasFrecuentes() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-5 py-16">
      <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
      <span className="mt-3 block h-1 w-12 rounded-full bg-primario" />
      <div className="mt-8 space-y-3">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="group rounded-2xl border border-borde bg-card p-4">
            <summary className="flex cursor-pointer items-center justify-between font-medium">
              {item.pregunta}
              <span className="text-xl text-primario transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{item.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const GARANTIAS = ['Gratis durante la beta', 'Sin tarjeta de crédito', 'Elimina tu cuenta y tus datos cuando quieras'];

export function CtaFinal() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16">
      <div className="grid items-center gap-8 rounded-3xl border border-primario/20 bg-primario-suave/60 p-8 sm:p-10 lg:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">¿Listo para declarar sin enredos?</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-texto-suave">
            Sube tu exógena y mira tu resultado explicado paso a paso. Tu avance se guarda con solo tu correo.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/declaracion"
              className="rounded-2xl bg-primario px-6 py-3.5 font-semibold text-white transition hover:bg-primario-oscuro"
            >
              Comenzar gratis ahora →
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {GARANTIAS.map((garantia) => (
              <li key={garantia} className="flex items-center gap-1.5 text-xs text-texto-suave">
                <CheckCircle2 size={13} className="shrink-0 text-primario" aria-hidden />
                {garantia}
              </li>
            ))}
          </ul>
        </div>
        <span className="hidden text-8xl lg:block" aria-hidden>
          🤖
        </span>
      </div>
    </section>
  );
}

const COLUMNAS_PIE: { titulo: string; enlaces: { texto: string; href: string }[] }[] = [
  {
    titulo: 'Producto',
    enlaces: [
      { texto: 'Características', href: '/#caracteristicas' },
      { texto: 'Cómo funciona', href: '/#como' },
      { texto: 'Precios', href: '/#precios' },
      { texto: 'IA Fiscal', href: '/ia-fiscal' },
    ],
  },
  {
    titulo: 'Recursos',
    enlaces: [
      { texto: 'Centro de ayuda', href: '/ayuda' },
      { texto: 'Calendario tributario', href: '/calendario' },
      { texto: 'Preguntas frecuentes', href: '/#faq' },
    ],
  },
  {
    titulo: 'Legal',
    enlaces: [
      { texto: 'Términos y condiciones', href: '/terminos' },
      { texto: 'Política de privacidad', href: '/privacidad' },
      { texto: 'Iniciar sesión', href: '/ingresar' },
    ],
  },
];

export function PiePagina() {
  return (
    <footer className="border-t border-borde bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <LogoMarca />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-texto-suave">
            La plataforma de IA con la que haces tu declaración de renta tú mismo, sin conocimientos
            previos — paso a paso y con cada cifra explicada.
          </p>
        </div>
        {COLUMNAS_PIE.map((columna) => (
          <nav key={columna.titulo} aria-label={columna.titulo}>
            <p className="text-sm font-semibold">{columna.titulo}</p>
            <ul className="mt-3 space-y-2">
              {columna.enlaces.map((enlace) => (
                <li key={enlace.href}>
                  <Link href={enlace.href} className="text-sm text-texto-suave transition hover:text-foreground">
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-borde">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-texto-suave">
          <p>© 2026 TuRenta AI · Todos los derechos reservados.</p>
          <p>
            Hecho con <span aria-hidden>💚</span> en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
