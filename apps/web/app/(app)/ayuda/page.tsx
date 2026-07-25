import { Mail } from 'lucide-react';

import { PREGUNTAS } from '@/components/landing/cierre';

const OPERATIVAS = [
  {
    pregunta: '¿Dónde descargo mi exógena de la DIAN?',
    respuesta:
      'Ingresa a dian.gov.co con tu usuario, ve a "Consulta información reportada por terceros" y descarga el Excel del año gravable. Ese archivo es el que subes en el paso de documentos.',
  },
  {
    pregunta: '¿Por qué me piden confirmar valores que la IA ya leyó?',
    respuesta:
      'Cada documento se lee dos veces de forma independiente y tú eres la verificación final. Así garantizamos que ninguna cifra de tu declaración dependa solo de una lectura automática.',
  },
  {
    pregunta: '¿Puedo borrar mis datos?',
    respuesta:
      'Sí, en Configuración está el botón para eliminar tu cuenta con todas tus declaraciones y datos (Ley 1581 de 2012). Es inmediato e irreversible.',
  },
];

export default function PaginaAyuda() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Centro de ayuda</h1>
      <p className="mt-1 text-sm text-texto-suave">Respuestas rápidas y contacto directo.</p>
      <section className="mt-6 space-y-3">
        {[...OPERATIVAS, ...PREGUNTAS].map((item) => (
          <details key={item.pregunta} className="group rounded-2xl border border-borde bg-card p-4">
            <summary className="flex cursor-pointer items-center justify-between font-medium">
              {item.pregunta}
              <span className="text-xl text-primario transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">{item.respuesta}</p>
          </details>
        ))}
      </section>
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-borde bg-card p-5">
        <div>
          <h2 className="font-semibold">¿No encontraste tu respuesta?</h2>
          <p className="mt-0.5 text-sm text-texto-suave">Escríbenos y te ayudamos con tu caso.</p>
        </div>
        <a
          href="mailto:soporte@turenta.tax?subject=Ayuda%20TuRenta%20AI"
          className="flex items-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
        >
          <Mail size={16} aria-hidden /> Escribir al soporte
        </a>
      </section>
    </main>
  );
}
