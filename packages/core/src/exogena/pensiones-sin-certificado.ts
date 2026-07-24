import { coincideEntidad } from './bancos-sin-certificado';

import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Fallback pensional: si el fondo (Pensiones Ejemplo, etc.) no tiene certificado 220
 * cargado, la pensión, sus aportes a salud y su retención se toman de lo que el
 * fondo reportó en la exógena (concepto 2276). Si el certificado existe, manda
 * el certificado — sin doble conteo.
 */

export interface PensionesExogena {
  ingresosBrutos: number;
  aportesSalud: number;
  retencionFuente: number;
  entidades: string[];
}

export function pensionesSinCertificado(
  exogena: ExogenaParseada,
  entidadesConCertificado: string[],
): PensionesExogena {
  const filasPension = exogena.filas.filter((f) => esPagoPension(f));
  const entidades = [...new Set(filasPension.map((f) => f.nombreInformante))].filter(
    (nombre) => !entidadesConCertificado.some((e) => coincideEntidad(e, nombre)),
  );
  return {
    ingresosBrutos: sumar(filasPension, entidades),
    aportesSalud: sumar(exogena.filas.filter((f) => esAporteSalud(f)), entidades),
    retencionFuente: sumar(exogena.filas.filter((f) => esRetencionPension(f)), entidades),
    entidades,
  };
}

/** "Pension jubilación, vejez, invalidez (Concepto: 2276)" — excluye aportes A pensión y retenciones. */
function esPagoPension(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  return (
    detalle.includes('pension') &&
    detalle.includes('2276') &&
    !detalle.includes('retenci') &&
    !detalle.includes('aporte')
  );
}

function esAporteSalud(fila: FilaExogena): boolean {
  return fila.detalle.toLowerCase().includes('aportes obligatorios a salud');
}

function esRetencionPension(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  return detalle.includes('retenci') && detalle.includes('rentas de trabajo o pensiones');
}

function sumar(filas: FilaExogena[], entidades: string[]): number {
  return filas
    .filter((f) => entidades.includes(f.nombreInformante))
    .reduce((acc, f) => acc + f.valor, 0);
}
