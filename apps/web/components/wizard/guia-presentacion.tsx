'use client';

import { useState } from 'react';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';
import { fechaVencimiento, obtenerConstantes } from '@turenta/motor-fiscal';

import type { ResultadoDeclaracion } from '@/lib/tipos';

export function GuiaPresentacion({ resultado }: { resultado: ResultadoDeclaracion }) {
  const declarante = useDeclaracion((s) => s.declarante);
  const vencimiento = calcularVencimiento(declarante.identificacion, resultado.anioGravable);
  const pasos = construirPasos(resultado, vencimiento);
  return (
    <details className="mt-3 rounded-2xl border border-borde bg-card p-4" open>
      <summary className="cursor-pointer font-semibold">Guía: cómo presentarla en la DIAN</summary>
      {vencimiento && (
        <p className="mt-3 rounded-xl bg-alerta-suave px-3 py-2 text-sm">
          📅 Tu fecha límite: <strong>{formatearFecha(vencimiento)}</strong> (cédula terminada en{' '}
          {declarante.identificacion.replace(/\D/g, '').slice(-2)})
        </p>
      )}
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-texto-suave">
        Todo se hace gratis en{' '}
        <a href="https://www.dian.gov.co" target="_blank" rel="noreferrer" className="text-primario underline">
          dian.gov.co
        </a>{' '}
        → Usuario Registrado. La declaración la firmas y presentas tú.
      </p>
    </details>
  );
}

function calcularVencimiento(identificacion: string, anio: number): string | null {
  try {
    return fechaVencimiento(identificacion, obtenerConstantes(anio));
  } catch {
    return null;
  }
}

function construirPasos(resultado: ResultadoDeclaracion, vencimiento: string | null): string[] {
  const base = [
    'Verifica que tu RUT esté actualizado (correo y celular vigentes, responsabilidad 05).',
    'Genera o renueva tu firma electrónica: Usuario Registrado → "Generar o gestionar mi firma electrónica" (llega un código a tu correo).',
    'Entra a "Diligenciar y presentar" → formulario 210 → año gravable ' + String(resultado.anioGravable) + '.',
    'Transcribe casilla por casilla los valores de tu borrador (sección "Casillas del formulario 210" de arriba).',
    'Guarda el borrador en MUISCA, fírmalo con tu contraseña de firma electrónica y preséntalo.',
  ];
  const pago =
    resultado.liquidacion.saldoAPagar > 0
      ? `Genera el recibo 490 y paga ${formatearPesos(resultado.liquidacion.saldoAPagar)} por PSE o en banco${vencimiento ? ` antes del ${formatearFecha(vencimiento)}` : ''}.`
      : 'No tienes saldo a pagar: guarda el PDF con marca "Presentado". Si quieres tu saldo a favor en efectivo, puedes solicitar devolución ante la DIAN.';
  return [...base, pago];
}

function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(dia)} de ${meses[Number(mes) - 1] ?? mes} de ${anio ?? ''}`;
}

export function BotonDescargarBorrador({ resultado }: { resultado: ResultadoDeclaracion }) {
  const declarante = useDeclaracion((s) => s.declarante);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listo = declarante.identificacion.replace(/\D/g, '').length >= 2;

  const descargar = async () => {
    setDescargando(true);
    setError(null);
    const fallo = await descargarPdf(declarante, resultado);
    setError(fallo);
    setDescargando(false);
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void descargar()}
        disabled={!listo || descargando}
        className="h-13 w-full rounded-2xl bg-primario py-3.5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {descargando ? 'Generando PDF…' : '⬇ Descargar borrador 210 (PDF)'}
      </button>
      {!listo && (
        <p className="mt-1 text-center text-xs text-texto-suave">
          Completa tu cédula en el paso Revisión para descargar.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-alerta-suave px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

async function descargarPdf(
  declarante: { nombres: string; apellidos: string; identificacion: string },
  resultado: ResultadoDeclaracion,
): Promise<string | null> {
  try {
    return await pedirYDescargar(declarante, resultado);
  } catch {
    return 'Error de conexión al generar el PDF.';
  }
}

async function pedirYDescargar(
  declarante: { nombres: string; apellidos: string; identificacion: string },
  resultado: ResultadoDeclaracion,
): Promise<string | null> {
  const respuesta = await fetch('/api/borrador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ declarante, resultado }),
  });
  if (!respuesta.ok) {
    return 'No se pudo generar el PDF. Verifica tus datos.';
  }
  abrirDescarga(await respuesta.blob(), `borrador-210-ag${String(resultado.anioGravable)}.pdf`);
  return null;
}

function abrirDescarga(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
