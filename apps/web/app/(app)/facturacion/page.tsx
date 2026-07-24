import { Receipt } from 'lucide-react';
import Link from 'next/link';

export default function PaginaFacturacion() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Facturación</h1>
      <p className="mt-1 text-sm text-texto-suave">Historial de tus pagos en TuRenta AI.</p>
      <section className="mt-6 flex flex-col items-center rounded-3xl border border-borde bg-card px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primario-suave text-primario" aria-hidden>
          <Receipt size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold">No tienes pagos todavía</h2>
        <p className="mt-1 max-w-sm text-sm text-texto-suave">
          Estás en el <strong>Plan Beta gratuito</strong>, así que no hay facturas. Cuando actives un plan de
          pago, aquí verás cada cobro con su comprobante.
        </p>
        <Link href="/plan" className="mt-5 rounded-xl bg-primario-suave px-4 py-2 text-sm font-semibold text-primario">
          Ver mi plan
        </Link>
      </section>
    </main>
  );
}
