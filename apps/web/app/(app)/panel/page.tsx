'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { PREFERENCIAS_POR_DEFECTO } from '@turenta/core';

import { SelectorNuevaDeclaracion } from '@/components/declaraciones/selector-nueva-declaracion';
import { FilaPanel } from '@/components/panel/fila-panel';
import { PanelDerecho } from '@/components/panel/panel-derecho';
import { PersonalizarVista } from '@/components/panel/personalizar-vista';
import { RecomendacionesBanda } from '@/components/panel/recomendaciones-banda';
import { TarjetasMetricas } from '@/components/panel/tarjetas-metricas';
import { idDeclaracionPropia, iniciarDeclaracionPropia } from '@/lib/declaraciones-acciones';
import { useSesionCliente } from '@/lib/sesion-cliente';

import type { DeclaracionResumen, PreferenciasUsuario } from '@turenta/core';

const ANIO = 2025;

export default function PaginaPanel() {
  const sesion = useSesionCliente();
  const router = useRouter();
  const [lista, setLista] = useState<DeclaracionResumen[] | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario>(PREFERENCIAS_POR_DEFECTO);
  const [eligiendoTitular, setEligiendoTitular] = useState(false);

  const recargar = useCallback(() => {
    void cargarLista().then(setLista);
    void cargarPreferencias().then(setPreferencias);
  }, []);
  useEffect(recargar, [recargar]);

  if (sesion.fase === 'anonimo') {
    return <AvisoSinSesion />;
  }
  if (sesion.fase === 'cargando' || lista === null) {
    return <main className="flex-1 px-6 py-10 text-sm text-texto-suave">Cargando tu panel…</main>;
  }

  const nuevaPropia = () => {
    if (!sesion.perfil) {
      router.push('/configuracion');
      return;
    }
    iniciarDeclaracionPropia(sesion.perfil, idDeclaracionPropia(lista, ANIO));
    router.push('/declaracion');
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Encabezado nombre={sesion.perfil?.nombres ?? ''} />
        <PersonalizarVista preferencias={preferencias} alCambiar={setPreferencias} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <TarjetasMetricas lista={lista} />
          <SeccionDeclaraciones lista={lista} alCambiar={recargar} alNueva={() => setEligiendoTitular(true)} />
          {preferencias.widgets.recomendaciones && lista[0] && <RecomendacionesBanda declaracion={lista[0]} />}
        </div>
        <PanelDerecho lista={lista} widgets={preferencias.widgets} />
      </div>
      <BotonFlotante alNueva={() => setEligiendoTitular(true)} />
      {eligiendoTitular && (
        <SelectorNuevaDeclaracion alCerrar={() => setEligiendoTitular(false)} alPropia={nuevaPropia} />
      )}
    </main>
  );
}

function Encabezado({ nombre }: { nombre: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">Hola{nombre ? `, ${nombre}` : ''} 👋</h1>
      <p className="mt-1 text-sm text-texto-suave">Este es el resumen de tus declaraciones y obligaciones tributarias.</p>
    </div>
  );
}

function SeccionDeclaraciones({
  lista,
  alCambiar,
  alNueva,
}: {
  lista: DeclaracionResumen[];
  alCambiar: () => void;
  alNueva: () => void;
}) {
  return (
    <section className="rounded-3xl border border-borde bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Mis declaraciones</h2>
        <button
          type="button"
          onClick={alNueva}
          className="flex items-center gap-1.5 rounded-xl bg-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
        >
          <Plus size={16} aria-hidden /> Nueva declaración
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-background p-6 text-center text-sm text-texto-suave">
          Aún no tienes declaraciones. Crea la primera con el botón de arriba.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {lista.slice(0, 3).map((d) => (
            <FilaPanel key={d.id} declaracion={d} alCambiar={alCambiar} />
          ))}
        </div>
      )}
      <div className="mt-4 text-center">
        <Link href="/declaraciones" className="text-sm font-semibold text-primario">
          Ver todas mis declaraciones →
        </Link>
      </div>
    </section>
  );
}

function BotonFlotante({ alNueva }: { alNueva: () => void }) {
  return (
    <button
      type="button"
      onClick={alNueva}
      title="Nueva declaración"
      aria-label="Nueva declaración"
      className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primario text-white shadow-xl transition hover:bg-primario-oscuro"
    >
      <Plus size={24} aria-hidden />
    </button>
  );
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para ver tu panel</p>
      <p className="mt-2 text-sm text-texto-suave">Tus declaraciones y vencimientos viven en tu cuenta.</p>
      <Link href="/ingresar" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white">
        Ingresar
      </Link>
    </main>
  );
}

async function cargarLista(): Promise<DeclaracionResumen[]> {
  const respuesta = await fetch('/api/declaraciones').catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const cuerpo = (await respuesta.json()) as { declaraciones: DeclaracionResumen[] };
  return cuerpo.declaraciones;
}

async function cargarPreferencias(): Promise<PreferenciasUsuario> {
  const respuesta = await fetch('/api/preferencias').catch(() => null);
  if (!respuesta?.ok) {
    return PREFERENCIAS_POR_DEFECTO;
  }
  const cuerpo = (await respuesta.json()) as { preferencias: PreferenciasUsuario };
  return cuerpo.preferencias;
}
