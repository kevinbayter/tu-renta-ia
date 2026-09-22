'use client';

import { actividadEconomicaSugerida } from '@turenta/motor-fiscal';
import { FileSignature, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AvisoTransparencia } from './aviso-transparencia';
import { useAccesoGuardado } from './consentimiento';
import { ConfirmarPresentacion } from './confirmar-presentacion';
import { Incompleta, PedirCodigo, Presentada, Progreso } from './fases-presentacion';
import { FormularioCredenciales } from './formulario-credenciales';
import { SelectorGenero } from '@/components/ui/selector-genero';
import { guardarDeclaracionEnNube } from '@/lib/declaraciones-acciones';
import { useDeclaracion } from '@/lib/store';

import type { Credenciales } from './formulario-credenciales';
import type { ResultadoDeclaracion } from '@/lib/tipos';
import type { AlcanceAutorizacion, DiferenciaCasilla } from '@turenta/core';

type Fase = 'confirmar' | 'credenciales' | 'progreso' | 'codigo' | 'listo' | 'error';

interface Respuesta {
  ok?: boolean;
  numeroFormulario?: string;
  diferencias?: DiferenciaCasilla[];
  guardado?: boolean;
  firmada?: boolean;
  presentada?: boolean;
  requiereCodigo?: boolean;
  acuse?: { nombreArchivo: string; contenidoBase64: string } | null;
  presentadaEn?: string | null;
  mensaje?: string;
  detalle?: string;
}

/**
 * Presenta la declaración ante la DIAN: el robot la diligencia, comprueba que
 * la DIAN calcule lo mismo, la firma con la firma electrónica del titular y la
 * presenta. Solo corre con la autorización expresa y la confirmación final.
 */
export function LlevarALaDian({ resultado }: { resultado: ResultadoDeclaracion }) {
  const [abierto, setAbierto] = useState(false);
  const habilitada = useConexionHabilitada();
  const genero = useDeclaracion((s) => s.declarante.genero ?? '');
  const presentacion = useDeclaracion((s) => s.presentacion);
  const actualizar = useDeclaracion((s) => s.actualizarDeclarante);
  if (!habilitada) {
    return null;
  }
  if (presentacion) {
    return (
      <div className="mt-4">
        <Presentada presentacion={presentacion} />
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-3xl border border-primario/30 bg-primario-suave/40 p-5">
      <p className="flex items-center gap-2 font-semibold">
        <FileSignature size={18} className="text-primario" aria-hidden /> Presentar ante la DIAN
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">
        Diligenciamos tu declaración en MUISCA con estas cifras, comprobamos que la DIAN calcule lo mismo,
        la firmamos con tu firma electrónica y la presentamos. Al final te entregamos el acuse.
      </p>
      {!genero && (
        <div className="mt-3">
          <SelectorGenero valor={genero} alCambiar={(g) => actualizar({ genero: g })} etiqueta="Género del titular (casilla 286), falta registrarlo" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={!genero}
        className="mt-3 h-11 w-full cursor-pointer rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40"
      >
        Presentar mi declaración
      </button>
      {abierto && createPortal(<Dialogo resultado={resultado} alCerrar={() => setAbierto(false)} />, document.body)}
    </div>
  );
}

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

function Dialogo({ resultado, alCerrar }: { resultado: ResultadoDeclaracion; alCerrar: () => void }) {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  const titular = declarante.identificacion.replace(/\D/g, '');
  const deOtro = esPropia === false ? `${declarante.nombres} ${declarante.apellidos}`.trim() : null;
  const yaGuardado = useAccesoGuardado(titular);
  const presentar = usePresentacion(resultado, titular, deOtro !== null);
  const { fase, setFase, avance, respuesta, recordar, setRecordar, alcances, enviar } = presentar;

  if (fase === 'confirmar') {
    return (
      <ConfirmarPresentacion
        resumen={{
          anioGravable: resultado.anioGravable,
          titular: deOtro ?? `${declarante.nombres} ${declarante.apellidos}`.trim(),
          identificacion: titular,
          saldoAFavor: resultado.liquidacion.totalSaldoAFavor,
          saldoAPagar: resultado.liquidacion.saldoAPagar,
        }}
        deOtro={deOtro}
        alcances={alcances}
        recordar={recordar}
        alCambiarRecordar={setRecordar}
        alConfirmar={() => (yaGuardado ? void enviar(sinClave(titular)) : setFase('credenciales'))}
        alCancelar={alCerrar}
      />
    );
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal aria-label="Presentar ante la DIAN">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">Presentar ante la DIAN</h2>
          <button type="button" onClick={alCerrar} disabled={fase === 'progreso'} aria-label="Cerrar" className="cursor-pointer rounded-lg p-1.5 text-texto-suave hover:bg-background disabled:opacity-30">
            <X size={18} />
          </button>
        </div>
        {fase === 'credenciales' && (
          <>
            <AvisoTransparencia deOtro={deOtro} />
            <FormularioCredenciales documento={titular} alEnviar={(c) => void enviar(c)} alVolver={() => setFase('confirmar')} />
          </>
        )}
        {fase === 'progreso' && <Progreso avance={avance} />}
        {fase === 'codigo' && <PedirCodigo alEnviar={(codigo) => void enviar(sinClave(titular), codigo)} />}
        {(fase === 'listo' || fase === 'error') && <Desenlace respuesta={respuesta} alCerrar={alCerrar} />}
      </div>
    </div>
  );
}

function sinClave(titular: string): Credenciales {
  return { tipoDocumento: 'CC', numeroDocumento: titular, contrasena: '' };
}

function Desenlace({ respuesta, alCerrar }: { respuesta: Respuesta; alCerrar: () => void }) {
  const presentacion = {
    numeroFormulario: respuesta.numeroFormulario ?? '',
    presentadaEn: respuesta.presentadaEn ?? new Date().toISOString(),
    nombreAcuse: respuesta.acuse?.nombreArchivo ?? '',
  };
  return (
    <div className="pt-5">
      {respuesta.presentada === true && <Presentada presentacion={presentacion} acuse={respuesta.acuse?.contenidoBase64} />}
      {respuesta.presentada !== true && <Incompleta mensaje={mensajeDe(respuesta)} diferencias={respuesta.diferencias ?? []} />}
      {process.env.NODE_ENV !== 'production' && <DetalleTecnico respuesta={respuesta} />}
      <button type="button" onClick={alCerrar} className="mt-4 h-11 w-full cursor-pointer rounded-2xl border border-borde font-semibold">
        Cerrar
      </button>
    </div>
  );
}

function mensajeDe(respuesta: Respuesta): string {
  if (respuesta.firmada === true) {
    return 'Quedó firmada, pero no pudimos presentarla. Entra a MUISCA y pulsa Presentar.';
  }
  if ((respuesta.diferencias ?? []).length > 0) {
    return 'La DIAN calculó distinto: no firmamos ni presentamos nada';
  }
  return respuesta.mensaje ?? 'No pudimos presentar la declaración. No se firmó nada.';
}

/** Solo en desarrollo: lo que vio el robot, para seguir mapeando el portal. */
function DetalleTecnico({ respuesta }: { respuesta: Respuesta }) {
  return (
    <details className="mt-3 text-xs text-texto-suave">
      <summary className="cursor-pointer">Detalle técnico (solo en desarrollo)</summary>
      <pre data-detalle-tecnico className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all">
        {JSON.stringify({ ...respuesta, acuse: respuesta.acuse ? respuesta.acuse.nombreArchivo : null }, null, 1)}
      </pre>
    </details>
  );
}

interface Presentacion {
  fase: Fase;
  setFase: (fase: Fase) => void;
  avance: string;
  respuesta: Respuesta;
  recordar: boolean;
  setRecordar: (valor: boolean) => void;
  alcances: AlcanceAutorizacion[];
  enviar: (credenciales: Credenciales, codigoFirma?: string) => Promise<void>;
}

function usePresentacion(resultado: ResultadoDeclaracion, titular: string, deOtro: boolean): Presentacion {
  const declarante = useDeclaracion((s) => s.declarante);
  const registrar = useDeclaracion((s) => s.registrarPresentacion);
  const recordarBorrador = useDeclaracion((s) => s.registrarBorradorDian);
  const [fase, setFase] = useState<Fase>('confirmar');
  const [recordar, setRecordar] = useState(false);
  const [avance, setAvance] = useState('Preparando tu declaración');
  const [respuesta, setRespuesta] = useState<Respuesta>({});
  const alcances: AlcanceAutorizacion[] = recordar ? ['presentar_declaracion', 'recordar_acceso'] : ['presentar_declaracion'];

  const enviar = async (credenciales: Credenciales, codigoFirma?: string) => {
    setFase('progreso');
    await guardarDeclaracionEnNube();
    const cuerpo = {
      ...credenciales,
      genero: declarante.genero ?? '',
      actividadEconomica: declarante.actividadEconomica || actividadEconomicaSugerida(resultado.casillas) || '0010',
      ...(codigoFirma ? { codigoFirma } : {}),
      titular,
      enNombreDeOtro: deOtro,
      anioGravable: resultado.anioGravable,
      alcancesAceptados: alcances,
      recordarAcceso: recordar,
    };
    const fin = await enviarPresentacion(cuerpo, setAvance);
    setRespuesta(fin);
    if (fin.numeroFormulario) {
      recordarBorrador(fin.numeroFormulario);
    }
    guardarSiQuedoPresentada(fin, registrar);
    setFase(faseFinal(fin));
  };
  return { fase, setFase, avance, respuesta, recordar, setRecordar, alcances, enviar };
}

function faseFinal(fin: Respuesta): Fase {
  if (fin.requiereCodigo === true) {
    return 'codigo';
  }
  return fin.ok === true ? 'listo' : 'error';
}

function guardarSiQuedoPresentada(fin: Respuesta, registrar: (p: { numeroFormulario: string; presentadaEn: string; nombreAcuse: string }) => void): void {
  if (fin.presentada !== true) {
    return;
  }
  registrar({
    numeroFormulario: fin.numeroFormulario ?? '',
    presentadaEn: fin.presentadaEn ?? new Date().toISOString(),
    nombreAcuse: fin.acuse?.nombreArchivo ?? '',
  });
}

async function enviarPresentacion(cuerpo: Record<string, unknown>, alAvanzar: (mensaje: string) => void): Promise<Respuesta> {
  const { finDelFlujo } = await import('@/lib/leer-flujo');
  const r = await fetch('/api/dian/presentar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).catch(() => null);
  return (await finDelFlujo(r, (a) => alAvanzar(a.mensaje))) as Respuesta;
}
