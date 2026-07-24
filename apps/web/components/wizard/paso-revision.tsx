'use client';

import { useState } from 'react';

import { DatosDeclarante } from './datos-declarante';
import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { RespuestasEntrevista, ResultadoDeclaracion } from '@/lib/tipos';
import type { InsumosPerfil } from '@turenta/core';

const CAMPOS_EDITABLES: { campo: keyof RespuestasEntrevista; etiqueta: string }[] = [
  { campo: 'mesesConRelacionLaboral', etiqueta: 'Meses con relación laboral en 2025' },
  { campo: 'dependientesAdicionales336', etiqueta: 'Dependientes económicos (máx. 4)' },
  { campo: 'pagosMedicinaPrepagadaConfirmados', etiqueta: 'Medicina prepagada pagada en 2025 ($)' },
  { campo: 'interesesVivienda', etiqueta: 'Intereses de crédito de vivienda ($)' },
  { campo: 'interesesIcetex', etiqueta: 'Intereses ICETEX ($)' },
  { campo: 'gmfTotalPagado', etiqueta: 'GMF (4×1000) total pagado ($)' },
  { campo: 'rendimientosAdicionalesConComponente', etiqueta: 'Otros rendimientos financieros ($)' },
  { campo: 'rendimientosSinComponente', etiqueta: 'Rendimientos de cesantías ($)' },
  { campo: 'deudas', etiqueta: 'Deudas al 31 de diciembre ($)' },
  { campo: 'declaracionesPrevias', etiqueta: 'Declaraciones presentadas antes' },
  { campo: 'impuestoNetoAnioAnterior', etiqueta: 'Impuesto neto del año anterior ($)' },
];

export function PasoRevision() {
  const documentos = useDeclaracion((s) => s.documentos);
  const [error, setError] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);

  const calcular = async () => {
    setCalculando(true);
    setError(null);
    const resultado = await liquidar();
    if ('error' in resultado) {
      setError(resultado.error);
    } else {
      useDeclaracion.getState().guardarResultado(resultado);
      useDeclaracion.getState().irAPaso('resultado');
    }
    setCalculando(false);
  };

  return (
    <section aria-label="Revisión">
      <h2 className="text-2xl font-bold">Revisa antes de calcular</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Estos son los datos que usará el motor. Corrige lo que necesites — tú tienes la última palabra.
      </p>
      <p className="mt-3 rounded-xl bg-primario-suave px-3 py-2 text-sm">
        📄 {documentos.length} documento(s) procesado(s) · usa el paso Documentos para cambiarlos
      </p>
      <AvisosDeCompletitud />
      <DatosDeclarante />
      <FormularioRespuestas />
      <DependienteToggle />
      <ListaActivos />
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-alerta-suave px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void calcular()}
        disabled={calculando}
        className="mt-6 h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {calculando ? 'Calculando…' : 'Calcular mi declaración'}
      </button>
      <p className="mt-2 text-center text-xs text-texto-suave">
        El cálculo lo hace un motor determinista auditado — la IA no toca los números.
      </p>
    </section>
  );
}

/** Guardas de calidad: exógena de otra persona o cálculo sin certificados de ingresos. */
function AvisosDeCompletitud() {
  const documentos = useDeclaracion((s) => s.documentos);
  const declarante = useDeclaracion((s) => s.declarante);
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  const avisos: string[] = [];
  const cedulaExogena = exogena?.tipo === 'exogena' ? (exogena.exogena.identificacionConsultante ?? '') : '';
  const cedulaTitular = declarante.identificacion.replace(/\D/g, '');
  if (cedulaExogena && cedulaTitular && cedulaExogena !== cedulaTitular) {
    avisos.push(`La exógena subida es de la cédula ${cedulaExogena}, no del titular (${cedulaTitular}). El resultado será incorrecto.`);
  }
  const tiene220 = documentos.some((d) => d.tipo === 'certificado_220');
  const reportaIngresos = exogena?.tipo === 'exogena' && exogena.exogena.topes.ingresos > 0;
  if (reportaIngresos && !tiene220) {
    avisos.push('La exógena reporta ingresos, pero no has subido ningún certificado 220 de tus empleadores: los ingresos y retenciones de trabajo quedarán en $0 y el cálculo estará incompleto.');
  }
  if (avisos.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 space-y-2">
      {avisos.map((aviso) => (
        <p key={aviso} role="alert" className="rounded-xl bg-alerta-suave px-3 py-2 text-sm text-error">
          ⚠️ {aviso}
        </p>
      ))}
    </div>
  );
}

function FormularioRespuestas() {
  const respuestas = useDeclaracion((s) => s.respuestas);
  const actualizarRespuestas = useDeclaracion((s) => s.actualizarRespuestas);
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {CAMPOS_EDITABLES.map(({ campo, etiqueta }) => (
        <label key={campo} className="block rounded-2xl border border-borde bg-card p-3">
          <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={Number(respuestas[campo]) || 0}
            onChange={(e) => actualizarRespuestas({ [campo]: Number(e.target.value) || 0 })}
            className="mt-1 w-full bg-transparent font-mono text-base outline-none"
          />
        </label>
      ))}
    </div>
  );
}

function DependienteToggle() {
  const respuestas = useDeclaracion((s) => s.respuestas);
  const actualizarRespuestas = useDeclaracion((s) => s.actualizarRespuestas);
  return (
    <label className="mt-3 flex items-center justify-between rounded-2xl border border-borde bg-card p-4">
      <span className="text-sm font-medium">¿Aplicas la deducción del 10% por dependientes (art. 387)?</span>
      <input
        type="checkbox"
        checked={respuestas.tieneDependiente387}
        onChange={(e) => actualizarRespuestas({ tieneDependiente387: e.target.checked })}
        className="h-5 w-5 accent-[--primario]"
      />
    </label>
  );
}

function ListaActivos() {
  const respuestas = useDeclaracion((s) => s.respuestas);
  const eliminarActivoManual = useDeclaracion((s) => s.eliminarActivoManual);
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');

  const agregar = () => {
    const numero = Number(valor);
    if (!descripcion.trim() || !Number.isFinite(numero) || numero <= 0) {
      return;
    }
    useDeclaracion.getState().agregarActivoManual(descripcion.trim(), numero);
    setDescripcion('');
    setValor('');
  };

  return (
    <div className="mt-4 rounded-2xl border border-borde bg-card p-4">
      <p className="font-semibold">Tus bienes al 31 de diciembre</p>
      <p className="text-xs text-texto-suave">
        Además de los saldos bancarios de tus certificados: bienes personales, vehículo, inmuebles, CxC…
      </p>
      <ul className="mt-2 space-y-1">
        {respuestas.activosManuales.map((activo, indice) => (
          <li key={`${activo.descripcion}-${indice}`} className="flex items-center justify-between text-sm">
            <span>{activo.descripcion}</span>
            <span className="flex items-center gap-2 font-mono">
              {formatearPesos(activo.valor)}
              <button
                type="button"
                onClick={() => eliminarActivoManual(indice)}
                aria-label={`Eliminar ${activo.descripcion}`}
                className="text-texto-suave hover:text-error"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (ej: vehículo)"
          className="h-11 flex-1 rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
        />
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          type="number"
          inputMode="numeric"
          placeholder="Valor ($)"
          className="h-11 w-full rounded-xl border border-borde bg-background px-3 font-mono text-sm outline-none focus:border-primario sm:w-40"
        />
        <button
          type="button"
          onClick={agregar}
          className="h-11 rounded-xl bg-primario-suave px-4 text-sm font-semibold text-primario"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

async function liquidar(): Promise<ResultadoDeclaracion | { error: string }> {
  const estado = useDeclaracion.getState();
  const exogena = estado.documentos.find((d) => d.tipo === 'exogena');
  const insumos: InsumosPerfil = {
    anioGravable: 2025,
    exogena: exogena?.tipo === 'exogena' ? exogena.exogena : { anioGravable: 2025, topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 }, filas: [] },
    certificados220: estado.documentos.flatMap((d) => (d.tipo === 'certificado_220' ? [d.datos] : [])),
    certificadosBancarios: estado.documentos.flatMap((d) => (d.tipo === 'certificado_bancario' ? [d.datos] : [])),
    respuestas: estado.respuestas,
  };
  try {
    return await enviarLiquidacion(insumos);
  } catch {
    return { error: 'Error de conexión al calcular.' };
  }
}

async function enviarLiquidacion(insumos: InsumosPerfil): Promise<ResultadoDeclaracion | { error: string }> {
  const respuesta = await fetch('/api/liquidar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insumos),
  });
  const cuerpo = (await respuesta.json()) as { resultado?: ResultadoDeclaracion; error?: string };
  if (!respuesta.ok || !cuerpo.resultado) {
    return { error: cuerpo.error ?? 'No se pudo calcular' };
  }
  return cuerpo.resultado;
}
