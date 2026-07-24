import type { ExogenaParseada, FilaExogena, TopesExogena } from './tipos';

/**
 * Interpretación semántica (pura) de la exógena. La exógena es un CHECKLIST
 * y fuente de topes/saldos históricos; la fuente de verdad de ingresos y
 * retenciones son los certificados que el usuario carga (mismo criterio referencia).
 */

export function saldoAFavorAnterior(exogena: ExogenaParseada): number {
  return sumarPorDetalle(exogena.filas, 'total saldo a favor');
}

export function comprasFacturaElectronicaConBeneficio(exogena: ExogenaParseada): number {
  return sumarPorDetalle(exogena.filas, 'susceptible de beneficio');
}

export function retencionesReportadas(exogena: ExogenaParseada): FilaExogena[] {
  return exogena.filas.filter((f) => f.usoSugerido.toLowerCase().includes('r132'));
}

export function rendimientosReportados(exogena: ExogenaParseada): FilaExogena[] {
  return exogena.filas.filter((f) => f.usoSugerido.toLowerCase().includes('r58'));
}

export function saldosPatrimonialesReportados(exogena: ExogenaParseada): FilaExogena[] {
  return exogena.filas.filter((f) => esSaldoPatrimonial(f));
}

/** Umbrales de obligados a declarar en pesos, desde las constantes del año. */
export function umbralesObligadoADeclarar(uvt: number, patrimonioUvt: number, ingresosUvt: number): TopesExogena {
  const topeGeneral = ingresosUvt * uvt;
  return {
    ingresos: topeGeneral,
    patrimonio: patrimonioUvt * uvt,
    consumoTarjetas: topeGeneral,
    movimientos: topeGeneral,
    compras: topeGeneral,
  };
}

export function obligadoADeclarar(topes: TopesExogena, umbrales: TopesExogena): boolean {
  return (
    topes.ingresos >= umbrales.ingresos ||
    topes.patrimonio >= umbrales.patrimonio ||
    topes.consumoTarjetas >= umbrales.consumoTarjetas ||
    topes.movimientos >= umbrales.movimientos ||
    topes.compras >= umbrales.compras
  );
}

function esSaldoPatrimonial(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  return detalle.includes('saldo') && fila.usoSugerido.toLowerCase().includes('r29');
}

function sumarPorDetalle(filas: FilaExogena[], fragmento: string): number {
  return filas
    .filter((f) => f.detalle.toLowerCase().includes(fragmento))
    .reduce((acc, f) => acc + f.valor, 0);
}
