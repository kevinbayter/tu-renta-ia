import { IconoCheck, IconoCircular, TituloSeccion } from './iconos';

const PASOS = [
  {
    icono: 'documento',
    titulo: 'Sube tus documentos',
    detalle:
      'Tu exógena de la DIAN y tus certificados (220, bancarios, medicina prepagada). La IA los lee y te muestra cada valor extraído para que lo confirmes.',
  },
  {
    icono: 'diana',
    titulo: 'Confirma y completa',
    detalle:
      'Lo que ya está en tus documentos no se vuelve a preguntar: solo confirmas. Una conversación corta completa lo que solo tú sabes, como tus dependientes.',
  },
  {
    icono: 'documento',
    titulo: 'Recibe tu borrador del 210',
    detalle:
      'Resultado explicado paso a paso, PDF del borrador, y guía personalizada con tu fecha límite para presentarlo en la DIAN.',
  },
] as const;

export function ComoFunciona() {
  return (
    <section id="como" className="mx-auto w-full max-w-6xl px-5 py-16">
      <TituloSeccion>Así de simple</TituloSeccion>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {PASOS.map((paso, i) => (
          <div key={paso.titulo} className="relative text-center">
            <div className="flex justify-center">
              <span className="relative">
                <IconoCircular tipo={paso.icono} />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primario text-xs font-bold text-white">
                  {i + 1}
                </span>
              </span>
            </div>
            <h3 className="mt-4 font-semibold">{paso.titulo}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-texto-suave">{paso.detalle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const DIFERENCIALES = [
  {
    icono: 'diana',
    titulo: 'Exactitud verificable',
    detalle:
      'Nuestro motor reproduce declaraciones reales peso a peso, casilla por casilla, y cada regla cita la norma que la respalda (Estatuto Tributario, UVT vigente).',
  },
  {
    icono: 'cerebro',
    titulo: 'La IA lee, tú decides',
    detalle:
      'La inteligencia artificial extrae los datos de tus PDF con doble verificación y te los muestra. El impuesto lo calcula código auditado — nunca un modelo de IA.',
  },
  {
    icono: 'candado',
    titulo: 'Tus datos son tuyos',
    detalle:
      'Cumplimos la Ley 1581 de habeas data: autorización clara, procesamiento sin retención por el proveedor de IA, y botón real de eliminar tu cuenta y todo lo tuyo.',
  },
  {
    icono: 'documento',
    titulo: 'Sin sorpresas',
    detalle:
      'Ves tu resultado con el desglose completo de cómo se llegó a cada cifra. Deducciones aplicadas, retenciones, saldo a favor: todo explicado en español simple.',
  },
] as const;

export function PorQueConfiar() {
  return (
    <section id="confianza" className="border-y border-borde bg-card">
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <TituloSeccion>Hecho para que confíes</TituloSeccion>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {DIFERENCIALES.map((item) => (
            <div key={item.titulo}>
              <IconoCircular tipo={item.icono} />
              <h3 className="mt-4 font-semibold">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-texto-suave">{item.detalle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const RECIBES = [
  'Borrador del formulario 210 en PDF, listo para transcribir',
  'Tu fecha límite exacta según los dígitos de tu cédula',
  'Guía paso a paso para presentar en el portal de la DIAN',
  'Desglose completo: qué deducciones se aplicaron y por qué',
];

const GUIA_DIAN = [
  'Inicia sesión en el portal de la DIAN con tu usuario.',
  'Ve a: Presentación de Información → Declaración de Renta.',
  'Selecciona el formulario 210.',
  'Transcribe los valores de tu borrador.',
  'Revisa y envía tu declaración.',
];

export function LoQueRecibes() {
  return (
    <section id="recibes" className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <TituloSeccionIzquierda />
          <ul className="mt-8 space-y-3">
            {RECIBES.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <IconoCheck />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <GuiaPresentacion />
      </div>
    </section>
  );
}

function TituloSeccionIzquierda() {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Lo que recibes</h2>
      <span className="mt-3 block h-1 w-12 rounded-full bg-primario" />
    </div>
  );
}

function GuiaPresentacion() {
  return (
    <div className="rounded-2xl border border-borde bg-card p-6">
      <p className="font-semibold">Guía para presentar en la DIAN</p>
      <ol className="mt-4 space-y-2.5">
        {GUIA_DIAN.map((paso, i) => (
          <li key={paso} className="flex gap-3 text-sm text-texto-suave">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primario-suave text-xs font-bold text-primario">
              {i + 1}
            </span>
            {paso}
          </li>
        ))}
      </ol>
      <p className="mt-5 flex items-center gap-2 rounded-xl bg-primario-suave px-4 py-3 text-sm">
        <span className="text-primario">📅</span>
        <span>
          Tu fecha límite se calcula automáticamente <strong className="text-primario">según los dígitos de tu cédula</strong>
        </span>
      </p>
    </div>
  );
}
