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
  const indice = ORDEN_PASOS.indexOf(e.paso ?? 'exogena');
  return {
    paso: (indice >= 0 ? indice : 0) + 1,
    totalPasos: ORDEN_PASOS.length,
    porcentaje: porcentajeDe(e),
  };
}

/**
 * El progreso mide el AVANCE del flujo: una declaración que llegó al resultado
 * está 100% recorrida aunque le falten soportes — la completitud documental la
 * miden la confiabilidad y las recomendaciones, no esta barra.
 */
function porcentajeDe(e: EstadoWizard): number {
  const documentos = e.documentos ?? [];
  const tieneResultado = e.resultado !== null && e.resultado !== undefined;
  if (tieneResultado && e.paso === 'resultado') {
    return 100;
  }
  const hitos = [
    documentos.some((d) => d.tipo === 'exogena'),
    documentos.some((d) => d.tipo !== 'exogena'),
    e.entrevistaCompleta === true,
    tieneResultado,
  ];
  return hitos.filter(Boolean).length * 20;
}
