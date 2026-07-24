import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Fallback bancario: los certificados bancarios son opcionales. Para las
 * entidades SIN certificado cargado, los saldos a 31-dic y los rendimientos
 * se toman directamente de lo reportado en la exógena (sin doble conteo:
 * si el certificado existe, manda el certificado).
 */

const PALABRAS_GENERICAS = new Set([
  'SA', 'S', 'A', 'DE', 'LA', 'EL', 'Y', 'LTDA', 'SAS', 'COMPANIA', 'FINANCIAMIENTO',
  'BANCO', 'FIDUCIARIA', 'COLOMBIA', 'COMISIONISTA', 'BOLSA', 'FONDO', 'CAPITAL',
  'SALDO', 'CUENTA', 'CUENTAS', 'AHORROS', 'CORRIENTE', 'SEGUN', 'EXOGENA',
]);

/** Tokens significativos del nombre de una entidad (sin tildes, siglas ni genéricos). */
export function tokensDeEntidad(nombre: string): string[] {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length > 1 && !PALABRAS_GENERICAS.has(token));
}

/** "BANCO EJEMPLO COMPAÑIA DE FINANCIAMIENTO S.A." coincide con "Banco Ejemplo SA". */
export function coincideEntidad(a: string, b: string): boolean {
  const tokensB = new Set(tokensDeEntidad(b));
  return tokensDeEntidad(a).some((token) => tokensB.has(token));
}

export interface SaldoBancarioExogena {
  descripcion: string;
  valor: number;
  /** Razón social completa del informante (para deduplicar sin perder tokens). */
  entidad: string;
}

export function saldosBancariosSinCertificado(
  exogena: ExogenaParseada,
  entidadesConCertificado: string[],
): SaldoBancarioExogena[] {
  return exogena.filas
    .filter((f) => f.detalle.toLowerCase().includes('saldo cuentas bancarias'))
    .filter((f) => f.valor > 0 && !estaCertificada(f.nombreInformante, entidadesConCertificado))
    .map((f) => ({
      descripcion: `${nombreCorto(f.nombreInformante)} (saldo según exógena)`,
      valor: f.valor,
      entidad: f.nombreInformante,
    }));
}

export function rendimientosBancariosSinCertificado(
  exogena: ExogenaParseada,
  entidadesConCertificado: string[],
): number {
  return exogena.filas
    .filter((f) => esRendimientoBancario(f))
    .filter((f) => !estaCertificada(f.nombreInformante, entidadesConCertificado))
    .reduce((acc, f) => acc + f.valor, 0);
}

function esRendimientoBancario(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  return detalle.includes('intereses y rendimientos financieros pagados') && !detalle.includes('retención');
}

function estaCertificada(nombreInformante: string, entidades: string[]): boolean {
  return entidades.some((entidad) => coincideEntidad(entidad, nombreInformante));
}

function nombreCorto(razonSocial: string): string {
  return razonSocial.split(/\s+/).slice(0, 3).join(' ');
}
