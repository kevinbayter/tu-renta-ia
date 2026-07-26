'use client';

import { CheckCircle2, Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AvisoTransparencia } from './aviso-transparencia';
import { FormularioCredenciales } from './formulario-credenciales';
import { PanelAutorizacion } from './panel-autorizacion';

import type { Credenciales } from './formulario-credenciales';
import type { AlcanceAutorizacion, EtapaConexion } from '@turenta/core';

type Fase = 'autorizar' | 'credenciales' | 'progreso' | 'listo' | 'sin_dato' | 'error';

export type OperacionDian = 'exogena' | 'declaracion';

export interface ResultadoConexion {
  nombreArchivo: string;
  contenidoBase64: string;
}

const OPERACIONES: Record<
  OperacionDian,
  { ruta: string; alcance: AlcanceAutorizacion; titulo: string; subtitulo: string }
> = {
  exogena: {
    ruta: '/api/dian/exogena',
    alcance: 'leer_exogena',
    titulo: 'Traer mi información de la DIAN',
    subtitulo: 'Tu exógena, sin que tengas que descargarla',
  },
  declaracion: {
    ruta: '/api/dian/declaracion',
    alcance: 'leer_declaraciones',
    titulo: 'Traer mi última declaración',
    subtitulo: 'La que ya presentaste, directo de la DIAN',
  },
};

interface RespuestaApi {
  nombreArchivo?: string;
  contenidoBase64?: string;
  mensaje?: string;
  motivoFallo?: string;
}

/**
 * Conexión con la DIAN: autorización explícita, credenciales de un solo uso y
 * progreso en vivo. El formulario es nuestro porque la sesión de un iframe del
 * portal no sería accesible; de ahí que la transparencia sea máxima.
 */
export function ConexionDian({
  operacion,
  titular,
  anioGravable,
  alCerrar,
  alCompletar,
}: {
  operacion: OperacionDian;
  titular: string;
  anioGravable: number;
  alCerrar: () => void;
  alCompletar: (resultado: ResultadoConexion) => void;
}) {
  const [fase, setFase] = useState<Fase>('autorizar');
  const [etapa, setEtapa] = useState<EtapaConexion>('iniciando');
  const [error, setError] = useState('');
  const [recordar, setRecordar] = useState(false);
  const config = OPERACIONES[operacion];
  const alcances: AlcanceAutorizacion[] = recordar
    ? [config.alcance, 'recordar_acceso']
    : [config.alcance];

  const conectar = async (credenciales: Credenciales) => {
    setFase('progreso');
    setEtapa('autenticando');
    const cuerpo = await pedir(config.ruta, {
      ...credenciales,
      titular,
      anioGravable,
      recordarAcceso: recordar,
    });
    if (cuerpo?.contenidoBase64) {
      setEtapa('completado');
      setFase('listo');
      alCompletar({
        nombreArchivo: cuerpo.nombreArchivo ?? 'descarga',
        contenidoBase64: cuerpo.contenidoBase64,
      });
      setTimeout(alCerrar, MS_ANTES_DE_CERRAR);
      return;
    }
    setError(cuerpo?.mensaje ?? 'No pudimos conectarnos. Puedes subir el archivo tú mismo.');
    setFase(cuerpo?.motivoFallo === 'sin_declaracion' ? 'sin_dato' : 'error');
  };

  // Cerrar a media sesión dejaría un navegador abierto contra el portal.
  const cerrable = fase !== 'progreso';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="titulo-conexion-dian"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && cerrable) {
          alCerrar();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card shadow-2xl">
        <Encabezado config={config} alCerrar={alCerrar} cerrable={cerrable} />
        <div className="px-6 pb-6">
          <CuerpoSegunFase
            fase={fase}
            etapa={etapa}
            error={error}
            titular={titular}
            alcances={alcances}
            recordar={recordar}
            alCambiarRecordar={setRecordar}
            alIrA={setFase}
            alConectar={(c) => void conectar(c)}
            alCerrar={alCerrar}
          />
        </div>
      </div>
    </div>
  );
}

interface PropsCuerpo {
  fase: Fase;
  etapa: EtapaConexion;
  error: string;
  titular: string;
  alcances: AlcanceAutorizacion[];
  recordar: boolean;
  alCambiarRecordar: (valor: boolean) => void;
  alIrA: (fase: Fase) => void;
  alConectar: (credenciales: Credenciales) => void;
  alCerrar: () => void;
}

function CuerpoSegunFase(props: PropsCuerpo) {
  const { fase, alIrA, alCerrar } = props;
  if (fase === 'autorizar') {
    return (
      <PanelAutorizacion
        titular={props.titular}
        alcances={props.alcances}
        recordar={props.recordar}
        alCambiarRecordar={props.alCambiarRecordar}
        alAceptar={() => alIrA('credenciales')}
        alCancelar={alCerrar}
      />
    );
  }
  if (fase === 'credenciales') {
    return (
      <>
        <AvisoTransparencia />
        <FormularioCredenciales alEnviar={props.alConectar} alVolver={() => alIrA('autorizar')} />
      </>
    );
  }
  if (fase === 'progreso') {
    return <Progreso etapa={props.etapa} />;
  }
  if (fase === 'error') {
    return <ErrorConexion mensaje={props.error} alReintentar={() => alIrA('credenciales')} alCerrar={alCerrar} />;
  }
  if (fase === 'sin_dato') {
    return <SinDato mensaje={props.error} alCerrar={alCerrar} />;
  }
  return <Exito />;
}

/** Un cuerpo ilegible dejaría el modal clavado en "progreso": se trata como fallo. */
async function pedir(ruta: string, cuerpo: Record<string, unknown>): Promise<RespuestaApi | null> {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).catch(() => null);
  if (!respuesta) {
    return null;
  }
  return (await respuesta.json().catch(() => null)) as RespuestaApi | null;
}

function Encabezado({
  config,
  alCerrar,
  cerrable,
}: {
  config: { titulo: string; subtitulo: string };
  alCerrar: () => void;
  cerrable: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-borde p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primario-suave text-primario" aria-hidden>
          <ShieldCheck size={22} />
        </span>
        <div>
          <h2 id="titulo-conexion-dian" className="text-lg font-bold">
            {config.titulo}
          </h2>
          <p className="text-xs text-texto-suave">{config.subtitulo}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={alCerrar}
        disabled={!cerrable}
        aria-label="Cerrar"
        className="cursor-pointer rounded-lg p-1.5 text-texto-suave hover:bg-background disabled:cursor-not-allowed disabled:opacity-30"
      >
        <X size={18} />
      </button>
    </div>
  );
}

const SEGUNDOS_POR_ETAPA = 12_000;
/** Lo justo para leer "listo" sin obligar a un clic de más. */
const MS_ANTES_DE_CERRAR = 1_800;

function siguienteEtapa(previo: number): number {
  return Math.min(previo + 1, ETAPAS.length - 1);
}

const ETAPAS: { clave: EtapaConexion; texto: string }[] = [
  { clave: 'autenticando', texto: 'Ingresando a tu cuenta' },
  { clave: 'navegando', texto: 'Buscando tu información' },
  { clave: 'descargando', texto: 'Descargando el documento' },
];

/** El servidor no transmite etapas: se avanza por tiempo estimado en vez de
 *  dejar el indicador congelado en la primera durante todo el minuto. */
function Progreso({ etapa }: { etapa: EtapaConexion }) {
  const [avance, setAvance] = useState(0);
  useEffect(() => {
    const reloj = setInterval(() => setAvance(siguienteEtapa), SEGUNDOS_POR_ETAPA);
    return () => clearInterval(reloj);
  }, []);
  const indiceActual = Math.max(ETAPAS.findIndex((e) => e.clave === etapa), avance);
  return (
    <div className="pt-5" role="status" aria-live="polite">
      <ul className="space-y-3">
        {ETAPAS.map((e, i) => (
          <li key={e.clave} className="flex items-center gap-3 text-sm">
            <IconoEtapa hecha={i < indiceActual} actual={i === indiceActual} />
            <span className={i <= indiceActual ? 'font-medium' : 'text-texto-suave'}>{e.texto}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-xl bg-background px-3 py-2.5 text-xs leading-relaxed text-texto-suave">
        Esto puede tardar hasta un minuto. No cierres esta ventana — cuando termine, tus credenciales se
        borran de nuestra memoria automáticamente.
      </p>
    </div>
  );
}

function IconoEtapa({ hecha, actual }: { hecha: boolean; actual: boolean }) {
  if (hecha) {
    return <CheckCircle2 size={17} className="shrink-0 text-exito" aria-hidden />;
  }
  if (actual) {
    return <Loader2 size={17} className="shrink-0 animate-spin text-primario" aria-hidden />;
  }
  return <span className="h-[17px] w-[17px] shrink-0 rounded-full border-2 border-borde" aria-hidden />;
}

function Exito() {
  return (
    <div className="pt-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-exito-suave text-exito" aria-hidden>
        <CheckCircle2 size={28} />
      </span>
      <p className="mt-3 font-semibold">¡Listo! Tu información llegó</p>
      <p className="mt-1 text-sm text-texto-suave">Tus credenciales ya fueron borradas de nuestra memoria.</p>
    </div>
  );
}

/** No encontrar declaración no es una avería: mucha gente declara por primera vez. */
function SinDato({ mensaje, alCerrar }: { mensaje: string; alCerrar: () => void }) {
  return (
    <div className="pt-5">
      <p className="rounded-xl bg-background px-3 py-2.5 text-sm">{mensaje}</p>
      <p className="mt-3 text-xs leading-relaxed text-texto-suave">
        Si es tu primera declaración esto es normal y no tienes que hacer nada: seguimos sin problema.
      </p>
      <button
        type="button"
        onClick={alCerrar}
        className="mt-4 h-11 w-full cursor-pointer rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro"
      >
        Entendido, continuar
      </button>
    </div>
  );
}

function ErrorConexion({
  mensaje,
  alReintentar,
  alCerrar,
}: {
  mensaje: string;
  alReintentar: () => void;
  alCerrar: () => void;
}) {
  return (
    <div className="pt-5">
      <p role="alert" className="rounded-xl bg-alerta-suave px-3 py-2.5 text-sm text-alerta">
        {mensaje}
      </p>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-texto-suave">
        <Lock size={13} className="mt-0.5 shrink-0 text-primario" aria-hidden />
        Tus credenciales no se guardaron. Puedes reintentar o descargar el archivo tú mismo desde el portal
        de la DIAN y subirlo: funciona exactamente igual.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={alCerrar}
          className="h-11 flex-1 cursor-pointer rounded-2xl border border-borde font-semibold"
        >
          Subirlo manualmente
        </button>
        <button
          type="button"
          onClick={alReintentar}
          className="h-11 flex-1 cursor-pointer rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
