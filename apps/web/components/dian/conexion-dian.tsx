'use client';

import { CheckCircle2, Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';

import { AvisoTransparencia } from './aviso-transparencia';
import { FormularioCredenciales } from './formulario-credenciales';
import { PanelAutorizacion } from './panel-autorizacion';

import type { EtapaConexion } from '@turenta/core';

type Fase = 'autorizar' | 'credenciales' | 'progreso' | 'listo' | 'error';

export interface ResultadoConexion {
  nombreArchivo: string;
  contenidoBase64: string;
}

/**
 * Conexión con la DIAN: autorización explícita → credenciales de un solo uso →
 * progreso en vivo. El formulario es NUESTRO (el iframe del portal no sirve: su
 * sesión no es accesible para el worker), por eso la transparencia es máxima.
 */
export function ConexionDian({
  titular,
  alCerrar,
  alCompletar,
}: {
  titular: string;
  alCerrar: () => void;
  alCompletar: (resultado: ResultadoConexion) => void;
}) {
  const [fase, setFase] = useState<Fase>('autorizar');
  const [etapa, setEtapa] = useState<EtapaConexion>('iniciando');
  const [error, setError] = useState<string | null>(null);

  const conectar = async (credenciales: { tipoDocumento: string; numeroDocumento: string; contrasena: string }) => {
    setFase('progreso');
    setEtapa('autenticando');
    const respuesta = await fetch('/api/dian/exogena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credenciales, titular }),
    }).catch(() => null);
    const cuerpo = respuesta ? ((await respuesta.json()) as Record<string, string>) : null;
    if (!respuesta?.ok || !cuerpo?.contenidoBase64) {
      setError(cuerpo?.mensaje ?? 'No pudimos conectarnos. Puedes subir tu exógena manualmente.');
      setFase('error');
      return;
    }
    setEtapa('completado');
    setFase('listo');
    alCompletar({ nombreArchivo: cuerpo.nombreArchivo ?? 'exogena.xlsx', contenidoBase64: cuerpo.contenidoBase64 });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card shadow-2xl">
        <Encabezado alCerrar={alCerrar} />
        <div className="px-6 pb-6">
          {fase === 'autorizar' && (
            <PanelAutorizacion titular={titular} alAceptar={() => setFase('credenciales')} alCancelar={alCerrar} />
          )}
          {fase === 'credenciales' && (
            <>
              <AvisoTransparencia />
              <FormularioCredenciales alEnviar={(c) => void conectar(c)} alVolver={() => setFase('autorizar')} />
            </>
          )}
          {fase === 'progreso' && <Progreso etapa={etapa} />}
          {fase === 'error' && <ErrorConexion mensaje={error ?? ''} alReintentar={() => setFase('credenciales')} alCerrar={alCerrar} />}
          {fase === 'listo' && <Exito />}
        </div>
      </div>
    </div>
  );
}

function Encabezado({ alCerrar }: { alCerrar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-borde p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primario-suave text-primario" aria-hidden>
          <ShieldCheck size={22} />
        </span>
        <div>
          <h2 className="text-lg font-bold">Conectar con la DIAN</h2>
          <p className="text-xs text-texto-suave">Traemos tu información sin que tengas que descargarla</p>
        </div>
      </div>
      <button type="button" onClick={alCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-texto-suave hover:bg-background">
        <X size={18} />
      </button>
    </div>
  );
}

const ETAPAS: { clave: EtapaConexion; texto: string }[] = [
  { clave: 'autenticando', texto: 'Ingresando a tu cuenta' },
  { clave: 'navegando', texto: 'Buscando tu información exógena' },
  { clave: 'descargando', texto: 'Descargando el reporte' },
];

function Progreso({ etapa }: { etapa: EtapaConexion }) {
  const indiceActual = ETAPAS.findIndex((e) => e.clave === etapa);
  return (
    <div className="pt-5">
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
        Tus credenciales no se guardaron. Puedes reintentar o descargar la exógena tú mismo desde el portal
        de la DIAN y subirla — funciona exactamente igual.
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={alCerrar} className="h-11 flex-1 rounded-2xl border border-borde font-semibold">
          Subirla manualmente
        </button>
        <button
          type="button"
          onClick={alReintentar}
          className="h-11 flex-1 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
