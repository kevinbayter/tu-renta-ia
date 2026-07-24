'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { FichaPersona } from '@/components/clientes/ficha-persona';
import { ModalPersona } from '@/components/clientes/modal-persona';
import { useSesionCliente } from '@/lib/sesion-cliente';

import type { DeclaracionResumen, PersonaAdministrada } from '@turenta/core';

export default function PaginaClientes() {
  const sesion = useSesionCliente();
  const [personas, setPersonas] = useState<PersonaAdministrada[] | null>(null);
  const [declaraciones, setDeclaraciones] = useState<DeclaracionResumen[]>([]);
  const [editando, setEditando] = useState<PersonaAdministrada | 'nueva' | null>(null);

  const recargar = useCallback(() => {
    void cargarDatos().then(({ personas: p, declaraciones: d }) => {
      setPersonas(p);
      setDeclaraciones(d);
    });
  }, []);
  useEffect(recargar, [recargar]);

  if (sesion.fase === 'anonimo') {
    return <AvisoSinSesion />;
  }
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Las personas cuyas declaraciones elaboras. Se crean solas al declarar por alguien, o agrégalas aquí.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditando('nueva')}
          className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-primario px-5 font-semibold text-white transition hover:bg-primario-oscuro"
        >
          <UserPlus size={17} aria-hidden /> Agregar persona
        </button>
      </div>
      <ListaPersonas personas={personas} declaraciones={declaraciones} alEditar={setEditando} alCambiar={recargar} />
      {editando && (
        <ModalPersona
          inicial={editando === 'nueva' ? undefined : editando}
          alCerrar={() => setEditando(null)}
          alGuardar={() => {
            setEditando(null);
            recargar();
          }}
        />
      )}
    </main>
  );
}

function ListaPersonas({
  personas,
  declaraciones,
  alEditar,
  alCambiar,
}: {
  personas: PersonaAdministrada[] | null;
  declaraciones: DeclaracionResumen[];
  alEditar: (p: PersonaAdministrada) => void;
  alCambiar: () => void;
}) {
  if (personas === null) {
    return <p className="mt-8 text-sm text-texto-suave">Cargando…</p>;
  }
  if (personas.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-borde bg-card p-8 text-center text-sm text-texto-suave">
        Aún no administras a nadie. Agrega una persona o inicia una declaración de un tercero.
      </p>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      {personas.map((p) => (
        <FichaPersona
          key={p.id}
          persona={p}
          declaraciones={declaracionesDe(p, declaraciones)}
          alEditar={() => alEditar(p)}
          alCambiar={alCambiar}
        />
      ))}
    </div>
  );
}

function declaracionesDe(persona: PersonaAdministrada, lista: DeclaracionResumen[]): DeclaracionResumen[] {
  return lista.filter((d) => !d.titular.esPropia && d.titular.identificacion === persona.identificacion);
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para gestionar tus clientes</p>
      <Link href="/ingresar" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white">
        Ingresar
      </Link>
    </main>
  );
}

async function cargarDatos(): Promise<{ personas: PersonaAdministrada[]; declaraciones: DeclaracionResumen[] }> {
  const [rPersonas, rDeclaraciones] = await Promise.all([
    fetch('/api/personas').catch(() => null),
    fetch('/api/declaraciones').catch(() => null),
  ]);
  const personas = rPersonas?.ok ? ((await rPersonas.json()) as { personas: PersonaAdministrada[] }).personas : [];
  const declaraciones = rDeclaraciones?.ok
    ? ((await rDeclaraciones.json()) as { declaraciones: DeclaracionResumen[] }).declaraciones
    : [];
  return { personas, declaraciones };
}
