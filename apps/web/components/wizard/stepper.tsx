'use client';

import { Check } from 'lucide-react';

import { useDeclaracion } from '@/lib/store';

import type { PasoWizard } from '@/lib/store';

const PASOS: { clave: PasoWizard; etiqueta: string; detalle: string }[] = [
  { clave: 'exogena', etiqueta: 'Información exógena', detalle: 'Importa tu información DIAN' },
  { clave: 'documentos', etiqueta: 'Documentos', detalle: 'Sube tus soportes' },
  { clave: 'entrevista', etiqueta: 'Entrevista', detalle: 'Responde algunas preguntas' },
  { clave: 'revision', etiqueta: 'Revisión', detalle: 'Valida tu declaración' },
  { clave: 'resultado', etiqueta: 'Resultado', detalle: 'Obtén tu resultado final' },
];

export function Stepper() {
  const pasoActual = useDeclaracion((s) => s.paso);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const indiceActual = PASOS.findIndex((p) => p.clave === pasoActual);
  return (
    <nav aria-label="Progreso de la declaración" className="flex items-start">
      {PASOS.map((paso, indice) => (
        <PasoStepper
          key={paso.clave}
          paso={paso}
          indice={indice}
          indiceActual={indiceActual}
          alIr={() => irAPaso(paso.clave)}
        />
      ))}
    </nav>
  );
}

function PasoStepper({
  paso,
  indice,
  indiceActual,
  alIr,
}: {
  paso: (typeof PASOS)[number];
  indice: number;
  indiceActual: number;
  alIr: () => void;
}) {
  const estado = indice < indiceActual ? 'hecho' : indice === indiceActual ? 'actual' : 'pendiente';
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex w-full items-center">
        <Conector visible={indice > 0} activo={indice <= indiceActual} />
        <button
          type="button"
          disabled={indice > indiceActual}
          onClick={alIr}
          aria-current={estado === 'actual' ? 'step' : undefined}
          aria-label={`Paso ${String(indice + 1)}: ${paso.etiqueta}`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${claseCirculo(estado)}`}
        >
          {estado === 'hecho' ? <Check size={17} aria-hidden /> : indice + 1}
        </button>
        <Conector visible={indice < PASOS.length - 1} activo={indice < indiceActual} />
      </div>
      <p className={`mt-2 text-center text-xs font-semibold sm:text-sm ${estado === 'pendiente' ? 'text-texto-suave' : 'text-primario'}`}>
        {paso.etiqueta}
      </p>
      <p className="hidden text-center text-xs text-texto-suave md:block">{paso.detalle}</p>
    </div>
  );
}

function Conector({ visible, activo }: { visible: boolean; activo: boolean }) {
  if (!visible) {
    return <span className="flex-1" aria-hidden />;
  }
  return <span aria-hidden className={`h-0.5 flex-1 rounded-full ${activo ? 'bg-primario' : 'bg-borde'}`} />;
}

function claseCirculo(estado: 'hecho' | 'actual' | 'pendiente'): string {
  if (estado === 'hecho') {
    return 'border-primario bg-primario-suave text-primario';
  }
  if (estado === 'actual') {
    return 'border-primario bg-primario text-white';
  }
  return 'border-borde bg-card text-texto-suave';
}
