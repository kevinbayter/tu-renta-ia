'use client';

import { obligadoADeclarar, umbralesObligadoADeclarar } from '@turenta/core';
import { obtenerConstantes } from '@turenta/motor-fiscal';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { ExogenaParseada } from '@turenta/core';
import type { DocumentoProcesado } from '@/lib/tipos';

const TITULOS: Record<string, string> = {
  exogena: 'Exógena DIAN',
  certificado_220: 'Certificado 220 (empleador)',
  certificado_bancario: 'Certificado bancario',
  medicina_prepagada: 'Medicina prepagada',
  declaracion_anterior: 'Declaración del año anterior',
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
      <>
        <BannerTitularExogena exogena={documento.exogena} />
        <BannerObligado exogena={documento.exogena} />
        <DatosExtraidos
          datos={[
            ['Año gravable', String(documento.exogena.anioGravable)],
            ['Reportes de terceros', String(documento.exogena.filas.length)],
            ['Tope ingresos', formatearPesos(documento.exogena.topes.ingresos)],
          ]}
        />
      </>
    );
  }
  if (documento.tipo === 'certificado_220') {
    return (
      <>
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} discrepancias={documento.discrepancias} />
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
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} discrepancias={documento.discrepancias} />
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
  if (documento.tipo === 'declaracion_anterior') {
    return (
      <>
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} discrepancias={documento.discrepancias} />
        <DatosExtraidos
          datos={[
            ['Año gravable', String(documento.datos.anioGravable)],
            ['Patrimonio líquido (31)', formatearPesos(documento.datos.patrimonioLiquido)],
            ['Impuesto neto (126)', formatearPesos(documento.datos.impuestoNetoRenta)],
            ['Anticipo (133)', formatearPesos(documento.datos.anticipoAnioSiguiente)],
          ]}
        />
      </>
    );
  }
  if (documento.tipo === 'medicina_prepagada') {
    return (
      <>
        <AvisoDiscrepancias coinciden={documento.pasadasCoinciden} discrepancias={documento.discrepancias} />
        <DatosExtraidos
          datos={documento.datos.amparos.map((a, i) => [
            `Amparo ${i + 1} (${a.vigenciaInicio} → ${a.vigenciaFin})`,
            formatearPesos(a.valor),
          ])}
        />
      </>
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

/** Alerta si la exógena subida no pertenece al titular de la declaración. */
function BannerTitularExogena({ exogena }: { exogena: ExogenaParseada }) {
  const declarante = useDeclaracion((s) => s.declarante);
  const cedulaTitular = declarante.identificacion.replace(/\D/g, '');
  const cedulaExogena = exogena.identificacionConsultante ?? '';
  if (!cedulaTitular || !cedulaExogena || cedulaTitular === cedulaExogena) {
    return null;
  }
  return (
    <p role="alert" className="mt-2 rounded-lg bg-alerta-suave px-2 py-1.5 text-xs text-error">
      ⚠️ Esta exógena es de la cédula {cedulaExogena}, pero la declaración es de{' '}
      {declarante.nombres} (C.C. {cedulaTitular}). Sube la exógena del titular o cambia el titular en
      Mis declaraciones — con documentos de otra persona el resultado será incorrecto.
    </p>
  );
}

function BannerObligado({ exogena }: { exogena: ExogenaParseada }) {
  const obligado = estaObligado(exogena);
  if (obligado === null) {
    return null;
  }
  if (obligado) {
    return (
      <p className="mt-2 rounded-lg bg-primario-suave px-2 py-1 text-xs">
        ✓ Según lo reportado por terceros, <strong>estás obligado a declarar</strong> este año.
      </p>
    );
  }
  return (
    <p className="mt-2 rounded-lg bg-exito-suave px-2 py-1 text-xs text-exito">
      Según lo reportado, podrías <strong>no estar obligado</strong> a declarar — aun así puedes declarar
      voluntariamente para recuperar retenciones.
    </p>
  );
}

function estaObligado(exogena: ExogenaParseada): boolean | null {
  try {
    const c = obtenerConstantes(exogena.anioGravable);
    const umbrales = umbralesObligadoADeclarar(c.uvt, c.topesDeclarar.patrimonioUvt, c.topesDeclarar.ingresosUvt);
    return obligadoADeclarar(exogena.topes, umbrales);
  } catch {
    return null;
  }
}

function AvisoDiscrepancias({ coinciden, discrepancias }: { coinciden: boolean; discrepancias: string[] }) {
  if (coinciden) {
    return <p className="mt-2 inline-block rounded-lg bg-exito-suave px-2 py-0.5 text-xs text-exito">✓ Verificado con doble lectura</p>;
  }
  return (
    <div role="alert" className="mt-2 rounded-lg bg-alerta-suave px-2 py-1.5 text-xs text-alerta">
      <p>⚠ Las dos lecturas de IA no coincidieron en estos campos (usamos la primera). Compáralos con tu documento y, si el valor mostrado abajo está mal, elimina el documento y súbelo de nuevo:</p>
      <ul className="mt-1 list-inside list-disc">
        {discrepancias.map((d) => (
          <li key={d}>{describirDiscrepancia(d)}</li>
        ))}
      </ul>
    </div>
  );
}

const NOMBRES_CAMPO: Record<string, string> = {
  pagosSalarios: 'Pagos por salarios',
  pagosPrestaciones: 'Pagos por prestaciones',
  otrosPagos: 'Otros pagos',
  cesantiasPagadas: 'Cesantías e intereses pagados',
  cesantiasConsignadas: 'Cesantías consignadas al fondo',
  totalIngresosBrutos: 'Total ingresos brutos',
  aportesSalud: 'Aportes a salud',
  aportesPension: 'Aportes a pensión',
  ingresoPromedioSeisMeses: 'Ingreso promedio últimos 6 meses',
  retencionFuente: 'Retención en la fuente',
  saldoCuentas: 'Saldo de cuentas',
  rendimientos: 'Rendimientos',
  gmf: 'GMF (4×1000)',
  componenteInflacionarioInformado: 'Componente inflacionario',
};

/** Convierte ".otrosPagos: pasada1=409000 pasada2=0" en texto legible para el usuario. */
function describirDiscrepancia(cruda: string): string {
  const partes = /^\.?(\w+): pasada1=(\d+) pasada2=(\d+)$/.exec(cruda);
  if (!partes || !partes[1] || partes[2] === undefined || partes[3] === undefined) {
    return cruda;
  }
  const campo = NOMBRES_CAMPO[partes[1]] ?? partes[1];
  return `${campo}: una lectura vio ${formatearPesos(Number(partes[2]))} y la otra ${formatearPesos(Number(partes[3]))}`;
}
