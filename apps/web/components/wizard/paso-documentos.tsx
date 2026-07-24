'use client';

import { documentosEsperados } from '@turenta/core';
import { useRef, useState } from 'react';

import { ChecklistEsperados } from './checklist-esperados';
import { aplicarPrecarga, NOMBRES_TIPO, subirArchivo, useSubidas } from './pipeline-documentos';
import { TarjetaDocumento } from './tarjeta-documento';
import { ValoresManuales } from './valores-manuales';
import { useDeclaracion } from '@/lib/store';

import type { CampoManual } from './valores-manuales';
import type { DocumentoEsperado } from '@turenta/core';
import type { DocumentoProcesado } from '@/lib/tipos';

type TipoDocumento = DocumentoProcesado['tipo'];

interface Slot {
  clave: string;
  titulo: string;
  descripcion: string;
  accept: string;
  tipos: TipoDocumento[];
  opcional?: boolean;
  /** Campos de una sola cifra que se pueden digitar si no hay certificado. */
  camposManuales?: CampoManual[];
}

const SLOTS: Slot[] = [
  {
    clave: '220',
    titulo: 'Certificados 220 (ingresos y retenciones)',
    descripcion: 'Uno por cada empleador que tuviste en el año. Te lo entrega la empresa.',
    accept: '.pdf',
    tipos: ['certificado_220'],
  },
  {
    clave: 'bancarios',
    titulo: 'Certificados bancarios',
    descripcion: 'Certificado tributario de cada banco: saldos, rendimientos, GMF y retenciones.',
    accept: '.pdf',
    tipos: ['certificado_bancario'],
  },
  {
    clave: 'prepagada',
    titulo: 'Medicina prepagada (si aplica)',
    descripcion: 'Certificado anual de tu medicina prepagada o seguro de salud, para la deducción.',
    accept: '.pdf',
    tipos: ['medicina_prepagada'],
    opcional: true,
    camposManuales: [{ campo: 'pagosMedicinaPrepagadaConfirmados', etiqueta: 'Total pagado en 2025 ($)' }],
  },
  {
    clave: 'otros',
    titulo: 'Otros deducibles (si aplican)',
    descripcion: 'Intereses de vivienda, ICETEX, pensiones voluntarias… La IA intentará clasificarlos; lo que no reconozca lo capturas en la entrevista.',
    accept: '.pdf,.xlsx,.xls',
    tipos: ['otro'],
    opcional: true,
    camposManuales: [
      { campo: 'interesesVivienda', etiqueta: 'Intereses de crédito de vivienda 2025 ($)' },
      { campo: 'interesesIcetex', etiqueta: 'Intereses ICETEX 2025 ($)' },
    ],
  },
];

export function PasoDocumentos() {
  const documentos = useDeclaracion((s) => s.documentos);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const subiendo = useSubidas((s) => s.enCurso > 0);
  const esperados = esperadosSegunExogena(documentos);
  const hayExogena = documentos.some((d) => d.tipo === 'exogena');
  return (
    <section aria-label="Carga de documentos">
      <h2 className="text-2xl font-bold">Sube tus documentos</h2>
      <p className="mt-1 text-sm text-texto-suave">
        {hayExogena
          ? 'Según tu exógena, estos son los documentos de tu declaración. Si subes algo en la sección equivocada, lo clasificamos y lo ubicamos donde corresponde.'
          : 'La IA lee cada documento y tú confirmas los valores.'}
      </p>
      {!hayExogena && <AvisoSinExogena alIr={() => irAPaso('exogena')} />}
      <div className="mt-5 space-y-4">
        {SLOTS.map((slot) => (
          <SlotDocumento key={slot.clave} slot={slot} documentos={documentos} esperados={esperados} />
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => irAPaso('exogena')}
          className="h-13 shrink-0 rounded-2xl border border-borde px-5 font-semibold transition hover:border-primario/40"
        >
          ← Exógena
        </button>
        <button
          type="button"
          disabled={subiendo || (!hayExogena && documentos.length === 0)}
          onClick={() => irAPaso('entrevista')}
          className="h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
        >
          {subiendo ? 'Leyendo documento con IA…' : 'Continuar a la entrevista'}
        </button>
      </div>
    </section>
  );
}

function AvisoSinExogena({ alIr }: { alIr: () => void }) {
  return (
    <p role="alert" className="mt-3 rounded-xl bg-alerta-suave px-3 py-2.5 text-sm text-alerta">
      Aún no has subido tu exógena — con ella te decimos exactamente qué documentos necesitas.{' '}
      <button type="button" onClick={alIr} className="font-semibold underline">
        Ir al paso Exógena
      </button>
    </p>
  );
}

function SlotDocumento({
  slot,
  documentos,
  esperados,
}: {
  slot: Slot;
  documentos: DocumentoProcesado[];
  esperados: DocumentoEsperado[];
}) {
  const respuestas = useDeclaracion((s) => s.respuestas);
  const propios = documentos.filter((d) => slot.tipos.includes(d.tipo));
  const manualDiligenciado = (slot.camposManuales ?? []).some(({ campo }) => respuestas[campo] > 0);
  const completo = propios.length > 0 || manualDiligenciado;
  const esperadosDelSlot = esperados.filter((e) => slot.tipos.includes(e.tipo));
  return (
    <div className={`rounded-2xl border p-4 ${completo ? 'border-primario/40 bg-primario-suave/40' : 'border-borde bg-card'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {completo ? '✅' : slot.opcional ? '▫️' : '⬜'} {slot.titulo}
            {slot.opcional && <span className="ml-1 text-xs font-normal text-texto-suave">opcional</span>}
          </p>
          <p className="mt-0.5 text-xs text-texto-suave">{slot.descripcion}</p>
          <ChecklistEsperados esperados={esperadosDelSlot} documentos={propios} />
          {slot.camposManuales && <ValoresManuales campos={slot.camposManuales} />}
        </div>
        <BotonSubir slot={slot} />
      </div>
      {propios.length > 0 && (
        <ul className="mt-3 space-y-3">
          {propios.map((doc) => (
            <TarjetaDocumento key={doc.id} documento={doc} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BotonSubir({ slot }: { slot: Slot }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const procesar = async (archivos: FileList | null) => {
    if (!archivos) {
      return;
    }
    setCargando(true);
    setAviso(null);
    for (const archivo of Array.from(archivos)) {
      setAviso(await procesarArchivo(archivo, slot));
    }
    setCargando(false);
  };

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={cargando}
        className="rounded-xl bg-primario px-4 py-2 text-xs font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-50"
      >
        {cargando ? 'Leyendo con IA…' : '⬆ Subir'}
      </button>
      <input ref={inputRef} type="file" accept={slot.accept} multiple hidden onChange={(e) => void procesar(e.target.files)} />
      {aviso && (
        <p role="alert" className="mt-1 max-w-[200px] text-[11px] text-alerta">
          {aviso}
        </p>
      )}
    </div>
  );
}

/** Sube por el MISMO pipeline de siempre; el documento se agrupa por su tipo real. */
async function procesarArchivo(archivo: File, slot: Slot): Promise<string | null> {
  const resultado = await subirArchivo(archivo);
  if ('error' in resultado) {
    return `${archivo.name}: ${resultado.error}`;
  }
  const reemplazaExogena =
    resultado.tipo === 'exogena' && useDeclaracion.getState().documentos.some((d) => d.tipo === 'exogena');
  useDeclaracion.getState().agregarDocumento(resultado);
  aplicarPrecarga(resultado);
  if (reemplazaExogena) {
    return 'Reemplazamos la exógena anterior por esta: cada declaración usa una sola exógena.';
  }
  if (!slot.tipos.includes(resultado.tipo)) {
    return `Lo clasificamos como "${NOMBRES_TIPO[resultado.tipo]}" y lo ubicamos en su sección.`;
  }
  return null;
}

function esperadosSegunExogena(documentos: DocumentoProcesado[]): DocumentoEsperado[] {
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  return exogena?.tipo === 'exogena' ? documentosEsperados(exogena.exogena) : [];
}
