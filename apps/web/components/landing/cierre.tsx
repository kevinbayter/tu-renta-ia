import Link from 'next/link';

import { LogoMarca } from './iconos';

export function BandaEjemplo() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-4">
      <div className="grid gap-6 rounded-3xl bg-marino p-8 text-white sm:grid-cols-2 sm:items-center">
        <div className="flex items-center gap-4">
          <span className="hidden h-14 w-14 items-center justify-center rounded-full border border-marino-borde text-2xl sm:flex" aria-hidden>
            💰
          </span>
          <div>
            <p className="text-sm text-marino-texto">Motor de cálculo verificado</p>
            <p className="text-3xl font-bold text-acento">Peso a peso</p>
            <p className="text-sm text-marino-texto">
              validado contra declaraciones reales presentadas ante la DIAN, casilla por casilla
            </p>
          </div>
        </div>
        <p className="text-lg leading-snug sm:border-l sm:border-marino-borde sm:pl-6">
          Más de la mitad de los declarantes en Colombia tiene saldo a favor y no lo sabe.
        </p>
      </div>
    </section>
  );
}

const PREGUNTAS = [
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
      'Hoy cubrimos empleados e ingresos de inversiones (la mayoría de los declarantes). Si tu caso excede el alcance — pensiones, dividendos, activos en el exterior — te lo decimos de frente en vez de improvisar.',
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

export function CierreCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16">
      <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-primario/20 bg-primario-suave p-8 sm:flex-row">
        <div className="flex items-center gap-4">
          <span className="hidden h-12 w-12 items-center justify-center rounded-full bg-primario/10 text-2xl sm:flex" aria-hidden>
            🛡️
          </span>
          <div>
            <h2 className="text-xl font-bold">Empieza hoy, sin compromiso</h2>
            <p className="mt-1 max-w-md text-sm text-texto-suave">
              Sube tu exógena y mira tu resultado. Tu avance se guarda en la nube si creas tu cuenta con solo tu correo.
            </p>
          </div>
        </div>
        <Link
          href="/declaracion"
          className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primario px-7 py-3 font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Calcular mi declaración <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

export function PiePagina() {
  return (
    <footer className="bg-marino text-marino-texto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <LogoMarca claro />
          <p className="mt-2 text-xs">Herramienta de autopreparación asistida · No sustituye asesoría profesional</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs">
          <Link href="/terminos" className="transition hover:text-white">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="transition hover:text-white">
            Privacidad
          </Link>
          <Link href="/ingresar" className="transition hover:text-white">
            Ingresar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
