'use client';

import { Info, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ANIO_GRAVABLE, registrarDocumentoDian, useSubidas } from './pipeline-documentos';
import { ConexionDian } from '@/components/dian/conexion-dian';
import { useDeclaracion } from '@/lib/store';

import type { OperacionDian, ResultadoConexion } from '@/components/dian/conexion-dian';

const LARGO_MINIMO_CEDULA = 5;

/** Sin worker configurado no se ofrece el flujo: pedir la clave sería en vano. */
function useConexionHabilitada(): boolean {
  const [habilitada, setHabilitada] = useState(false);
  useEffect(() => {
    fetch('/api/dian/estado')
      .then((r) => r.json())
      .then((d: { habilitada?: boolean }) => setHabilitada(d.habilitada === true))
      .catch(() => setHabilitada(false));
  }, []);
  return habilitada;
}

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
  const [aviso, setAviso] = useState<string | null>(null);
  const habilitada = useConexionHabilitada();
  const leyendo = useSubidas((s) => s.enCurso > 0);
  const leyendoAparte = useSubidas((s) => s.enSegundoPlano > 0);
  const avisoPersistido = useSubidas((s) => s.avisoSegundoPlano);
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  // Mismos dígitos que enviará el servidor: si aquí se mostrara la cédula con
  // puntos, el texto firmado y el que se hashea como evidencia no coincidirían.
  const titular = (declarante?.identificacion ?? '').replace(/\D/g, '');

  // La DIAN permite entrar a nombre de un tercero, pero ese formulario aún no
  // está mapeado: se dice la verdad en vez de pedir una clave para nada.
  if (esPropia === false) {
    return <NoDisponibleParaTerceros />;
  }
  // Sin cédula del titular la petición sería rechazada siempre; no tiene
  // sentido pedir la contraseña de la DIAN para eso.
  if (titular.length < LARGO_MINIMO_CEDULA || !habilitada) {
    return null;
  }

  // La declaración anterior es opcional y sus cifras no se necesitan hasta
  // Revisión: se lee en segundo plano para no retener al usuario en el paso 1.
  const enSegundoPlano = operacion === 'declaracion';
  const avisoMostrado = aviso ?? (enSegundoPlano ? avisoPersistido : null);

  const completar = (resultado: ResultadoConexion) => {
    setAbierto(false);
    const lectura = registrarDocumentoDian(
      resultado.nombreArchivo,
      resultado.contenidoBase64,
      enSegundoPlano ? 'declaracion_anterior' : undefined,
      enSegundoPlano,
    ).then((registrado) => {
      const error = 'error' in registrado ? registrado.error : null;
      setAviso(error);
      alTerminar?.(error);
    });
    if (!enSegundoPlano) {
      return lectura;
    }
    return Promise.resolve();
  };

  return (
    <>
      <Tarjeta operacion={operacion} alAbrir={() => setAbierto(true)} ocupado={leyendo || leyendoAparte} />
      {leyendoAparte && (
        <p className="mt-2 flex items-center gap-2 text-xs text-texto-suave" role="status">
          <Loader2 size={13} className="animate-spin text-primario" aria-hidden />
          Estamos leyendo tu declaración. Puedes seguir con los siguientes pasos: los datos entrarán solos.
        </p>
      )}
      {avisoMostrado !== null && (
        <p role="alert" className="mt-2 text-xs text-alerta">
          Llegó el archivo pero no pudimos leerlo: {avisoMostrado}. Puedes subirlo tú mismo aquí abajo.
        </p>
      )}
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

function Tarjeta({
  operacion,
  alAbrir,
  ocupado,
}: {
  operacion: OperacionDian;
  alAbrir: () => void;
  ocupado: boolean;
}) {
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
        disabled={ocupado}
        className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShieldCheck size={16} aria-hidden /> {ocupado ? 'Leyendo documento…' : texto.boton}
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
