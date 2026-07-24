'use client';

import { FilePlus2, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { DialogoConfirmar } from '@/components/ui/dialogo-confirmar';
import { InsigniaEstado } from '@/components/ui/insignia-estado';
import { cargarDeclaracionEnStore, iniciarDeclaracionDeTercero } from '@/lib/declaraciones-acciones';

import type { DeclaracionResumen, PersonaAdministrada } from '@turenta/core';

export function FichaPersona({
  persona,
  declaraciones,
  alEditar,
  alCambiar,
}: {
  persona: PersonaAdministrada;
  declaraciones: DeclaracionResumen[];
  alEditar: () => void;
  alCambiar: () => void;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const nombre = `${persona.nombres} ${persona.apellidos}`.trim();

  const nuevaDeclaracion = async () => {
    const existente = declaraciones[0];
    if (!existente) {
      iniciarDeclaracionDeTercero(persona, null);
      router.push('/declaracion');
      return;
    }
    const ok = await cargarDeclaracionEnStore(existente);
    if (ok) {
      router.push('/declaracion');
    }
  };

  const eliminar = async () => {
    await fetch(`/api/personas?id=${persona.id}`, { method: 'DELETE' }).catch(() => null);
    setConfirmando(false);
    alCambiar();
  };

  return (
    <article className="rounded-2xl border border-borde bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar nombre={nombre} tamano="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{nombre}</p>
          <p className="text-xs text-texto-suave">
            C.C. {persona.identificacion}
            {persona.email && ` · ${persona.email}`}
            {persona.telefono && ` · ${persona.telefono}`}
          </p>
        </div>
        <Acciones alNueva={() => void nuevaDeclaracion()} alEditar={alEditar} alEliminar={() => setConfirmando(true)} hayDeclaracion={declaraciones.length > 0} />
      </div>
      {declaraciones.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-borde pt-3">
          {declaraciones.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono font-semibold">{d.anioGravable}</span>
              <InsigniaEstado declaracion={d} />
              <span className="text-xs text-texto-suave">
                {d.progreso.porcentaje}% · Paso {d.progreso.paso} de {d.progreso.totalPasos}
              </span>
            </li>
          ))}
        </ul>
      )}
      {confirmando && (
        <DialogoConfirmar
          titulo="¿Eliminar esta persona?"
          descripcion={`Se elimina la ficha de ${nombre}. Sus declaraciones guardadas NO se borran: siguen en Mis declaraciones.`}
          textoConfirmar="Sí, eliminar"
          alConfirmar={() => void eliminar()}
          alCancelar={() => setConfirmando(false)}
        />
      )}
    </article>
  );
}

function Acciones({
  alNueva,
  alEditar,
  alEliminar,
  hayDeclaracion,
}: {
  alNueva: () => void;
  alEditar: () => void;
  alEliminar: () => void;
  hayDeclaracion: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={alNueva}
        className="flex items-center gap-1.5 rounded-xl bg-primario px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primario-oscuro"
      >
        <FilePlus2 size={14} aria-hidden /> {hayDeclaracion ? 'Continuar declaración' : 'Nueva declaración'}
      </button>
      <button type="button" onClick={alEditar} aria-label="Editar persona" className="rounded-xl p-2 text-texto-suave transition hover:bg-background">
        <Pencil size={15} />
      </button>
      <button type="button" onClick={alEliminar} aria-label="Eliminar persona" className="rounded-xl p-2 text-texto-suave transition hover:text-error">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
