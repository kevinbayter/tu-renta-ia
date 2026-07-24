'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FilaDeclaracion } from '@/components/declaraciones/fila-declaracion';
import { NuevaDeTercero } from '@/components/declaraciones/nueva-de-tercero';
import { idDeclaracionPropia, iniciarDeclaracionPropia } from '@/lib/declaraciones-acciones';

import type { DeclaracionResumen, PerfilUsuario } from '@turenta/core';

const ANIO = 2025;

export default function PaginaDeclaraciones() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [lista, setLista] = useState<DeclaracionResumen[] | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [mostrarTercero, setMostrarTercero] = useState(false);

  useEffect(() => {
    void cargar(setPerfil, setLista, setSinSesion);
  }, []);

  if (sinSesion) {
    return <AvisoSinSesion />;
  }

  const nuevaPropia = () => {
    if (!perfil) {
      return;
    }
    iniciarDeclaracionPropia(perfil, idDeclaracionPropia(lista ?? [], ANIO));
    router.push('/declaracion');
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis declaraciones</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Gestiona tus declaraciones de renta y elabora la de otras personas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarTercero(true)}
          className="h-12 shrink-0 rounded-2xl bg-primario px-5 font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Elaborar declaración de otra persona
        </button>
      </div>
      {mostrarTercero && <NuevaDeTercero alCerrar={() => setMostrarTercero(false)} />}
      <TarjetaTitular perfil={perfil} lista={lista} alNuevaPropia={nuevaPropia} />
    </main>
  );
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para ver tu historial</p>
      <p className="mt-2 text-sm text-texto-suave">
        Tus declaraciones se guardan en la nube asociadas a tu cuenta.
      </p>
      <Link
        href="/ingresar"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white"
      >
        Ingresar
      </Link>
    </main>
  );
}

function TarjetaTitular({
  perfil,
  lista,
  alNuevaPropia,
}: {
  perfil: PerfilUsuario | null;
  lista: DeclaracionResumen[] | null;
  alNuevaPropia: () => void;
}) {
  if (!lista) {
    return <p className="mt-8 text-sm text-texto-suave">Cargando…</p>;
  }
  return (
    <section className="mt-8 rounded-3xl border border-borde bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <span aria-hidden>👤</span>
          {perfil ? `${perfil.nombres} ${perfil.apellidos}` : 'Tu cuenta'}
        </p>
        <button type="button" onClick={alNuevaPropia} className="rounded-xl bg-primario-suave px-4 py-2 text-sm font-semibold text-primario">
          + Nueva declaración a mi nombre
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-background p-6 text-center text-sm text-texto-suave">
          Aún no tienes declaraciones. Crea la primera con el botón de arriba.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-primario-suave text-left text-xs text-texto-suave">
                <th className="rounded-l-lg px-3 py-2">Titular</th>
                <th className="px-3 py-2">Año gravable</th>
                <th className="px-3 py-2">Vencimiento</th>
                <th className="px-3 py-2">Estado</th>
                <th className="rounded-r-lg px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((declaracion) => (
                <FilaDeclaracion key={declaracion.id} declaracion={declaracion} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function cargar(
  setPerfil: (p: PerfilUsuario | null) => void,
  setLista: (l: DeclaracionResumen[]) => void,
  setSinSesion: (v: boolean) => void,
): Promise<void> {
  const respuestaPerfil = await fetch('/api/perfil').catch(() => null);
  if (!respuestaPerfil?.ok) {
    setSinSesion(true);
    return;
  }
  const { perfil } = (await respuestaPerfil.json()) as { perfil: PerfilUsuario | null };
  setPerfil(perfil);
  const respuestaLista = await fetch('/api/declaraciones').catch(() => null);
  const cuerpo = respuestaLista?.ok
    ? ((await respuestaLista.json()) as { declaraciones: DeclaracionResumen[] })
    : { declaraciones: [] };
  setLista(cuerpo.declaraciones);
}
