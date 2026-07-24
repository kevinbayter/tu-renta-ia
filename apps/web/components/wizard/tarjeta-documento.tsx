'use client';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { DocumentoProcesado } from '@/lib/tipos';

const TITULOS: Record<string, string> = {
  exogena: 'Exógena DIAN',
  certificado_220: 'Certificado 220 (empleador)',
  certificado_bancario: 'Certificado bancario',
  medicina_prepagada: 'Medicina prepagada',
  otro: 'Documento no reconocido',
};

export function TarjetaDocumento({ documento }: { documento: DocumentoProcesado }) {
  const eliminarDocumento = useDeclaracion((s) => s.eliminarDocumento);
  return (
    <li className="rounded-2xl border border-borde bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{TITULOS[documento.tipo]}</p>
          <p className="break-all text-xs text-texto-suave">{documento.nombreArchivo}</p>
        </div>
        <button
          type="button"
          onClick={() => eliminarDocumento(documento.id)}
          aria-label={`Eliminar ${documento.nombreArchivo}`}
          className="rounded-lg px-2 py-1 text-sm text-texto-suave hover:bg-alerta-suave hover:text-error"
        >
          ✕
        </button>
      </div>
      <ContenidoDocumento documento={documento} />
    </li>
  );
}

function ContenidoDocumento({ documento }: { documento: DocumentoProcesado }) {
  if (documento.tipo === 'exogena') {
    return (
      <DatosExtraidos
        datos={[
          ['Año gravable', String(documento.exogena.anioGravable)],
          ['Reportes de terceros', String(documento.exogena.filas.length)],
          ['Tope ingresos', formatearPesos(documento.exogena.topes.ingresos)],
        ]}
      />
    );
  }
  if (documento.tipo === 'certificado_220') {
    return (
      <>
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} />
        <DatosExtraidos
          datos={[
            ['Empleador (NIT)', documento.datos.nitRetenedor],
            ['Total ingresos brutos', formatearPesos(documento.datos.totalIngresosBrutos)],
            ['Aportes salud + pensión', formatearPesos(documento.datos.aportesSalud + documento.datos.aportesPension)],
            ['Retención en la fuente', formatearPesos(documento.datos.retencionFuente)],
          ]}
        />
      </>
    );
  }
  if (documento.tipo === 'certificado_bancario') {
    return (
      <>
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} />
        <DatosExtraidos
          datos={[
            ['Entidad', documento.datos.entidad],
            ['Saldo a 31 dic', formatearPesos(documento.datos.saldoCuentas)],
            ['Rendimientos', formatearPesos(documento.datos.rendimientos)],
            ['Retención', formatearPesos(documento.datos.retencionFuente)],
          ]}
        />
      </>
    );
  }
  if (documento.tipo === 'medicina_prepagada') {
    return (
      <DatosExtraidos
        datos={documento.datos.amparos.map((a, i) => [
          `Amparo ${i + 1} (${a.vigenciaInicio} → ${a.vigenciaFin})`,
          formatearPesos(a.valor),
        ])}
      />
    );
  }
  return <p className="mt-2 text-sm text-alerta">No pudimos clasificar este documento. Puedes eliminarlo.</p>;
}

function DatosExtraidos({ datos }: { datos: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-1">
      {datos.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex items-baseline justify-between gap-3 text-sm">
          <dt className="text-texto-suave">{etiqueta}</dt>
          <dd className="font-mono font-medium">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function AvisoDiscrepancias({ coinciden }: { coinciden: boolean }) {
  if (coinciden) {
    return <p className="mt-2 inline-block rounded-lg bg-exito-suave px-2 py-0.5 text-xs text-exito">✓ Verificado con doble lectura</p>;
  }
  return (
    <p role="alert" className="mt-2 rounded-lg bg-alerta-suave px-2 py-1 text-xs text-alerta">
      ⚠ Las dos lecturas de IA no coincidieron — revisa estos valores con tu documento a la mano.
    </p>
  );
}
