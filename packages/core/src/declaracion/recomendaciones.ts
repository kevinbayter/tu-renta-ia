import { documentosEsperados } from '../exogena/documentos-esperados';
import { saldoAFavorAnterior } from '../exogena/interpretar';

import type { ExogenaParseada } from '../exogena/tipos';

/**
 * Recomendaciones y % de confiabilidad 100% deterministas: cada regla es
 * verificable y el puntaje es 100 menos las penalizaciones de lo incumplido.
 * Nada de números decorativos.
 */

export interface Recomendacion {
  nivel: 'critica' | 'mejora' | 'sugerencia';
  texto: string;
}

export interface EvaluacionDeclaracion {
  confiabilidad: number;
  recomendaciones: Recomendacion[];
}

interface DocumentoEstado {
  tipo?: string;
  exogena?: ExogenaParseada;
  pasadasCoinciden?: boolean;
  nombreArchivo?: string;
  datos?: { nitRetenedor?: string };
}

interface EstadoWizard {
  documentos?: DocumentoEstado[];
  entrevistaCompleta?: boolean;
  resultado?: unknown;
  declarante?: { identificacion?: string };
  respuestas?: { anticipoLiquidadoAnioAnterior?: number; tieneDependiente387?: boolean };
}

interface Hallazgo {
  recomendacion: Recomendacion;
  penalizacion: number;
}

const ORDEN_NIVEL: Record<Recomendacion['nivel'], number> = { critica: 0, mejora: 1, sugerencia: 2 };

export function evaluarDeclaracion(estado: unknown): EvaluacionDeclaracion {
  const e = (typeof estado === 'object' && estado !== null ? estado : {}) as EstadoWizard;
  const reglas = [
    reglaSinExogena,
    reglaExogenaAjena,
    reglaCertificadosFaltantes,
    reglaDiscrepancias,
    reglaEntrevista,
    reglaSinResultado,
    reglaDobleConteo,
    reglaDependientes,
  ];
  const hallazgos = reglas.map((regla) => regla(e)).filter((h): h is Hallazgo => h !== null);
  const penalizacion = hallazgos.reduce((acc, h) => acc + h.penalizacion, 0);
  return {
    confiabilidad: Math.max(0, Math.min(100, 100 - penalizacion)),
    recomendaciones: hallazgos
      .map((h) => h.recomendacion)
      .sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]),
  };
}

function exogenaDe(e: EstadoWizard): ExogenaParseada | null {
  const doc = (e.documentos ?? []).find((d) => d.tipo === 'exogena');
  return doc?.exogena ?? null;
}

function reglaSinExogena(e: EstadoWizard): Hallazgo | null {
  if (exogenaDe(e)) {
    return null;
  }
  return {
    recomendacion: { nivel: 'critica', texto: 'Sube tu exógena de la DIAN: es la base de la precarga y de todas las verificaciones.' },
    penalizacion: 40,
  };
}

function reglaExogenaAjena(e: EstadoWizard): Hallazgo | null {
  const exogena = exogenaDe(e);
  const cedulaExogena = exogena?.identificacionConsultante ?? '';
  const cedulaTitular = (e.declarante?.identificacion ?? '').replace(/\D/g, '');
  if (!exogena || !cedulaExogena || !cedulaTitular || cedulaExogena === cedulaTitular) {
    return null;
  }
  return {
    recomendacion: { nivel: 'critica', texto: `La exógena cargada es de la cédula ${cedulaExogena}, no del titular: el resultado será incorrecto.` },
    penalizacion: 50,
  };
}

function reglaCertificadosFaltantes(e: EstadoWizard): Hallazgo | null {
  const exogena = exogenaDe(e);
  if (!exogena) {
    return null;
  }
  const faltantes = documentosEsperados(exogena)
    .filter((esperado) => !esperado.opcional && esperado.tipo === 'certificado_220')
    .filter((esperado) => !hay220Para(e, esperado.nit));
  if (faltantes.length === 0) {
    return null;
  }
  const nombres = faltantes.map((f) => f.nombre.split(/\s+/).slice(0, 2).join(' ')).join(', ');
  return {
    recomendacion: { nivel: 'mejora', texto: `Tienes ${String(faltantes.length)} certificado(s) 220 pendiente(s) según tu exógena: ${nombres}.` },
    penalizacion: Math.min(15 * faltantes.length, 30),
  };
}

function hay220Para(e: EstadoWizard, nit: string): boolean {
  const objetivo = nit.replace(/\D/g, '');
  return (e.documentos ?? [])
    .filter((d) => d.tipo === 'certificado_220')
    .some((d) => coincideNit(objetivo, (d.datos?.nitRetenedor ?? '').replace(/\D/g, '')));
}

function coincideNit(a: string, b: string): boolean {
  return a !== '' && b !== '' && (a.startsWith(b) || b.startsWith(a));
}

function reglaDiscrepancias(e: EstadoWizard): Hallazgo | null {
  const conDiferencias = (e.documentos ?? []).filter((d) => d.pasadasCoinciden === false);
  if (conDiferencias.length === 0) {
    return null;
  }
  return {
    recomendacion: {
      nivel: 'mejora',
      texto: `La doble lectura de IA marcó diferencias en ${String(conDiferencias.length)} documento(s): compáralos con el original en el paso de documentos.`,
    },
    penalizacion: 10,
  };
}

function reglaEntrevista(e: EstadoWizard): Hallazgo | null {
  if (e.entrevistaCompleta === true) {
    return null;
  }
  return {
    recomendacion: { nivel: 'mejora', texto: 'Completa la entrevista: ahí se capturan tus deducciones (dependientes, salud, GMF, patrimonio).' },
    penalizacion: 15,
  };
}

function reglaSinResultado(e: EstadoWizard): Hallazgo | null {
  if (e.resultado !== null && e.resultado !== undefined) {
    return null;
  }
  return {
    recomendacion: { nivel: 'mejora', texto: 'Aún no has calculado el resultado: ve a Revisión y presiona Calcular.' },
    penalizacion: 10,
  };
}

function reglaDobleConteo(e: EstadoWizard): Hallazgo | null {
  const exogena = exogenaDe(e);
  const anticipo = e.respuestas?.anticipoLiquidadoAnioAnterior ?? 0;
  if (!exogena || anticipo === 0 || anticipo !== saldoAFavorAnterior(exogena)) {
    return null;
  }
  return {
    recomendacion: {
      nivel: 'critica',
      texto: 'El "anticipo liquidado" es idéntico al saldo a favor que ya trae tu exógena: se restaría dos veces. Déjalo en $0 en Revisión si es el mismo valor.',
    },
    penalizacion: 20,
  };
}

function reglaDependientes(e: EstadoWizard): Hallazgo | null {
  if (e.respuestas?.tieneDependiente387 === true) {
    return null;
  }
  return {
    recomendacion: {
      nivel: 'sugerencia',
      texto: 'Si alguien depende económicamente de ti (hijos, padres), la deducción por dependientes puede bajar tu impuesto: confírmalo en la entrevista.',
    },
    penalizacion: 0,
  };
}
