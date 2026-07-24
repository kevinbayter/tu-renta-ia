'use client';

import { useState } from 'react';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

/** Campos de una sola cifra que se pueden digitar sin subir certificado. */
export interface CampoManual {
  campo: 'pagosMedicinaPrepagadaConfirmados' | 'interesesVivienda' | 'interesesIcetex';
  etiqueta: string;
}

export function ValoresManuales({ campos }: { campos: CampoManual[] }) {
  const respuestas = useDeclaracion((s) => s.respuestas);
  const [abierto, setAbierto] = useState(false);
  const hayValores = campos.some(({ campo }) => respuestas[campo] > 0);
  if (!abierto && !hayValores) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-2 text-xs font-semibold text-primario underline"
      >
        ¿Sin certificado? Ingresa el valor manualmente
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      {campos.map((campo) => (
        <CampoValorManual key={campo.campo} definicion={campo} valor={respuestas[campo.campo]} />
      ))}
    </div>
  );
}

function CampoValorManual({ definicion, valor }: { definicion: CampoManual; valor: number }) {
  const actualizarRespuestas = useDeclaracion((s) => s.actualizarRespuestas);
  const [editando, setEditando] = useState(false);
  if (!editando && valor > 0) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-exito">✓</span>
        <span className="text-texto-suave">{definicion.etiqueta}:</span>
        <span className="font-mono font-semibold">{formatearPesos(valor)}</span>
        <button type="button" onClick={() => setEditando(true)} className="font-semibold text-primario underline">
          editar
        </button>
      </p>
    );
  }
  return (
    <label className="block max-w-xs">
      <span className="text-xs font-medium text-texto-suave">{definicion.etiqueta}</span>
      <input
        value={valor === 0 ? '' : String(valor)}
        onChange={(e) => actualizarRespuestas({ [definicion.campo]: aPesos(e.target.value) })}
        onBlur={() => setEditando(false)}
        placeholder="Valor en pesos, sin puntos"
        inputMode="numeric"
        className="mt-1 h-10 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
      />
    </label>
  );
}

function aPesos(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  return digitos === '' ? 0 : Number(digitos);
}
