'use client';

import { detectarCasosNoSoportados } from '@turenta/core';
import { ChevronRight, FileText, MoreVertical, RotateCcw, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DialogoConfirmar } from '@/components/ui/dialogo-confirmar';
import { guardarDeclaracionEnNube } from '@/lib/declaraciones-acciones';
import { useSesionCliente } from '@/lib/sesion-cliente';
import { useDeclaracion } from '@/lib/store';

const ANIO = 2025;

/** Encabezado del wizard: breadcrumb, título con estado honesto y acciones de guardado. */
export function EncabezadoWizard() {
  const sesion = useSesionCliente();
  const declarante = useDeclaracion((s) => s.declarante);
  return (
    <header>
      <Migas titular={declarante.nombres ? `${declarante.nombres} ${declarante.apellidos}`.trim() : ''} />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold">
            Declaración de renta {ANIO} <InsigniaProgreso />
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Año gravable {ANIO}
            {declarante.identificacion && ` · Cédula ${declarante.identificacion}`}
          </p>
        </div>
        {sesion.fase === 'activa' && <Acciones />}
        {sesion.fase === 'anonimo' && <SesionExpirada />}
      </div>
    </header>
  );
}

function Migas({ titular }: { titular: string }) {
  return (
    <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-xs text-texto-suave">
      <Link href="/declaraciones" className="transition hover:text-primario">
        Mis declaraciones
      </Link>
      <ChevronRight size={13} aria-hidden />
      <span className="font-medium text-foreground">
        Declaración {ANIO}
        {titular && ` — ${titular}`}
      </span>
    </nav>
  );
}

function InsigniaProgreso() {
  const paso = useDeclaracion((s) => s.paso);
  const resultado = useDeclaracion((s) => s.resultado);
  const respuestas = useDeclaracion((s) => s.respuestas);
  if (paso === 'resultado' && resultado !== null && detectarCasosNoSoportados(respuestas).length > 0) {
    return (
      <span className="rounded-lg bg-alerta-suave px-2.5 py-1 text-xs font-semibold text-alerta">
        Incompleta — requiere contador
      </span>
    );
  }
  const completada = paso === 'resultado' && resultado !== null;
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
        completada ? 'bg-exito-suave text-exito' : 'bg-alerta-suave text-alerta'
      }`}
    >
      {completada ? 'Completada' : 'En progreso'}
    </span>
  );
}

function Acciones() {
  const router = useRouter();
  const [aviso, setAviso] = useState<string | null>(null);
  const guardarYSalir = async () => {
    const resultado = await guardarDeclaracionEnNube();
    if (resultado.ok) {
      router.push('/panel');
      return;
    }
    setAviso(resultado.mensaje);
    setTimeout(() => setAviso(null), 4000);
  };
  return (
    <div className="flex shrink-0 items-center gap-2">
      {aviso && <span className="max-w-52 text-xs text-alerta">{aviso}</span>}
      <button
        type="button"
        onClick={() => void guardarYSalir()}
        className="flex items-center gap-2 rounded-xl border border-borde bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primario/40"
      >
        <Save size={15} aria-hidden /> Guardar y salir
      </button>
      <MenuAcciones />
    </div>
  );
}

function MenuAcciones() {
  const router = useRouter();
  const reiniciar = useDeclaracion((s) => s.reiniciar);
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-label="Más acciones" className="rounded-xl border border-borde bg-card p-2.5 text-texto-suave transition hover:border-primario/40">
        <MoreVertical size={16} />
      </button>
      {abierto && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setAbierto(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-borde bg-card p-1.5 shadow-xl">
            <Link href="/declaraciones" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-background">
              <FileText size={15} className="text-texto-suave" aria-hidden /> Mis declaraciones
            </Link>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setConfirmando(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-error transition hover:bg-alerta-suave"
            >
              <RotateCcw size={15} aria-hidden /> Empezar de cero
            </button>
          </div>
        </>
      )}
      {confirmando && (
        <DialogoConfirmar
          titulo="¿Empezar esta declaración de cero?"
          descripcion="Se borra el avance de ESTE navegador (documentos cargados, entrevista y resultado). Lo que ya guardaste en la nube no se toca."
          textoConfirmar="Sí, empezar de cero"
          alConfirmar={() => {
            reiniciar();
            setConfirmando(false);
            router.push('/declaraciones');
          }}
          alCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function SesionExpirada() {
  return (
    <p className="rounded-xl border border-alerta/40 bg-alerta-suave px-3 py-2 text-xs text-alerta">
      Tu sesión expiró.{' '}
      <Link href="/ingresar?siguiente=/declaracion" className="font-semibold underline">
        Ingresa de nuevo
      </Link>{' '}
      para continuar — tu avance sigue en este navegador.
    </p>
  );
}
