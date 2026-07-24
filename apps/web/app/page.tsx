import Link from 'next/link';

export default function PaginaInicio() {
  return (
    <div className="flex flex-1 flex-col">
      <BarraNavegacion />
      <main className="flex-1">
        <Hero />
        <ComoFunciona />
        <PorQueConfiar />
        <LoQueRecibes />
        <PreguntasFrecuentes />
        <CierreCta />
      </main>
      <PiePagina />
    </div>
  );
}

function BarraNavegacion() {
  return (
    <header className="sticky top-0 z-10 border-b border-borde bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <LogoMarca />
          TuRenta <span className="text-primario">AI</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/ingresar" className="text-sm font-medium text-texto-suave hover:text-foreground">
            Ingresar
          </Link>
          <Link
            href="/declaracion"
            className="rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
          >
            Empezar
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-14 text-center sm:pt-20">
      <p className="mx-auto inline-block rounded-full border border-borde bg-card px-3 py-1 text-xs font-medium text-texto-suave">
        Año gravable 2025 · Temporada del 12 de agosto al 26 de octubre de 2026
      </p>
      <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
        Tu declaración de renta, <span className="text-primario">clara y sin enredos</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-texto-suave">
        Sube tus documentos y nuestra IA los lee por ti. Un motor de cálculo exacto — validado con
        declaraciones reales — liquida tu formulario 210 y te entrega el borrador con instrucciones
        para presentarlo en la DIAN.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/declaracion"
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primario px-8 text-lg font-semibold text-white shadow-lg shadow-primario/20 transition hover:bg-primario-oscuro sm:w-auto"
        >
          Calcular mi declaración
        </Link>
        <span className="text-sm text-texto-suave">En ~15 minutos · Sin saber de impuestos</span>
      </div>
      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        <InsigniaConfianza texto="Cálculo determinista auditado — la IA nunca inventa cifras" />
        <InsigniaConfianza texto="Tú confirmas cada dato antes de que se use" />
        <InsigniaConfianza texto="Tus datos cifrados y eliminables cuando quieras" />
      </div>
    </section>
  );
}

function InsigniaConfianza({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-borde bg-card p-3 text-left">
      <IconoCheck />
      <p className="text-xs leading-relaxed text-texto-suave">{texto}</p>
    </div>
  );
}

const PASOS = [
  {
    titulo: 'Sube tus documentos',
    detalle:
      'Tu exógena de la DIAN y tus certificados (220, bancarios, medicina prepagada). La IA los lee y te muestra cada valor extraído para que lo confirmes.',
  },
  {
    titulo: 'Confirma y completa',
    detalle:
      'Lo que ya está en tus documentos no se vuelve a preguntar: solo confirmas. Una conversación corta completa lo que solo tú sabes, como tus dependientes.',
  },
  {
    titulo: 'Recibe tu borrador del 210',
    detalle:
      'Resultado explicado paso a paso, PDF del borrador, y guía personalizada con tu fecha límite para presentarlo en la DIAN.',
  },
];

function ComoFunciona() {
  return (
    <section className="border-y border-borde bg-card">
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">Así de simple</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PASOS.map((paso, indice) => (
            <div key={paso.titulo} className="rounded-2xl border border-borde bg-background p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario-suave text-lg font-bold text-primario">
                {indice + 1}
              </span>
              <h3 className="mt-4 font-semibold">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-texto-suave">{paso.detalle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const DIFERENCIALES = [
  {
    titulo: 'Exactitud verificable',
    detalle:
      'Nuestro motor reproduce declaraciones reales peso a peso, casilla por casilla, y cada regla cita la norma que la respalda (Estatuto Tributario, UVT vigente).',
  },
  {
    titulo: 'La IA lee, tú decides',
    detalle:
      'La inteligencia artificial extrae los datos de tus PDF con doble verificación y te los muestra. El impuesto lo calcula código auditado — nunca un modelo de IA.',
  },
  {
    titulo: 'Tus datos son tuyos',
    detalle:
      'Cumplimos la Ley 1581 de habeas data: autorización clara, procesamiento sin retención por el proveedor de IA, y botón real de eliminar tu cuenta y todo lo tuyo.',
  },
  {
    titulo: 'Sin sorpresas',
    detalle:
      'Ves tu resultado con el desglose completo de cómo se llegó a cada cifra. Deducciones aplicadas, retenciones, saldo a favor: todo explicado en español simple.',
  },
];

function PorQueConfiar() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-16">
      <h2 className="text-center text-3xl font-bold">Hecho para que confíes</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {DIFERENCIALES.map((item) => (
          <div key={item.titulo} className="flex gap-4 rounded-2xl border border-borde bg-card p-6">
            <IconoEscudo />
            <div>
              <h3 className="font-semibold">{item.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-texto-suave">{item.detalle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoQueRecibes() {
  return (
    <section className="border-y border-borde bg-primario-suave/60">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-16 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="text-3xl font-bold">Lo que recibes</h2>
          <ul className="mt-6 space-y-3">
            {[
              'Borrador del formulario 210 en PDF, listo para transcribir',
              'Tu fecha límite exacta según los dígitos de tu cédula',
              'Guía paso a paso para presentar en el portal de la DIAN',
              'Desglose completo: qué deducciones se aplicaron y por qué',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <IconoCheck />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-borde bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-texto-suave">Ejemplo real de resultado</p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-exito">$1.401.000</p>
          <p className="mt-1 text-sm text-texto-suave">de saldo a favor detectado</p>
          <p className="mt-4 rounded-xl bg-exito-suave px-3 py-2 text-xs text-exito">
            Más de la mitad de los declarantes en Colombia tiene saldo a favor y no lo sabe.
          </p>
        </div>
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

function PreguntasFrecuentes() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16">
      <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
      <div className="mt-8 space-y-3">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="group rounded-2xl border border-borde bg-card p-4">
            <summary className="cursor-pointer font-semibold marker:text-primario">{item.pregunta}</summary>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{item.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CierreCta() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-20">
      <div className="rounded-3xl bg-primario px-6 py-12 text-center text-white">
        <h2 className="text-3xl font-bold">Empieza hoy, sin compromiso</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">
          Sube tu exógena y mira tu resultado. Tu avance se guarda en la nube si creas tu cuenta con solo tu
          correo.
        </p>
        <Link
          href="/declaracion"
          className="mt-6 inline-flex h-13 items-center justify-center rounded-2xl bg-white px-8 py-3 font-semibold text-primario transition hover:bg-primario-suave"
        >
          Calcular mi declaración
        </Link>
      </div>
    </section>
  );
}

function PiePagina() {
  return (
    <footer className="border-t border-borde bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-5 py-8 text-center text-xs text-texto-suave">
        <p className="font-semibold text-foreground">TuRenta AI</p>
        <p>Herramienta de autopreparación asistida · No sustituye asesoría profesional</p>
        <p>
          <Link href="/terminos" className="underline">
            Términos y Condiciones
          </Link>{' '}
          ·{' '}
          <Link href="/privacidad" className="underline">
            Privacidad
          </Link>{' '}
          ·{' '}
          <Link href="/ingresar" className="underline">
            Ingresar
          </Link>
        </p>
      </div>
    </footer>
  );
}

function LogoMarca() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect width="26" height="26" rx="7" fill="var(--primario)" />
      <path d="M7 13.5l4 4 8-9" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="var(--exito-suave)" />
      <path d="M6 10.5l2.5 2.5L14 7.5" stroke="var(--exito)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoEscudo() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"
        fill="var(--primario-suave)"
        stroke="var(--primario)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 11.5l2 2 4-4.5" stroke="var(--primario)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
