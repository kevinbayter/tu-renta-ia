import { Check } from 'lucide-react';
import Link from 'next/link';

const INCLUIDO = [
  'Declaraciones ilimitadas (propias y de otras personas)',
  'Lectura de documentos con IA y doble verificación',
  'Motor de cálculo determinista validado contra declaraciones reales',
  'Borrador en el formato oficial 210 de la DIAN',
  'Guía paso a paso para presentar y calendario de vencimientos',
];

export default function PaginaPlan() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Plan y suscripción</h1>
      <p className="mt-1 text-sm text-texto-suave">Tu plan actual y lo que incluye.</p>
      <section className="mt-6 rounded-3xl border border-primario/30 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xl font-bold">
              <span aria-hidden>💎</span> Plan Beta
            </p>
            <p className="mt-0.5 text-sm text-texto-suave">Tu plan actual</p>
          </div>
          <p className="text-right">
            <span className="text-3xl font-bold text-primario">$0</span>
            <span className="block text-xs text-texto-suave">mientras dure la beta</span>
          </p>
        </div>
        <ul className="mt-5 space-y-2.5">
          {INCLUIDO.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check size={16} className="mt-0.5 shrink-0 text-primario" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded-2xl border border-borde bg-card p-5 text-sm text-texto-suave">
        <p>
          Cuando existan planes de pago te avisaremos con anticipación — nunca habrá cobros sorpresa. Tu
          historial de pagos vivirá en{' '}
          <Link href="/facturacion" className="font-semibold text-primario underline">
            Facturación
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
