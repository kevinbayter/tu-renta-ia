'use client';

import { documentosEsperados } from '@turenta/core';
import { ArrowLeft, ArrowRight, CloudUpload, Download, ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { BloqueDeclaracionAnterior } from './bloque-declaracion-anterior';
import { OpcionConectarDian } from './opcion-conectar-dian';
import { archivoExogenaDe, NOMBRES_TIPO, registrarDocumento, useSubidas } from './pipeline-documentos';
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
    <section aria-label="Información exógena">
      <div className="rounded-3xl border border-borde bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primario text-white" aria-hidden>
            <CloudUpload size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Importa tu información exógena de la DIAN</h2>
            <p className="mt-0.5 text-sm text-texto-suave">
              Con esto identificamos qué documentos necesitas y precargamos tu información.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {/* Con la exógena ya importada no se vuelve a ofrecer cargarla: solo
              se muestra lo que llegó, con la opción de reemplazarla. */}
          {!exogena && (
            <>
              <OpcionConectarDian operacion="exogena" />
              <Separador />
              <ZonaSubida hayExogena={false} />
            </>
          )}
          <p className="flex items-center gap-2 text-xs text-texto-suave">
            <Lock size={13} className="shrink-0 text-primario" aria-hidden />
            Tu información viaja cifrada, se usa solo para tu declaración y puedes eliminarla cuando quieras.
          </p>
          {exogena?.tipo === 'exogena' && (
            <>
              <ul>
                <TarjetaDocumento documento={exogena} />
              </ul>
              <VistaPrevia exogena={exogena.exogena} />
              <div className="flex flex-wrap items-center gap-4">
                <Reemplazar />
                <DescargarExogena documento={exogena} />
              </div>
            </>
          )}
          {!exogena && <GuiaDescarga />}
          <BloqueDeclaracionAnterior />
        </div>
      </div>
      <PieNavegacion habilitado={Boolean(exogena)} alContinuar={() => irAPaso('documentos')} />
    </section>
  );
}

function ZonaSubida({ hayExogena }: { hayExogena: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const procesar = async (archivo: File | undefined) => {
    if (!archivo) {
      return;
    }
    setCargando(true);
    setAviso(await subirExogena(archivo));
    setCargando(false);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          void procesar(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition ${
          arrastrando ? 'border-primario bg-primario-suave' : 'border-borde'
        } ${hayExogena ? 'py-5' : 'py-10'}`}
      >
        <CloudUpload size={hayExogena ? 20 : 30} className="text-texto-suave" aria-hidden />
        <p className="text-sm font-medium">
          {cargando ? 'Leyendo tu exógena…' : 'Arrastra y suelta tu archivo aquí'}
        </p>
        {!cargando && <span className="text-xs text-texto-suave">o</span>}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={cargando}
          className="cursor-pointer rounded-xl border border-borde bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-primario/40 disabled:opacity-50"
        >
          {hayExogena ? 'Reemplazar archivo' : 'Seleccionar archivo'}
        </button>
        <p className="text-xs text-texto-suave">Formatos permitidos: .xlsx, .xls</p>
      </div>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => void procesar(e.target.files?.[0])} />
      {aviso && (
        <p role="alert" className="mt-2 text-sm text-alerta">
          {aviso}
        </p>
      )}
    </div>
  );
}

const PASOS_DESCARGA = [
  'Ingresa al portal de la DIAN con tu usuario.',
  'Ve a: Consultas → Consulta información reportada por terceros.',
  'Selecciona el año gravable 2025.',
  'Descarga el archivo en formato Excel.',
];

function GuiaDescarga() {
  return (
    <div className="grid gap-4 rounded-2xl border border-borde bg-background p-4 sm:grid-cols-[1fr_150px] sm:items-center">
      <div>
        <p className="text-sm font-semibold">¿Dónde descargo mi información exógena?</p>
        <ol className="mt-2 space-y-1.5">
          {PASOS_DESCARGA.map((paso, i) => (
            <li key={paso} className="flex gap-2 text-xs text-texto-suave">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primario-suave text-[10px] font-bold text-primario">
                {i + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>
        <Link href="/ayuda" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-borde bg-card px-3 py-2 text-xs font-semibold transition hover:border-primario/40">
          <ExternalLink size={13} aria-hidden /> Ver guía paso a paso
        </Link>
      </div>
      <IlustracionDian />
    </div>
  );
}

/** Ilustración decorativa del portal DIAN (sin datos reales). */
function IlustracionDian() {
  return (
    <div aria-hidden className="hidden rounded-xl border border-borde bg-card p-3 sm:block">
      <p className="text-sm font-bold tracking-wide text-marino">DIAN</p>
      <div className="mt-2 rounded-lg bg-background p-2">
        <p className="text-[9px] font-semibold">Información Exógena</p>
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-4/5 rounded bg-borde" />
          <div className="h-1.5 w-3/5 rounded bg-borde" />
          <div className="h-1.5 w-2/3 rounded bg-borde" />
        </div>
      </div>
      <span className="mt-2 ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-primario text-white">
        <CloudUpload size={13} className="rotate-180" />
      </span>
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
  const conRespaldo = esperados.filter((e) => e.opcional && e.tipo !== 'otro');
  const sugerencias = esperados.filter((e) => e.tipo === 'otro');
  return (
    <div className="rounded-2xl border border-primario/25 bg-primario-suave/50 p-4">
      <p className="text-sm font-semibold">Según tu exógena, en el siguiente paso te pediremos:</p>
      <ul className="mt-2 space-y-1 text-sm">
        {obligatorios.map((e) => (
          <li key={e.nit}>
            • <strong>{nombreCorto(e.nombre)}</strong> — {NOMBRES_TIPO[e.tipo]}
          </li>
        ))}
      </ul>
      {conRespaldo.length > 0 && (
        <p className="mt-2 text-xs text-texto-suave">
          Opcionales con respaldo automático ({conRespaldo.map((e) => nombreCorto(e.nombre)).join(', ')}): si no
          los subes, tomamos sus valores directo de la exógena.
        </p>
      )}
      {sugerencias.length > 0 && (
        <p className="mt-2 text-xs text-texto-suave">
          Soportes sugeridos por lo que reporta tu exógena: {sugerencias.map((e) => nombreCorto(e.nombre)).join(' · ')}.
        </p>
      )}
    </div>
  );
}

function PieNavegacion({ habilitado, alContinuar }: { habilitado: boolean; alContinuar: () => void }) {
  const subiendo = useSubidas((s) => s.enCurso > 0);
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Link
        href="/declaraciones"
        className="flex items-center gap-2 rounded-2xl border border-borde bg-card px-5 py-3 font-semibold transition hover:border-primario/40"
      >
        <ArrowLeft size={16} aria-hidden /> Volver
      </Link>
      <button
        type="button"
        disabled={!habilitado || subiendo}
        onClick={alContinuar}
        className="flex items-center gap-2 rounded-2xl bg-primario px-6 py-3 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {subiendo ? 'Leyendo documento…' : 'Continuar'} <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}

function nombreCorto(nombre: string): string {
  return nombre.split(/\s+/).slice(0, 2).join(' ');
}

async function subirExogena(archivo: File): Promise<string | null> {
  const resultado = await registrarDocumento(archivo);
  if ('error' in resultado) {
    return `${archivo.name}: ${resultado.error}`;
  }
  return avisoPorTipo(resultado);
}

/** Descarga el .xlsx original (subido o traído de la DIAN). Solo mientras dure la pestaña: el store no guarda los bytes. */
function DescargarExogena({ documento }: { documento: DocumentoProcesado }) {
  const archivo = archivoExogenaDe(documento.id);
  if (!archivo) {
    return null;
  }
  const descargar = () => {
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.name;
    enlace.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={descargar}
      className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-texto-suave underline hover:text-primario"
    >
      <Download size={13} aria-hidden /> Descargar mi exógena (.xlsx)
    </button>
  );
}

/** Reemplazar existe, pero discreto: lo normal es que ya no haga falta. */
function Reemplazar() {
  const [abierto, setAbierto] = useState(false);
  if (abierto) {
    return <ZonaSubida hayExogena />;
  }
  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="cursor-pointer text-xs font-semibold text-texto-suave underline hover:text-primario"
    >
      ¿Necesitas cambiar el archivo? Reemplázalo aquí
    </button>
  );
}

/** Deja claro que subir el archivo es una alternativa, no el plan B de un fallo. */
function Separador() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-borde" />
      <span className="text-xs font-medium text-texto-suave">o sube el archivo tú mismo</span>
      <span className="h-px flex-1 bg-borde" />
    </div>
  );
}

function avisoPorTipo(doc: DocumentoProcesado): string | null {
  if (doc.tipo === 'exogena') {
    return null;
  }
  return `Esto parece un "${NOMBRES_TIPO[doc.tipo]}" — lo guardamos en el paso de documentos, pero aquí necesitamos tu exógena (.xlsx de la DIAN).`;
}
