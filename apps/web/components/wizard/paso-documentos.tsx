'use client';

import { precargarDesdeExogena } from '@turenta/core';
import { useRef, useState } from 'react';

import { TarjetaDocumento } from './tarjeta-documento';
import { useDeclaracion } from '@/lib/store';

import type { DocumentoProcesado } from '@/lib/tipos';

export function PasoDocumentos() {
  const documentos = useDeclaracion((s) => s.documentos);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const tieneExogena = documentos.some((d) => d.tipo === 'exogena');
  return (
    <section aria-label="Carga de documentos">
      <h2 className="text-2xl font-bold">Sube tus documentos</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Empieza con tu <strong>exógena</strong> (el Excel de la DIAN) y agrega tus certificados: 220 de cada
        empleador, bancarios y de medicina prepagada. La IA los lee y tú confirmas.
      </p>
      <ZonaDeCarga />
      <ul className="mt-4 space-y-3">
        {documentos.map((doc) => (
          <TarjetaDocumento key={doc.id} documento={doc} />
        ))}
      </ul>
      <button
        type="button"
        disabled={documentos.length === 0}
        onClick={() => irAPaso('entrevista')}
        className="mt-6 h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {tieneExogena ? 'Continuar a la entrevista' : 'Continuar sin exógena'}
      </button>
    </section>
  );
}

function ZonaDeCarga() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agregarDocumento = useDeclaracion((s) => s.agregarDocumento);

  const procesarUno = async (archivo: File) => {
    setCargando(archivo.name);
    const resultado = await subirArchivo(archivo);
    if ('error' in resultado) {
      setError(`${archivo.name}: ${resultado.error}`);
      return;
    }
    agregarDocumento(resultado);
    aplicarPrecarga(resultado);
  };

  const procesar = async (archivos: FileList | null) => {
    if (!archivos) {
      return;
    }
    setError(null);
    for (const archivo of Array.from(archivos)) {
      await procesarUno(archivo);
    }
    setCargando(null);
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={cargando !== null}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-borde bg-card px-4 py-8 text-center transition hover:border-primario"
      >
        <span className="text-3xl" aria-hidden>
          📄
        </span>
        {cargando ? (
          <span className="text-sm font-medium text-primario">
            Leyendo {cargando} con IA… esto toma ~1 minuto
          </span>
        ) : (
          <span className="text-sm font-medium">
            Toca para elegir archivos <span className="text-texto-suave">(PDF o Excel)</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls"
        multiple
        hidden
        onChange={(e) => void procesar(e.target.files)}
      />
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-alerta-suave px-3 py-2 text-sm text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

/** Lo reportado en la exógena no se pregunta: se precarga y la entrevista solo lo confirma. */
function aplicarPrecarga(doc: DocumentoProcesado): void {
  if (doc.tipo !== 'exogena') {
    return;
  }
  const precarga = precargarDesdeExogena(doc.exogena);
  useDeclaracion.getState().actualizarRespuestas(precarga.respuestas);
}

async function subirArchivo(archivo: File): Promise<DocumentoProcesado | { error: string }> {
  try {
    return await enviarArchivo(archivo);
  } catch {
    return { error: 'Error de conexión. Intenta de nuevo.' };
  }
}

async function enviarArchivo(archivo: File): Promise<DocumentoProcesado | { error: string }> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await fetch('/api/documentos', { method: 'POST', body: formData });
  const cuerpo = (await respuesta.json()) as Record<string, unknown>;
  if (!respuesta.ok) {
    return { error: String(cuerpo.error ?? 'No se pudo procesar') };
  }
  return { id: crypto.randomUUID(), nombreArchivo: archivo.name, ...cuerpo } as DocumentoProcesado;
}
