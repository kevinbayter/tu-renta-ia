'use client';

import { Info, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';

import { ANIO_GRAVABLE, registrarDocumentoDian } from './pipeline-documentos';
import { ConexionDian } from '@/components/dian/conexion-dian';
import { useDeclaracion } from '@/lib/store';

import type { OperacionDian, ResultadoConexion } from '@/components/dian/conexion-dian';

/**
 * "Conectar con la DIAN" como opción principal. La vía manual sigue siempre
 * visible al lado: no es el plan B de un error, es una alternativa legítima
 * para quien prefiere no entregar su clave.
 */
export function OpcionConectarDian({
  operacion,
  anioGravable = ANIO_GRAVABLE,
  alTerminar,
}: {
  operacion: OperacionDian;
  anioGravable?: number;
  alTerminar?: (aviso: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  const titular = declarante?.identificacion ?? '';

  // La DIAN permite entrar "a nombre de un tercero", pero ese formulario aún no
  // está mapeado. Antes que pedir una clave para un flujo que no funciona, se
  // dice la verdad y se ofrece la vía manual.
  if (esPropia === false) {
    return <NoDisponibleParaTerceros />;
  }

  const completar = async (resultado: ResultadoConexion) => {
    const registrado = await registrarDocumentoDian(resultado.nombreArchivo, resultado.contenidoBase64);
    setAbierto(false);
    alTerminar?.('error' in registrado ? registrado.error : null);
  };

  return (
    <>
      <Tarjeta operacion={operacion} alAbrir={() => setAbierto(true)} />
      {abierto && (
        <ConexionDian
          operacion={operacion}
          titular={titular}
          anioGravable={anioGravable}
          alCerrar={() => setAbierto(false)}
          alCompletar={(r) => void completar(r)}
        />
      )}
    </>
  );
}

const TEXTOS: Record<OperacionDian, { titulo: string; detalle: string; boton: string }> = {
  exogena: {
    titulo: 'Trae tu información desde la DIAN',
    detalle: 'Nos conectamos una sola vez, contigo presente, y traemos tu exógena. No guardamos tu contraseña.',
    boton: 'Conectar con la DIAN',
  },
  declaracion: {
    titulo: 'Trae tu declaración del año pasado',
    detalle: 'La bajamos directo de tu cuenta para cuadrar tu patrimonio y tu anticipo. No guardamos tu contraseña.',
    boton: 'Traer mi última declaración',
  },
};

function Tarjeta({ operacion, alAbrir }: { operacion: OperacionDian; alAbrir: () => void }) {
  const texto = TEXTOS[operacion];
  return (
    <div className="rounded-2xl border border-primario/30 bg-primario-suave/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primario text-white" aria-hidden>
          <Zap size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{texto.titulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-texto-suave">{texto.detalle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={alAbrir}
        className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro"
      >
        <ShieldCheck size={16} aria-hidden /> {texto.boton}
      </button>
    </div>
  );
}

function NoDisponibleParaTerceros() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-borde bg-background p-4">
      <Info size={15} className="mt-0.5 shrink-0 text-primario" aria-hidden />
      <p className="text-xs leading-relaxed text-texto-suave">
        La conexión automática solo está disponible para tu propia declaración. Para la de otra persona,
        sube los documentos aquí abajo: nunca te pediremos la contraseña de la DIAN de un tercero.
      </p>
    </div>
  );
}
