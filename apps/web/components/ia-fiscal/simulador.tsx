'use client';

import { Calculator } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { formatearPesos } from '@/lib/tipos';

const CAMPOS = [
  { campo: 'ingresosLaborales', etiqueta: 'Ingresos laborales brutos del año ($)', obligatorio: true },
  { campo: 'aportesSaludPension', etiqueta: 'Aportes a salud + pensión del año ($)', obligatorio: false },
  { campo: 'retenciones', etiqueta: 'Retenciones que te practicaron ($)', obligatorio: false },
  { campo: 'dependientes', etiqueta: 'Dependientes económicos (0 a 4)', obligatorio: false },
  { campo: 'medicinaPrepagada', etiqueta: 'Medicina prepagada pagada ($)', obligatorio: false },
  { campo: 'interesesVivienda', etiqueta: 'Intereses de vivienda pagados ($)', obligatorio: false },
] as const;

type Valores = Record<(typeof CAMPOS)[number]['campo'], string>;

interface Estimacion {
  rentaLiquidaGravable: number;
  impuestoNeto: number;
  saldoAFavor: number;
  saldoAPagar: number;
}

const VACIOS: Valores = {
  ingresosLaborales: '',
  aportesSaludPension: '',
  retenciones: '',
  dependientes: '',
  medicinaPrepagada: '',
  interesesVivienda: '',
};

/** Estimación rápida: 6 datos → motor determinista. La IA no toca los números. */
export function Simulador() {
  const [valores, setValores] = useState<Valores>(VACIOS);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);
  const [calculando, setCalculando] = useState(false);

  const simular = async () => {
    setCalculando(true);
    setEstimacion(await pedirEstimacion(valores));
    setCalculando(false);
  };

  return (
    <section className="rounded-3xl border border-borde bg-card p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Calculator size={17} className="text-primario" aria-hidden /> Simular mi declaración
      </h2>
      <p className="mt-1 text-xs text-texto-suave">
        Estimación con el motor determinista y la tabla del art. 241 (UVT 2025). Para el valor real, haz tu
        declaración completa con documentos.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CAMPOS.map(({ campo, etiqueta }) => (
          <label key={campo} className="block">
            <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
            <input
              value={valores[campo]}
              onChange={(e) => setValores({ ...valores, [campo]: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric"
              className="mt-1 h-10 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void simular()}
        disabled={calculando || !valores.ingresosLaborales}
        className="mt-4 h-11 w-full rounded-xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {calculando ? 'Calculando…' : 'Estimar mi declaración'}
      </button>
      {estimacion && <ResultadoEstimacion estimacion={estimacion} />}
    </section>
  );
}

function ResultadoEstimacion({ estimacion }: { estimacion: Estimacion }) {
  const aFavor = estimacion.saldoAFavor > 0;
  return (
    <div className="mt-4 rounded-2xl bg-primario-suave p-4">
      <p className="text-xs text-texto-suave">Resultado estimado</p>
      <p className="mt-1 text-2xl font-bold text-primario">
        {aFavor ? `${formatearPesos(estimacion.saldoAFavor)} a tu favor` : `${formatearPesos(estimacion.saldoAPagar)} a pagar`}
      </p>
      <dl className="mt-3 space-y-1 text-sm">
        <Fila etiqueta="Renta líquida gravable" valor={formatearPesos(estimacion.rentaLiquidaGravable)} />
        <Fila etiqueta="Impuesto neto de renta" valor={formatearPesos(estimacion.impuestoNeto)} />
      </dl>
      <Link href="/declaracion" className="mt-3 inline-block text-sm font-semibold text-primario underline">
        Hacer mi declaración real con documentos →
      </Link>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-texto-suave">{etiqueta}</dt>
      <dd className="font-mono font-medium">{valor}</dd>
    </div>
  );
}

async function pedirEstimacion(valores: Valores): Promise<Estimacion | null> {
  const cuerpo = Object.fromEntries(Object.entries(valores).map(([clave, v]) => [clave, Number(v || '0')]));
  const respuesta = await fetch('/api/simulador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).catch(() => null);
  if (!respuesta?.ok) {
    return null;
  }
  const json = (await respuesta.json()) as { estimacion: Estimacion };
  return json.estimacion;
}
