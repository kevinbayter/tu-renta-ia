'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ChatAsistente } from '@/components/ia-fiscal/chat-asistente';
import { Simulador } from '@/components/ia-fiscal/simulador';
import { useSesionCliente } from '@/lib/sesion-cliente';

export default function PaginaIaFiscal() {
  return (
    <Suspense>
      <ContenidoIaFiscal />
    </Suspense>
  );
}

function ContenidoIaFiscal() {
  const sesion = useSesionCliente();
  const pregunta = useSearchParams().get('q') ?? undefined;
  if (sesion.fase === 'anonimo') {
    return <AvisoSinSesion />;
  }
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">IA Fiscal</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Resuelve dudas con tu contexto real y estima tu declaración en segundos.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <ChatAsistente preguntaInicial={pregunta} />
        <Simulador />
      </div>
    </main>
  );
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para usar la IA Fiscal</p>
      <p className="mt-2 text-sm text-texto-suave">El asistente responde con el contexto de TUS declaraciones.</p>
      <Link href="/ingresar" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white">
        Ingresar
      </Link>
    </main>
  );
}
