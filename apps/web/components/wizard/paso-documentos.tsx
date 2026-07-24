'use client';

import { documentosEsperados, mesesTrabajadosSegunCertificados, precargarDesdeExogena } from '@turenta/core';
import { useRef, useState } from 'react';

import { ChecklistEsperados } from './checklist-esperados';
import { TarjetaDocumento } from './tarjeta-documento';
import { useDeclaracion } from '@/lib/store';

import type { DocumentoEsperado } from '@turenta/core';
import type { DocumentoProcesado } from '@/lib/tipos';

const ANIO_GRAVABLE = 2025;

type TipoDocumento = DocumentoProcesado['tipo'];

interface Slot {
  clave: string;
  titulo: string;
  descripcion: string;
  accept: string;
  tipos: TipoDocumento[];
  opcional?: boolean;
}

const SLOTS: Slot[] = [
  {
    clave: 'exogena',
    titulo: 'Exógena DIAN',
    descripcion: 'El Excel "información reportada por terceros" que descargas del portal de la DIAN.',
    accept: '.xlsx,.xls',
    tipos: ['exogena'],
  },
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
  },
  {
    clave: 'otros',
    titulo: 'Otros deducibles (si aplican)',
    descripcion: 'Intereses de vivienda, ICETEX, pensiones voluntarias… La IA intentará clasificarlos; lo que no reconozca lo capturas en la entrevista.',
    accept: '.pdf,.xlsx,.xls',
    tipos: ['otro'],
    opcional: true,
  },
];

export function PasoDocumentos() {
  const documentos = useDeclaracion((s) => s.documentos);
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const esperados = esperadosSegunExogena(documentos);
  return (
    <section aria-label="Carga de documentos">
      <h2 className="text-2xl font-bold">Sube tus documentos</h2>
      <p className="mt-1 text-sm text-texto-suave">
        La IA lee cada documento y tú confirmas los valores. Si subes algo en la sección equivocada, no
        pasa nada: lo clasificamos y lo ubicamos donde corresponde.
      </p>
      <div className="mt-5 space-y-4">
        {SLOTS.map((slot) => (
          <SlotDocumento key={slot.clave} slot={slot} documentos={documentos} esperados={esperados} />
        ))}
      </div>
      <button
        type="button"
        disabled={documentos.length === 0}
        onClick={() => irAPaso('entrevista')}
        className="mt-6 h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        Continuar a la entrevista
      </button>
    </section>
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
  const propios = documentos.filter((d) => slot.tipos.includes(d.tipo));
  const completo = propios.length > 0;
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
    return `Lo clasificamos como "${nombreTipo(resultado.tipo)}" y lo ubicamos en su sección.`;
  }
  return null;
}

const NOMBRES_TIPO: Record<TipoDocumento, string> = {
  exogena: 'Exógena DIAN',
  certificado_220: 'Certificado 220',
  certificado_bancario: 'Certificado bancario',
  medicina_prepagada: 'Medicina prepagada',
  otro: 'Otro documento',
};

function nombreTipo(tipo: TipoDocumento): string {
  return NOMBRES_TIPO[tipo];
}

/** Lo reportado en los documentos no se pregunta: se precarga y la entrevista solo lo confirma. */
function aplicarPrecarga(doc: DocumentoProcesado): void {
  if (doc.tipo === 'exogena') {
    const precarga = precargarDesdeExogena(doc.exogena);
    useDeclaracion.getState().actualizarRespuestas(precarga.respuestas);
    return;
  }
  precargarMesesDesde220(doc);
}

/** Los meses trabajados salen del "período de la certificación" de los 220 (unión entre empleadores). */
function precargarMesesDesde220(doc: DocumentoProcesado): void {
  if (doc.tipo !== 'certificado_220') {
    return;
  }
  const certificados = useDeclaracion
    .getState()
    .documentos.filter((d): d is Extract<DocumentoProcesado, { tipo: 'certificado_220' }> => d.tipo === 'certificado_220');
  const meses = mesesTrabajadosSegunCertificados(certificados.map((d) => d.datos), ANIO_GRAVABLE);
  if (meses !== null) {
    useDeclaracion.getState().actualizarRespuestas({ mesesConRelacionLaboral: meses });
  }
}

function esperadosSegunExogena(documentos: DocumentoProcesado[]): DocumentoEsperado[] {
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  return exogena?.tipo === 'exogena' ? documentosEsperados(exogena.exogena) : [];
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
