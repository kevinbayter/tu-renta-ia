/**
 * Progreso honesto de una declaración sobre los 5 pasos reales del wizard
 * (Exógena → Documentos → Entrevista → Revisión → Resultado), derivado del
 * estado guardado — nunca un porcentaje decorativo.
 */

export interface ProgresoDeclaracion {
  /** Paso actual (1..5) según dónde quedó el usuario. */
  paso: number;
  totalPasos: number;
  /** 0..100: hitos completados (exógena, certificados, entrevista, cálculo, final). */
  porcentaje: number;
}

interface EstadoWizard {
  paso?: string;
  documentos?: { tipo?: string }[];
  entrevistaCompleta?: boolean;
  resultado?: unknown;
}

const ORDEN_PASOS = ['exogena', 'documentos', 'entrevista', 'revision', 'resultado'];

export function progresoDeclaracion(estado: unknown): ProgresoDeclaracion {
  const e = (typeof estado === 'object' && estado !== null ? estado : {}) as EstadoWizard;
  const documentos = e.documentos ?? [];
  const hayExogena = documentos.some((d) => d.tipo === 'exogena');
  const hayCertificados = documentos.some((d) => d.tipo !== 'exogena');
  const tieneResultado = e.resultado !== null && e.resultado !== undefined;
  const hitos = [
    hayExogena,
    hayCertificados,
    e.entrevistaCompleta === true,
    tieneResultado,
    tieneResultado && e.paso === 'resultado',
  ];
  const indice = ORDEN_PASOS.indexOf(e.paso ?? 'exogena');
  return {
    paso: (indice >= 0 ? indice : 0) + 1,
    totalPasos: ORDEN_PASOS.length,
    porcentaje: hitos.filter(Boolean).length * 20,
  };
}
