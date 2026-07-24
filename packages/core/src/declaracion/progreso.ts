/**
 * Progreso honesto de una declaración sobre los 4 pasos reales del wizard
 * (Documentos → Entrevista → Revisión → Resultado), derivado del estado
 * guardado — nunca un porcentaje decorativo.
 */

export interface ProgresoDeclaracion {
  /** Paso actual (1..4) según dónde quedó el usuario. */
  paso: number;
  totalPasos: number;
  /** 0..100: hitos completados (documentos, entrevista, cálculo, llegada al final). */
  porcentaje: number;
}

interface EstadoWizard {
  paso?: string;
  documentos?: unknown[];
  entrevistaCompleta?: boolean;
  resultado?: unknown;
}

const ORDEN_PASOS = ['documentos', 'entrevista', 'revision', 'resultado'];

export function progresoDeclaracion(estado: unknown): ProgresoDeclaracion {
  const e = (typeof estado === 'object' && estado !== null ? estado : {}) as EstadoWizard;
  const tieneResultado = e.resultado !== null && e.resultado !== undefined;
  const hitos = [
    (e.documentos?.length ?? 0) > 0,
    e.entrevistaCompleta === true,
    tieneResultado,
    tieneResultado && e.paso === 'resultado',
  ];
  const indice = ORDEN_PASOS.indexOf(e.paso ?? 'documentos');
  return {
    paso: (indice >= 0 ? indice : 0) + 1,
    totalPasos: ORDEN_PASOS.length,
    porcentaje: hitos.filter(Boolean).length * 25,
  };
}
