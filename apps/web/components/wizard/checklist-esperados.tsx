'use client';

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
  if (esperados.length === 0) {
    return null;
  }
  return (
    <div className="mt-2.5">
      <p className="text-[11px] font-medium text-texto-suave">Según tu exógena, aquí van:</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {esperados.map((esperado) => (
          <ChipEsperado key={esperado.nit} esperado={esperado} cubierto={estaCubierto(esperado, documentos)} />
        ))}
      </ul>
    </div>
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

const PALABRAS_GENERICAS = new Set([
  'SA', 'S', 'A', 'DE', 'LA', 'EL', 'Y', 'LTDA', 'SAS', 'COMPANIA', 'FINANCIAMIENTO',
  'BANCO', 'FIDUCIARIA', 'COLOMBIA', 'COMISIONISTA', 'BOLSA', 'FONDO', 'CAPITAL',
]);

function nombreCortoEntidad(nombre: string): string {
  const significativos = tokensSignificativos(nombre);
  if (significativos.length === 0) {
    return nombre.split(' ').slice(0, 2).join(' ');
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
    return coincideNombre(esperado.nombre, doc.datos.entidad);
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

function coincideNombre(a: string, b: string): boolean {
  const tokensB = new Set(tokensSignificativos(b));
  return tokensSignificativos(a).some((token) => tokensB.has(token));
}

function tokensSignificativos(nombre: string): string[] {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length > 1 && !PALABRAS_GENERICAS.has(token));
}
