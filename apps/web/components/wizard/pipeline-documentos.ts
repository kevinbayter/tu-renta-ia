'use client';

import { mesesTrabajadosSegunCertificados, precargarDesdeExogena } from '@turenta/core';
import { create } from 'zustand';

import { useDeclaracion } from '@/lib/store';

import type { DocumentoProcesado } from '@/lib/tipos';

/**
 * Pipeline compartido de subida de documentos (paso Exógena y paso Documentos):
 * mismo endpoint, misma clasificación por IA, misma precarga determinista.
 */

export const ANIO_GRAVABLE = 2025;

export const NOMBRES_TIPO: Record<DocumentoProcesado['tipo'], string> = {
  exogena: 'Exógena DIAN',
  certificado_220: 'Certificado 220',
  certificado_bancario: 'Certificado bancario',
  medicina_prepagada: 'Medicina prepagada',
  declaracion_anterior: 'Declaración del año anterior',
  otro: 'Otro documento',
};

interface EstadoSubidas {
  enCurso: number;
  iniciar: () => void;
  terminar: () => void;
}

/** Subidas en curso (efímero, NO persistido): bloquea "Continuar" mientras la IA lee. */
export const useSubidas = create<EstadoSubidas>((set) => ({
  enCurso: 0,
  iniciar: () => set((s) => ({ enCurso: s.enCurso + 1 })),
  terminar: () => set((s) => ({ enCurso: Math.max(0, s.enCurso - 1) })),
}));

export async function subirArchivo(archivo: File): Promise<DocumentoProcesado | { error: string }> {
  useSubidas.getState().iniciar();
  try {
    return await enviarArchivo(archivo);
  } catch {
    return { error: 'Error de conexión. Intenta de nuevo.' };
  } finally {
    useSubidas.getState().terminar();
  }
}

/** Lo reportado en los documentos no se pregunta: se precarga y la entrevista solo lo confirma. */
export function aplicarPrecarga(doc: DocumentoProcesado): void {
  if (doc.tipo === 'exogena') {
    const precarga = precargarDesdeExogena(doc.exogena);
    useDeclaracion.getState().actualizarRespuestas(precarga.respuestas);
    return;
  }
  if (doc.tipo === 'declaracion_anterior') {
    precargarDesdeDeclaracionAnterior(doc.datos);
    return;
  }
  precargarMesesDesde220(doc);
}

/**
 * La declaración del año pasado responde sola lo que el usuario no recuerda:
 * patrimonio líquido (casilla 31), impuesto neto (126) y anticipo (133).
 */
function precargarDesdeDeclaracionAnterior(datos: {
  patrimonioLiquido: number;
  impuestoNetoRenta: number;
  anticipoAnioSiguiente: number;
}): void {
  const estado = useDeclaracion.getState();
  estado.actualizarRespuestas({
    patrimonioLiquidoAnterior: datos.patrimonioLiquido,
    impuestoNetoAnioAnterior: datos.impuestoNetoRenta,
    anticipoLiquidadoAnioAnterior: datos.anticipoAnioSiguiente,
    declaracionesPrevias: Math.max(1, estado.respuestas.declaracionesPrevias),
  });
}

/** Los meses trabajados salen del "período de la certificación" de los 220 (unión entre empleadores). */
function precargarMesesDesde220(doc: DocumentoProcesado): void {
  if (doc.tipo !== 'certificado_220') {
    return;
  }
  const certificados = useDeclaracion
    .getState()
    .documentos.filter((d): d is Extract<DocumentoProcesado, { tipo: 'certificado_220' }> => d.tipo === 'certificado_220');
  const meses = mesesTrabajadosSegunCertificados(certificados.map((d) => d.datos), ANIO_GRAVABLE);
  if (meses !== null) {
    useDeclaracion.getState().actualizarRespuestas({ mesesConRelacionLaboral: meses });
  }
}

async function enviarArchivo(archivo: File): Promise<DocumentoProcesado | { error: string }> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await fetch('/api/documentos', { method: 'POST', body: formData });
  const cuerpo = (await respuesta.json()) as Record<string, unknown>;
  if (!respuesta.ok) {
    return { error: String(cuerpo.error ?? 'No se pudo procesar') };
  }
  return { id: crypto.randomUUID(), nombreArchivo: archivo.name, ...cuerpo } as DocumentoProcesado;
}
