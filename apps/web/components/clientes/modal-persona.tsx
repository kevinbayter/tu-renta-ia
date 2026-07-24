'use client';

import { useState } from 'react';

import type { PersonaAdministrada } from '@turenta/core';

type DatosPersona = Omit<PersonaAdministrada, 'id'>;

const VACIA: DatosPersona = { nombres: '', apellidos: '', identificacion: '', email: '', telefono: '' };

const CAMPOS = [
  { campo: 'nombres', etiqueta: 'Nombre(s)', requerido: true },
  { campo: 'apellidos', etiqueta: 'Apellidos', requerido: true },
  { campo: 'identificacion', etiqueta: 'Cédula (sin puntos)', requerido: true },
  { campo: 'email', etiqueta: 'Correo (opcional)', requerido: false },
  { campo: 'telefono', etiqueta: 'Teléfono (opcional)', requerido: false },
] as const;

/** Alta/edición de una persona administrada. Guarda vía POST /api/personas (upsert por cédula). */
export function ModalPersona({
  inicial,
  alCerrar,
  alGuardar,
}: {
  inicial?: PersonaAdministrada;
  alCerrar: () => void;
  alGuardar: () => void;
}) {
  const [datos, setDatos] = useState<DatosPersona>(inicial ?? VACIA);
  const [error, setError] = useState<string | null>(null);
  const listo = datos.nombres.trim() && datos.apellidos.trim() && datos.identificacion.replace(/\D/g, '').length >= 5;

  const guardar = async () => {
    const respuesta = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    }).catch(() => null);
    if (!respuesta?.ok) {
      const cuerpo = respuesta ? ((await respuesta.json()) as { error?: string }) : null;
      setError(cuerpo?.error ?? 'No se pudo guardar');
      return;
    }
    alGuardar();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-card p-6">
        <h2 className="text-xl font-bold">{inicial ? 'Editar persona' : 'Agregar persona'}</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Recuerda que necesitas su autorización para tratar sus datos.
        </p>
        <div className="mt-4 space-y-3">
          {CAMPOS.map(({ campo, etiqueta }) => (
            <label key={campo} className="block">
              <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
              <input
                value={datos[campo]}
                onChange={(e) => setDatos({ ...datos, [campo]: valorCampo(campo, e.target.value) })}
                inputMode={campo === 'identificacion' || campo === 'telefono' ? 'numeric' : 'text'}
                className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
              />
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={alCerrar} className="h-11 flex-1 rounded-2xl border border-borde font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!listo}
            className="h-11 flex-1 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function valorCampo(campo: (typeof CAMPOS)[number]['campo'], valor: string): string {
  return campo === 'identificacion' ? valor.replace(/\D/g, '') : valor;
}
