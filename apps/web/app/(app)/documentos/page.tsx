'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { useSesionCliente } from '@/lib/sesion-cliente';

import type { DeclaracionResumen } from '@turenta/core';

interface DocumentoListado {
  clave: string;
  nombreArchivo: string;
  tipo: string;
  verificado: boolean | null;
  titular: string;
  anioGravable: number;
}

const NOMBRES_TIPO: Record<string, string> = {
  exogena: 'Exógena DIAN',
  certificado_220: 'Certificado 220',
  certificado_bancario: 'Certificado bancario',
  medicina_prepagada: 'Medicina prepagada',
  otro: 'Otro documento',
};

export default function PaginaDocumentos() {
  const sesion = useSesionCliente();
  const [documentos, setDocumentos] = useState<DocumentoListado[] | null>(null);
  useEffect(() => {
    void cargarDocumentos().then(setDocumentos);
  }, []);

  if (sesion.fase === 'anonimo') {
    return <AvisoSinSesion />;
  }
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Documentos</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Los documentos procesados en tus declaraciones guardadas. Por privacidad no almacenamos los archivos
        originales: aquí ves qué se leyó y su estado de verificación.
      </p>
      <Contenido documentos={documentos} />
    </main>
  );
}

function Contenido({ documentos }: { documentos: DocumentoListado[] | null }) {
  if (documentos === null) {
    return <p className="mt-8 text-sm text-texto-suave">Cargando…</p>;
  }
  if (documentos.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-borde bg-card p-8 text-center text-sm text-texto-suave">
        Aún no hay documentos procesados en tus declaraciones guardadas.
      </p>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      {documentos.map((doc) => (
        <FilaDocumento key={doc.clave} doc={doc} />
      ))}
    </div>
  );
}

function FilaDocumento({ doc }: { doc: DocumentoListado }) {
  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-borde bg-card p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario-suave text-primario" aria-hidden>
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{NOMBRES_TIPO[doc.tipo] ?? doc.tipo}</p>
        <p className="break-all text-xs text-texto-suave">{doc.nombreArchivo}</p>
      </div>
      <EstadoVerificacion verificado={doc.verificado} />
      <div className="flex items-center gap-2">
        <Avatar nombre={doc.titular} tamano="sm" />
        <div className="text-xs">
          <p className="font-medium">{doc.titular}</p>
          <p className="text-texto-suave">Declaración {doc.anioGravable}</p>
        </div>
      </div>
    </article>
  );
}

function EstadoVerificacion({ verificado }: { verificado: boolean | null }) {
  if (verificado === null) {
    return null;
  }
  if (verificado) {
    return <span className="rounded-lg bg-exito-suave px-2 py-0.5 text-xs text-exito">✓ Doble lectura</span>;
  }
  return <span className="rounded-lg bg-alerta-suave px-2 py-0.5 text-xs text-alerta">⚠ Revisar valores</span>;
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para ver tus documentos</p>
      <Link href="/ingresar" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white">
        Ingresar
      </Link>
    </main>
  );
}

async function cargarDocumentos(): Promise<DocumentoListado[]> {
  const respuesta = await fetch('/api/declaraciones').catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const { declaraciones } = (await respuesta.json()) as { declaraciones: DeclaracionResumen[] };
  const porDeclaracion = await Promise.all(declaraciones.map((d) => documentosDe(d)));
  return porDeclaracion.flat();
}

async function documentosDe(declaracion: DeclaracionResumen): Promise<DocumentoListado[]> {
  const respuesta = await fetch(`/api/declaraciones/${declaracion.id}`).catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const { estado } = (await respuesta.json()) as {
    estado: { documentos?: { id?: string; nombreArchivo?: string; tipo?: string; pasadasCoinciden?: boolean }[] };
  };
  return (estado.documentos ?? []).map((doc, i) => ({
    clave: `${declaracion.id}-${doc.id ?? String(i)}`,
    nombreArchivo: doc.nombreArchivo ?? 'documento',
    tipo: doc.tipo ?? 'otro',
    verificado: typeof doc.pasadasCoinciden === 'boolean' ? doc.pasadasCoinciden : null,
    titular: `${declaracion.titular.nombres} ${declaracion.titular.apellidos}`.trim(),
    anioGravable: declaracion.anioGravable,
  }));
}
