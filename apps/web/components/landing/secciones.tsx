import { CloudUpload, FileCheck2, FolderOpen, MessagesSquare } from 'lucide-react';

import { IconoCircular, TituloSeccion } from './iconos';

const PASOS = [
  {
    Icono: CloudUpload,
    titulo: 'Sube tu exógena',
    detalle: 'Con el Excel de la DIAN te decimos exactamente qué documentos necesitas y precargamos tus datos.',
  },
  {
    Icono: FolderOpen,
    titulo: 'Sube tus certificados',
    detalle: 'La IA lee cada uno dos veces y tú confirmas los valores extraídos.',
  },
  {
    Icono: MessagesSquare,
    titulo: 'Confirma en la entrevista',
    detalle: 'Solo lo que falta: dependientes, deducciones y tu patrimonio, en lenguaje normal.',
  },
  {
    Icono: FileCheck2,
    titulo: 'Descarga tu borrador 210',
    detalle: 'En el formato oficial de la DIAN, con guía paso a paso para presentarlo tú mismo en el portal.',
  },
];

export function ComoFunciona() {
  return (
    <section id="como" className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="text-center">
        <span className="inline-block rounded-full bg-primario-suave px-3 py-1 text-xs font-semibold text-primario">
          Cómo funciona
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">
          Declarar nunca fue tan <span className="text-primario">fácil</span>
        </h2>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map((paso, i) => (
          <PasoLandingItem key={paso.titulo} paso={paso} numero={i + 1} />
        ))}
      </div>
    </section>
  );
}

function PasoLandingItem({ paso, numero }: { paso: (typeof PASOS)[number]; numero: number }) {
  return (
    <div className="relative text-center">
      <div className="flex justify-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primario-suave text-primario">
          <paso.Icono size={26} aria-hidden />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primario text-xs font-bold text-white">
            {numero}
          </span>
        </span>
      </div>
      <h3 className="mt-4 font-semibold">{paso.titulo}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-texto-suave">{paso.detalle}</p>
    </div>
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

/** En el lugar donde otros ponen reseñas inventadas, nosotros ponemos hechos. */
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
