import { Calculator, FileUp, Globe, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react';

const TARJETAS = [
  {
    Icono: Sparkles,
    titulo: 'IA que te guía',
    detalle:
      'Una entrevista en español simple que confirma lo que ya está en tus documentos (no te lo vuelve a preguntar) y captura tus deducciones.',
  },
  {
    Icono: FileUp,
    titulo: 'Precarga desde tu exógena',
    detalle:
      'Subes el Excel de la DIAN y organizamos todo: qué certificados necesitas, tus rendimientos, saldos y el saldo a favor del año pasado.',
  },
  {
    Icono: SearchCheck,
    titulo: 'Revisión inteligente',
    detalle:
      'Cada PDF se lee dos veces de forma independiente, y las recomendaciones te avisan de inconsistencias con un % de confiabilidad explicable.',
  },
  {
    Icono: Calculator,
    titulo: 'Cálculo determinista',
    detalle:
      'El impuesto lo calcula un motor auditado y validado contra declaraciones reales — la IA nunca inventa cifras. Incluye simulador gratuito.',
  },
  {
    Icono: Globe,
    titulo: '100% en línea',
    detalle:
      'Desde cualquier lugar y dispositivo, sin instalar nada. Tu avance se guarda en la nube y lo retomas cuando quieras.',
  },
  {
    Icono: ShieldCheck,
    titulo: 'Seguridad y control',
    detalle:
      'Tus datos viajan cifrados, se usan solo para tu declaración (Ley 1581) y tienes un botón real para eliminar tu cuenta con todo.',
  },
];

export function Caracteristicas() {
  return (
    <section id="caracteristicas" className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="text-center">
        <span className="inline-block rounded-full bg-primario-suave px-3 py-1 text-xs font-semibold text-primario">
          Características
        </span>
        <h2 className="mx-auto mt-3 max-w-md text-3xl font-bold tracking-tight">
          Todo lo que necesitas para declarar sin estrés
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS.map(({ Icono, titulo, detalle }) => (
          <article key={titulo} className="rounded-2xl border border-borde bg-card p-5 transition hover:border-primario/30">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario-suave text-primario" aria-hidden>
              <Icono size={19} />
            </span>
            <h3 className="mt-3 font-semibold">{titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">{detalle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Precios sin letra menuda: hoy la plataforma es gratis y así se dice. */
export function Precios() {
  return (
    <section id="precios" className="border-y border-borde bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-5 py-14 text-center">
        <span className="inline-block rounded-full bg-primario-suave px-3 py-1 text-xs font-semibold text-primario">Precios</span>
        <div>
          <p className="text-4xl font-bold">
            $0 <span className="text-base font-semibold text-texto-suave">durante la beta</span>
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-texto-suave">
            Todas las funcionalidades incluidas: declaraciones ilimitadas, IA, borrador oficial 210 y guía
            de presentación. Si algún día hay planes de pago, te avisaremos con anticipación — nunca habrá
            cobros sorpresa.
          </p>
        </div>
      </div>
    </section>
  );
}
