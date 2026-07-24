import Link from 'next/link';

const PASOS = [
  { titulo: 'Sube tus documentos', detalle: 'Tu exógena de la DIAN y tus certificados en PDF. La IA los lee por ti.' },
  { titulo: 'Responde unas preguntas', detalle: 'Una conversación corta para completar lo que solo tú sabes.' },
  { titulo: 'Recibe tu borrador del 210', detalle: 'Cálculo exacto, explicado, con guía paso a paso para la DIAN.' },
];

export default function PaginaInicio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-primario">TuRenta AI</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
        Tu declaración de renta, <span className="text-primario">sin enredos</span>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-texto-suave">
        Sube tus documentos, responde unas preguntas y obtén tu borrador del formulario 210 — calculado con
        un motor exacto, no con promesas.
      </p>
      <ol className="mt-10 space-y-4">
        {PASOS.map((paso, indice) => (
          <li key={paso.titulo} className="flex gap-4 rounded-2xl border border-borde bg-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primario-suave font-bold text-primario">
              {indice + 1}
            </span>
            <div>
              <p className="font-semibold">{paso.titulo}</p>
              <p className="text-sm text-texto-suave">{paso.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link
        href="/declaracion"
        className="mt-10 inline-flex h-14 items-center justify-center rounded-2xl bg-primario px-8 text-lg font-semibold text-white transition hover:bg-primario-oscuro"
      >
        Empezar mi declaración
      </Link>
      <p className="mt-4 text-center text-xs text-texto-suave">
        Año gravable 2025 · Herramienta de autopreparación asistida · No sustituye asesoría profesional
      </p>
    </main>
  );
}
