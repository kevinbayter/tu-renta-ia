'use client';

import { FileCheck2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { aplicarPrecarga, NOMBRES_TIPO, subirArchivo, useSubidas } from './pipeline-documentos';
import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';


/**
 * Declaración del año gravable anterior: de ella salen datos que el usuario NO
 * recuerda (patrimonio líquido casilla 31, impuesto neto 126, anticipo 133).
 * Si no la sube, la entrevista se los pregunta.
 */
export function BloqueDeclaracionAnterior() {
  const documentos = useDeclaracion((s) => s.documentos);
  const anterior = documentos.find((d) => d.tipo === 'declaracion_anterior');
  if (anterior?.tipo === 'declaracion_anterior') {
    return <ResumenExtraido datos={anterior.datos} />;
  }
  return <ZonaSubidaAnterior />;
}

function ZonaSubidaAnterior() {
  const inputRef = useRef<HTMLInputElement>(null);
  const subiendo = useSubidas((s) => s.enCurso > 0);
  const [aviso, setAviso] = useState<string | null>(null);

  const procesar = async (archivo: File | undefined) => {
    if (!archivo) {
      return;
    }
    setAviso(await subirDeclaracionAnterior(archivo));
  };

  return (
    <div className="rounded-2xl border border-borde bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <FileCheck2 size={16} className="shrink-0 text-primario" aria-hidden />
            Tu declaración del año pasado
            <span className="rounded-md bg-primario-suave px-1.5 py-0.5 text-[10px] font-semibold text-primario">
              Opcional
            </span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-texto-suave">
            Si la tienes en PDF, súbela y tomamos de ahí tu patrimonio, tu impuesto y tu anticipo del año
            anterior — así tu declaración queda cuadrada con la que ya presentaste, sin que tengas que buscar
            esos números. ¿No la tienes a mano? Tranquilo: seguimos sin problema y te preguntamos solo lo
            indispensable en la entrevista.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-borde bg-card px-4 py-2 text-xs font-semibold transition hover:border-primario/40 disabled:opacity-50"
        >
          <Upload size={14} aria-hidden /> {subiendo ? 'Leyendo…' : 'Subir PDF'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" hidden onChange={(e) => void procesar(e.target.files?.[0])} />
      {aviso && (
        <p role="alert" className="mt-2 text-xs text-alerta">
          {aviso}
        </p>
      )}
    </div>
  );
}

function ResumenExtraido({
  datos,
}: {
  datos: { anioGravable: number; patrimonioLiquido: number; impuestoNetoRenta: number; anticipoAnioSiguiente: number };
}) {
  return (
    <div className="rounded-2xl border border-primario/30 bg-primario-suave/50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <FileCheck2 size={16} className="shrink-0 text-primario" aria-hidden />
        Declaración {datos.anioGravable} leída — ya no te preguntaremos estos datos
      </p>
      <dl className="mt-2.5 space-y-1">
        <Dato etiqueta="Patrimonio líquido (casilla 31)" valor={datos.patrimonioLiquido} />
        <Dato etiqueta="Impuesto neto de renta (126)" valor={datos.impuestoNetoRenta} />
        <Dato etiqueta="Anticipo para este año (133)" valor={datos.anticipoAnioSiguiente} />
      </dl>
      <p className="mt-2 text-[11px] leading-relaxed text-texto-suave">
        Con estos datos tu declaración queda enlazada con la del año pasado y verificamos que todo cuadre.
        Puedes ajustar cualquier valor en el paso de Revisión.
      </p>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="text-texto-suave">{etiqueta}</dt>
      <dd className="font-mono font-semibold">{formatearPesos(valor)}</dd>
    </div>
  );
}

async function subirDeclaracionAnterior(archivo: File): Promise<string | null> {
  const resultado = await subirArchivo(archivo);
  if ('error' in resultado) {
    return `${archivo.name}: ${resultado.error}`;
  }
  useDeclaracion.getState().agregarDocumento(resultado);
  aplicarPrecarga(resultado);
  if (resultado.tipo !== 'declaracion_anterior') {
    return `Esto parece un "${NOMBRES_TIPO[resultado.tipo]}", no una declaración presentada. Lo guardamos igual en su sección.`;
  }
  return null;
}
