import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Checklist de documentos que el usuario debería subir, derivada de lo que los
 * terceros reportaron en su exógena (así funciona la guía tipo referencia). Los
 * empleadores reportan con concepto 2276 (→ certificado 220); las entidades
 * financieras con saldos/rendimientos (→ certificado tributario del banco).
 */

export interface DocumentoEsperado {
  tipo: 'certificado_220' | 'certificado_bancario';
  nit: string;
  nombre: string;
  opcional: boolean;
  motivo: string;
}

const DETALLE_LABORAL = /concepto: 2276/;
const DETALLE_FINANCIERO = /saldo cuentas bancarias|intereses y rendimientos financieros/;
const DETALLE_INVERSION = /saldo inversi|cartera colectiva|rendimientos pagados/;
const DETALLE_MOVIMIENTOS = /movimientos en cuentas/;

export function documentosEsperados(exogena: ExogenaParseada): DocumentoEsperado[] {
  const grupos = new Map<string, FilaExogena[]>();
  const relevantes = exogena.filas.filter((fila) => !esInformanteExcluido(fila, exogena));
  relevantes.forEach((fila) => agruparPorNit(grupos, fila));
  return [...grupos.values()]
    .map(esperadoDelInformante)
    .filter((d): d is DocumentoEsperado => d !== null)
    .sort(compararEsperados);
}

/** La DIAN (facturación electrónica) y el propio declarante no emiten certificados. */
function esInformanteExcluido(fila: FilaExogena, exogena: ExogenaParseada): boolean {
  if (fila.nombreInformante.toUpperCase().includes('DIRECCION DE IMPUESTOS')) {
    return true;
  }
  const consultante = exogena.identificacionConsultante ?? '';
  return consultante !== '' && fila.nitInformante === consultante;
}

function agruparPorNit(grupos: Map<string, FilaExogena[]>, fila: FilaExogena): void {
  const filas = grupos.get(fila.nitInformante) ?? [];
  grupos.set(fila.nitInformante, [...filas, fila]);
}

function esperadoDelInformante(filas: FilaExogena[]): DocumentoEsperado | null {
  const primera = filas[0];
  if (!primera) {
    return null;
  }
  const detalles = filas.map((f) => f.detalle.toLowerCase());
  const base = { nit: primera.nitInformante, nombre: primera.nombreInformante };
  if (detalles.some((d) => DETALLE_LABORAL.test(d))) {
    return { ...base, tipo: 'certificado_220', opcional: false, motivo: 'te reportó pagos laborales en la exógena' };
  }
  if (detalles.some((d) => DETALLE_FINANCIERO.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'si no subes su certificado, tomamos sus saldos y rendimientos de la exógena' };
  }
  if (detalles.some((d) => DETALLE_INVERSION.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'sus saldos y rendimientos ya se precargaron desde la exógena' };
  }
  if (detalles.some((d) => DETALLE_MOVIMIENTOS.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'reportó movimientos de cuentas — su certificado ayuda a completar el GMF (4×1000)' };
  }
  return null;
}

/** Obligatorios primero; dentro de cada grupo, 220 antes que bancarios. */
function compararEsperados(a: DocumentoEsperado, b: DocumentoEsperado): number {
  if (a.opcional !== b.opcional) {
    return Number(a.opcional) - Number(b.opcional);
  }
  return a.tipo.localeCompare(b.tipo);
}
