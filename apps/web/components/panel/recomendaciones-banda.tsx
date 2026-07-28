'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { DeclaracionResumen, EvaluacionDeclaracion, Recomendacion } from '@turenta/core';

/** Banda "Recomendaciones de tu IA Fiscal": reglas deterministas + confiabilidad explicable. */
export function RecomendacionesBanda({ declaracion }: { declaracion: DeclaracionResumen }) {
  const [evaluacion, setEvaluacion] = useState<EvaluacionDeclaracion | null>(null);
  const [expandida, setExpandida] = useState(false);

  useEffect(() => {
    void cargarEvaluacion(declaracion.id).then(setEvaluacion);
  }, [declaracion.id]);

  if (!evaluacion) {
    return null;
  }
  const visibles = expandida ? evaluacion.recomendaciones : evaluacion.recomendaciones.slice(0, 3);
  return (
    <section className="rounded-3xl border border-primario/25 bg-primario-suave/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          <Image src="/mascota.png" alt="" width={400} height={600} className="inline-block h-8 w-auto" /> Recomendaciones
          de tu IA Fiscal
        </h2>
        <span className="rounded-lg bg-card px-2.5 py-1 text-xs font-semibold">
          Confiabilidad: <strong className="text-primario">{evaluacion.confiabilidad}%</strong>
        </span>
      </div>
      <p className="mt-1 text-xs text-texto-suave">
        Sobre tu declaración de {declaracion.titular.nombres} {declaracion.titular.apellidos} — cada punto es
        verificable, nada es decorativo.
      </p>
      <ul className="mt-3 space-y-2">
        {visibles.map((r) => (
          <FilaRecomendacion key={r.texto} recomendacion={r} />
        ))}
        {evaluacion.recomendaciones.length === 0 && (
          <li className="flex items-start gap-2 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-exito" aria-hidden />
            Todo en orden: documentos completos, entrevista terminada y sin inconsistencias detectadas.
          </li>
        )}
      </ul>
      {evaluacion.recomendaciones.length > 3 && (
        <button
          type="button"
          onClick={() => setExpandida(!expandida)}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-primario"
        >
          {expandida ? 'Ver menos' : `Ver las ${String(evaluacion.recomendaciones.length)} recomendaciones`}
          <ChevronDown size={15} className={expandida ? 'rotate-180' : ''} aria-hidden />
        </button>
      )}
    </section>
  );
}

const ICONO_NIVEL = {
  critica: { Icono: AlertTriangle, clase: 'text-error' },
  mejora: { Icono: AlertTriangle, clase: 'text-alerta' },
  sugerencia: { Icono: Lightbulb, clase: 'text-primario' },
} as const;

function FilaRecomendacion({ recomendacion }: { recomendacion: Recomendacion }) {
  const { Icono, clase } = ICONO_NIVEL[recomendacion.nivel];
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icono size={16} className={`mt-0.5 shrink-0 ${clase}`} aria-hidden />
      {recomendacion.texto}
    </li>
  );
}

async function cargarEvaluacion(declaracionId: string): Promise<EvaluacionDeclaracion | null> {
  const respuesta = await fetch(`/api/recomendaciones?declaracionId=${declaracionId}`).catch(() => null);
  if (!respuesta?.ok) {
    return null;
  }
  const cuerpo = (await respuesta.json()) as { evaluacion: EvaluacionDeclaracion };
  return cuerpo.evaluacion;
}
