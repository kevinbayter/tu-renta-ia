'use client';

import { useDeclaracion } from '@/lib/store';

import type { PasoWizard } from '@/lib/store';

const PASOS: { clave: PasoWizard; etiqueta: string }[] = [
  { clave: 'documentos', etiqueta: 'Documentos' },
  { clave: 'entrevista', etiqueta: 'Entrevista' },
  { clave: 'revision', etiqueta: 'Revisión' },
  { clave: 'resultado', etiqueta: 'Resultado' },
];

export function Stepper() {
  const pasoActual = useDeclaracion((s) => s.paso);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const indiceActual = PASOS.findIndex((p) => p.clave === pasoActual);
  return (
    <nav aria-label="Progreso de la declaración" className="flex items-center gap-1 sm:gap-2">
      {PASOS.map((paso, indice) => (
        <button
          key={paso.clave}
          type="button"
          disabled={indice > indiceActual}
          onClick={() => irAPaso(paso.clave)}
          aria-current={indice === indiceActual ? 'step' : undefined}
          className={`flex-1 rounded-xl px-1 py-2 text-center text-xs font-semibold transition sm:text-sm ${claseDePaso(
            indice,
            indiceActual,
          )}`}
        >
          <span className="hidden sm:inline">{indice + 1}. </span>
          {paso.etiqueta}
        </button>
      ))}
    </nav>
  );
}

function claseDePaso(indice: number, indiceActual: number): string {
  if (indice === indiceActual) {
    return 'bg-primario text-white';
  }
  if (indice < indiceActual) {
    return 'bg-primario-suave text-primario';
  }
  return 'bg-card text-texto-suave border border-borde';
}
