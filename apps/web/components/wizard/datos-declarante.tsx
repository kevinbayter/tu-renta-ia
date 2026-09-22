'use client';

import { actividadEconomicaSugerida } from '@turenta/motor-fiscal';
import { nombreActividadEconomica } from '@turenta/shared';
import { useEffect, useRef, useState } from 'react';

import { SelectorActividad } from './selector-actividad';
import { SelectorGenero } from '@/components/ui/selector-genero';
import { useDeclaracion } from '@/lib/store';

function TitularDefinido() {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  return (
    <div className="mt-4 rounded-2xl border border-borde bg-primario-suave p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-texto-suave">
            {esPropia ? 'Declaración a tu nombre' : 'Declaración de otra persona'}
          </p>
          <p className="font-semibold">
            {declarante.nombres} {declarante.apellidos}{' '}
            <span className="font-mono text-sm text-texto-suave">· C.C. {declarante.identificacion}</span>
          </p>
        </div>
        <a href="/declaraciones" className="shrink-0 text-xs font-semibold text-primario underline">
          Cambiar
        </a>
      </div>
      <DatosParaLaDian />
    </div>
  );
}

/** Casillas 286 y 24 del 210: quedan resueltas aquí para que presentar no tenga pasos extra. */
function DatosParaLaDian() {
  const declarante = useDeclaracion((s) => s.declarante);
  const resultado = useDeclaracion((s) => s.resultado);
  const actualizar = useDeclaracion((s) => s.actualizarDeclarante);
  const sugerida = resultado ? actividadEconomicaSugerida(resultado.casillas) : '';
  const razonIa = useSugerenciaIa(Boolean(resultado) && sugerida === '' && !declarante.actividadEconomica);
  const etiquetaAutomatica = sugerida
    ? `Automática: ${sugerida} · ${nombreActividadEconomica(sugerida) ?? ''}`
    : 'Automática según tus ingresos (se define al calcular)';
  return (
    <div className="mt-3 grid gap-3 border-t border-borde pt-3 sm:grid-cols-[1fr_2fr]">
      <SelectorGenero valor={declarante.genero ?? ''} alCambiar={(genero) => actualizar({ genero })} />
      <div>
        <span className="text-xs font-medium text-texto-suave">Actividad económica principal (casilla 24)</span>
        <SelectorActividad
          valor={declarante.actividadEconomica ?? ''}
          alCambiar={(actividadEconomica) => actualizar({ actividadEconomica })}
          automatica={etiquetaAutomatica}
        />
        <p className="mt-1 text-[11px] leading-relaxed text-texto-suave">
          {razonIa ? `Sugerida por TuRenta: ${razonIa} ` : 'La sugerimos según tu mayor fuente de ingresos. '}
          Debe ser una de las actividades de tu RUT: si no coincide, cámbiala aquí.
        </p>
      </div>
    </div>
  );
}

const CAMPOS = [
  { campo: 'nombres', etiqueta: 'Nombres', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'apellidos', etiqueta: 'Apellidos', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'identificacion', etiqueta: 'Número de cédula (sin puntos)', placeholder: 'Ej: 1234567890' },
] as const;

export function DatosDeclarante() {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  const actualizarDeclarante = useDeclaracion((s) => s.actualizarDeclarante);
  if (esPropia !== null && declarante.identificacion) {
    return <TitularDefinido />;
  }
  return (
    <div className="mt-4 rounded-2xl border border-borde bg-card p-4">
      <p className="font-semibold">Tus datos como declarante</p>
      <p className="text-xs text-texto-suave">
        Con tu cédula calculamos tu fecha límite de presentación y armamos tu borrador.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {CAMPOS.map(({ campo, etiqueta, placeholder }) => (
          <label key={campo} className="block">
            <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
            <input
              value={declarante[campo]}
              onChange={(e) => actualizarDeclarante({ [campo]: e.target.value })}
              placeholder={placeholder}
              inputMode={campo === 'identificacion' ? 'numeric' : 'text'}
              className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Independientes y otras rentas: los ingresos no dicen el código CIIU. La IA lo
 * propone con lo que la persona contó en la entrevista y queda preseleccionado.
 */
function useSugerenciaIa(necesaria: boolean): string | null {
  const mensajes = useDeclaracion((s) => s.mensajes);
  const actualizar = useDeclaracion((s) => s.actualizarDeclarante);
  const [razon, setRazon] = useState<string | null>(null);
  const pedida = useRef(false);
  useEffect(() => {
    if (!necesaria || pedida.current) {
      return;
    }
    pedida.current = true;
    const contexto = mensajes.filter((m) => m.rol === 'user').map((m) => m.contenido).join('\n');
    void fetch('/api/actividad-economica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contexto }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ codigo: string; razon: string }>) : null))
      .then((sugerencia) => {
        if (sugerencia) {
          actualizar({ actividadEconomica: sugerencia.codigo });
          setRazon(sugerencia.razon);
        }
      })
      .catch(() => null);
  }, [necesaria, mensajes, actualizar]);
  return razon;
}
