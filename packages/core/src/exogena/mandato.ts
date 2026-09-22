import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Ingresos por mandato de la exógena (concepto 4040, uso sugerido R74). La DIAN
 * los sugiere como no laborales solo porque el concepto no dice qué se cobró:
 * si el mandatario es una inmobiliaria son arriendos, que son rentas de capital
 * (art. 335-2 E.T.). En mandato el MISMO ingreso suele venir dos veces
 * (mandatario y pagador): el mismo valor exacto de informantes distintos cuenta
 * una vez y queda marcado para que el usuario lo confirme.
 */

export interface DuplicadoMandato {
  valor: number;
  informantes: string[];
}

export interface IngresosMandatoExogena {
  /** Total ya deduplicado (cada valor repetido por informantes distintos cuenta una vez). */
  total: number;
  /** Parte reportada por inmobiliarias: arrendamientos (rentas de capital). */
  arrendamientos: number;
  /** Resto: rentas no laborales mientras el usuario no diga otra cosa. */
  otros: number;
  duplicados: DuplicadoMandato[];
}

const INMOBILIARIA = /inmobiliari|arrendamiento|finca\s*ra[ií]z|propiedad\s*ra[ií]z/i;

export function ingresosMandatoReportados(exogena: ExogenaParseada): IngresosMandatoExogena {
  const filas = exogena.filas.filter((f) => esIngresoMandato(f));
  const porValor = new Map<number, string[]>();
  filas.forEach((f) => porValor.set(f.valor, [...(porValor.get(f.valor) ?? []), f.nombreInformante]));
  const grupos = [...porValor.entries()];
  const arrendamientos = grupos
    .filter(([, informantes]) => informantes.some((nombre) => INMOBILIARIA.test(nombre)))
    .reduce((acc, [valor]) => acc + valor, 0);
  const total = grupos.reduce((acc, [valor]) => acc + valor, 0);
  return {
    total,
    arrendamientos,
    otros: total - arrendamientos,
    duplicados: grupos
      .filter(([, informantes]) => new Set(informantes).size > 1)
      .map(([valor, informantes]) => ({ valor, informantes: [...new Set(informantes)] })),
  };
}

function esIngresoMandato(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  const uso = fila.usoSugerido.toLowerCase();
  if (detalle.includes('retenci')) {
    return false;
  }
  return uso.includes('r74') || detalle.includes('mandato (concepto: 4040)');
}
