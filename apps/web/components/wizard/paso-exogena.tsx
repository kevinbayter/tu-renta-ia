'use client';

import { documentosEsperados } from '@turenta/core';
import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

import { aplicarPrecarga, NOMBRES_TIPO, subirArchivo } from './pipeline-documentos';
import { TarjetaDocumento } from './tarjeta-documento';
import { useDeclaracion } from '@/lib/store';

import type { ExogenaParseada } from '@turenta/core';
import type { DocumentoProcesado } from '@/lib/tipos';

/** Paso 1: solo la exógena. De ella sale qué documentos pedir en el paso 2. */
export function PasoExogena() {
  const documentos = useDeclaracion((s) => s.documentos);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  return (
    <section aria-label="Exógena DIAN">
      <h2 className="text-2xl font-bold">Empecemos con tu exógena</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Es el Excel &quot;información reportada por terceros&quot; que descargas del portal de la DIAN. Con
        ella sabremos exactamente qué documentos pedirte en el siguiente paso.
      </p>
      <div className="mt-5 space-y-4">
        <ZonaSubida hayExogena={Boolean(exogena)} />
        {exogena?.tipo === 'exogena' && (
          <>
            <ul>
              <TarjetaDocumento documento={exogena} />
            </ul>
            <VistaPrevia exogena={exogena.exogena} />
          </>
        )}
      </div>
      <button
        type="button"
        disabled={!exogena}
        onClick={() => irAPaso('documentos')}
        className="mt-6 h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        Continuar a documentos
      </button>
    </section>
  );
}

function ZonaSubida({ hayExogena }: { hayExogena: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const procesar = async (archivos: FileList | null) => {
    const archivo = archivos?.[0];
    if (!archivo) {
      return;
    }
    setCargando(true);
    setAviso(await subirExogena(archivo));
    setCargando(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={cargando}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center transition hover:border-primario ${
          hayExogena ? 'border-borde py-5' : 'border-primario/40 bg-primario-suave/40 py-10'
        }`}
      >
        <FileUp size={hayExogena ? 20 : 28} className="text-primario" aria-hidden />
        <span className="font-semibold">
          {cargando ? 'Leyendo tu exógena…' : hayExogena ? 'Reemplazar exógena' : 'Subir mi exógena (.xlsx)'}
        </span>
        {!hayExogena && (
          <span className="text-xs text-texto-suave">
            En dian.gov.co: &quot;Consulta información reportada por terceros&quot; → descarga el Excel del año.
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => void procesar(e.target.files)} />
      {aviso && (
        <p role="alert" className="mt-2 text-sm text-alerta">
          {aviso}
        </p>
      )}
    </div>
  );
}

/** Adelanto honesto del paso 2: qué pedirá la plataforma según lo reportado. */
function VistaPrevia({ exogena }: { exogena: ExogenaParseada }) {
  const esperados = documentosEsperados(exogena);
  if (esperados.length === 0) {
    return null;
  }
  const obligatorios = esperados.filter((e) => !e.opcional);
  const opcionales = esperados.filter((e) => e.opcional);
  return (
    <div className="rounded-2xl border border-borde bg-card p-4">
      <p className="text-sm font-semibold">Según tu exógena, en el siguiente paso te pediremos:</p>
      <ul className="mt-2 space-y-1 text-sm">
        {obligatorios.map((e) => (
          <li key={e.nit}>
            • <strong>{nombreCorto(e.nombre)}</strong> — {NOMBRES_TIPO[e.tipo]}
          </li>
        ))}
      </ul>
      {opcionales.length > 0 && (
        <p className="mt-2 text-xs text-texto-suave">
          Y {opcionales.length} certificado(s) opcionales ({opcionales.map((e) => nombreCorto(e.nombre)).join(', ')}):
          si no los subes, tomamos sus valores directo de la exógena.
        </p>
      )}
    </div>
  );
}

function nombreCorto(nombre: string): string {
  return nombre.split(/\s+/).slice(0, 2).join(' ');
}

async function subirExogena(archivo: File): Promise<string | null> {
  const resultado = await subirArchivo(archivo);
  if ('error' in resultado) {
    return `${archivo.name}: ${resultado.error}`;
  }
  useDeclaracion.getState().agregarDocumento(resultado);
  aplicarPrecarga(resultado);
  return avisoPorTipo(resultado);
}

function avisoPorTipo(doc: DocumentoProcesado): string | null {
  if (doc.tipo === 'exogena') {
    return null;
  }
  return `Esto parece un "${NOMBRES_TIPO[doc.tipo]}" — lo guardamos en el paso de documentos, pero aquí necesitamos tu exógena (.xlsx de la DIAN).`;
}
