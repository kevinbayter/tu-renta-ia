'use client';

import { coincideEntidad, tokensDeEntidad } from '@turenta/core';
import { Lightbulb } from 'lucide-react';

import type { DocumentoEsperado } from '@turenta/core';
import type { DocumentoProcesado } from '@/lib/tipos';

/** Checklist tipo referencia: las entidades que reportaron en la exógena, con su estado de carga. */
export function ChecklistEsperados({
  esperados,
  documentos,
}: {
  esperados: DocumentoEsperado[];
  documentos: DocumentoProcesado[];
}) {
  const verificables = esperados.filter((e) => e.tipo !== 'otro');
  const sugerencias = esperados.filter((e) => e.tipo === 'otro');
  if (esperados.length === 0) {
    return null;
  }
  return (
    <div className="mt-2.5">
      {verificables.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-texto-suave">Según tu exógena, aquí van:</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {verificables.map((esperado) => (
              <ChipEsperado key={esperado.nit} esperado={esperado} cubierto={estaCubierto(esperado, documentos)} />
            ))}
          </ul>
        </>
      )}
      {sugerencias.length > 0 && <Sugerencias sugerencias={sugerencias} />}
    </div>
  );
}

/** Soportes sugeridos por la exógena (predial, deudas): informativos, sin estado de pendiente. */
function Sugerencias({ sugerencias }: { sugerencias: DocumentoEsperado[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {sugerencias.map((s) => (
        <li key={`${s.nit}-${s.nombre}`} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-texto-suave">
          <Lightbulb size={12} className="mt-0.5 shrink-0 text-primario" aria-hidden />
          <span>
            <strong className="text-foreground">{nombreCortoEntidad(s.nombre)}</strong>: {s.motivo}.
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChipEsperado({ esperado, cubierto }: { esperado: DocumentoEsperado; cubierto: boolean }) {
  const estilo = cubierto
    ? 'border-primario/40 bg-exito-suave text-exito'
    : 'border-borde bg-background text-texto-suave';
  return (
    <li
      title={esperado.motivo}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${estilo}`}
    >
      <span aria-hidden>{cubierto ? '✓' : '·'}</span>
      {nombreCortoEntidad(esperado.nombre)}
      {esperado.opcional && !cubierto && <span className="font-normal opacity-70">(opcional)</span>}
    </li>
  );
}

function nombreCortoEntidad(nombre: string): string {
  const significativos = tokensDeEntidad(nombre);
  if (significativos.length === 0) {
    return nombre.split(/\s+/).slice(0, 2).join(' ');
  }
  return significativos.slice(0, 2).join(' ');
}

function estaCubierto(esperado: DocumentoEsperado, documentos: DocumentoProcesado[]): boolean {
  return documentos.some((doc) => coincideConEsperado(esperado, doc));
}

function coincideConEsperado(esperado: DocumentoEsperado, doc: DocumentoProcesado): boolean {
  if (doc.tipo === 'certificado_220' && esperado.tipo === 'certificado_220') {
    return coincideNit(esperado.nit, doc.datos.nitRetenedor);
  }
  if (doc.tipo === 'certificado_bancario' && esperado.tipo === 'certificado_bancario') {
    return coincideEntidad(esperado.nombre, doc.datos.entidad);
  }
  if (doc.tipo === 'medicina_prepagada' && esperado.tipo === 'medicina_prepagada') {
    return coincideEntidad(esperado.nombre, doc.datos.entidad);
  }
  return false;
}

/** Tolera el dígito de verificación: "900111222" cubre "9001112223" y viceversa. */
function coincideNit(a: string, b: string): boolean {
  const digitosA = a.replace(/\D/g, '');
  const digitosB = b.replace(/\D/g, '');
  if (!digitosA || !digitosB) {
    return false;
  }
  return digitosA.startsWith(digitosB) || digitosB.startsWith(digitosA);
}

