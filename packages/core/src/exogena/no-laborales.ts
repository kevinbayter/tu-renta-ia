import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Ingresos no laborales reportados en la exógena (arriendos vía mandato,
 * concepto 4040, uso sugerido R74). En mandato el MISMO ingreso suele venir
 * DOS veces (lo reporta la inmobiliaria mandataria Y el tercero pagador):
 * el mismo valor exacto de informantes distintos se cuenta UNA vez y se marca
 * como posible duplicado para confirmación del usuario — nunca se suma a ciegas
 * (normativa/ag2025/05-no-laborales.md).
 */

export interface DuplicadoNoLaboral {
  valor: number;
  informantes: string[];
}

export interface IngresosNoLaboralesExogena {
  /** Total ya deduplicado (cada valor repetido por informantes distintos cuenta una vez). */
  total: number;
  duplicados: DuplicadoNoLaboral[];
}

export function ingresosNoLaboralesReportados(exogena: ExogenaParseada): IngresosNoLaboralesExogena {
  const filas = exogena.filas.filter((f) => esIngresoNoLaboral(f));
  const porValor = new Map<number, string[]>();
  filas.forEach((f) => porValor.set(f.valor, [...(porValor.get(f.valor) ?? []), f.nombreInformante]));
  const grupos = [...porValor.entries()];
  return {
    total: grupos.reduce((acc, [valor]) => acc + valor, 0),
    duplicados: grupos
      .filter(([, informantes]) => new Set(informantes).size > 1)
      .map(([valor, informantes]) => ({ valor, informantes: [...new Set(informantes)] })),
  };
}

function esIngresoNoLaboral(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  const uso = fila.usoSugerido.toLowerCase();
  if (detalle.includes('retenci')) {
    return false;
  }
  return uso.includes('r74') || detalle.includes('mandato (concepto: 4040)');
}
