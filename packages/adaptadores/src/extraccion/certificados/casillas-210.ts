/**
 * Reading an already filed form 210 without a model.
 *
 * The form has fixed numbered boxes, so the five figures we need can be read
 * deterministically: instant, free, reproducible and with no chance of an
 * invented number. The model stays as a fallback for layouts this misses.
 */

/** Boxes we need, by number and by the label printed next to them. */
const CASILLAS = {
  patrimonioLiquido: { numero: 31, etiqueta: /total patrimonio l[ií]quido/i },
  impuestoNetoRenta: { numero: 126, etiqueta: /impuesto neto de renta/i },
  anticipoAnioSiguiente: { numero: 133, etiqueta: /anticipo.*a[ñn]o gravable siguiente/i },
  totalSaldoAFavor: { numero: 137, etiqueta: /total saldo a favor/i },
} as const;

export interface CasillasDeclaracion {
  anioGravable: number;
  patrimonioLiquido: number;
  impuestoNetoRenta: number;
  anticipoAnioSiguiente: number;
  totalSaldoAFavor: number;
}

/** Colombian format: thousands with dots, no decimals in the 210. */
function aMonto(texto: string): number | null {
  const limpio = texto.replace(/[^\d]/g, '');
  if (limpio === '') {
    return null;
  }
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

/** "Año 2024" in the header; never the filing date. */
export function anioGravableDe(texto: string): number | null {
  const explicito = /a[ñn]o\s*(?:gravable)?\s*[:.]?\s*(20\d{2})/i.exec(texto);
  const valor = explicito ? Number(explicito[1]) : null;
  return valor !== null && valor >= 2018 ? valor : null;
}

/**
 * Value that follows the box number. PDF text often puts the label and the
 * figure apart, so the number itself is the anchor, not the wording.
 */
function porNumeroDeCasilla(texto: string, numero: number): number | null {
  const patron = new RegExp(`(?:^|[^\\d])${String(numero)}[^\\d\\n]{0,80}?([\\d.,]{4,})`, 'm');
  const encontrado = patron.exec(texto);
  return encontrado?.[1] !== undefined ? aMonto(encontrado[1]) : null;
}

/** Value that follows the printed label, for layouts where the number is apart. */
function porEtiqueta(texto: string, etiqueta: RegExp): number | null {
  const fuente = new RegExp(`${etiqueta.source}[^\\d\\n]{0,80}?([\\d.,]{4,})`, 'i');
  const encontrado = fuente.exec(texto);
  return encontrado?.[1] !== undefined ? aMonto(encontrado[1]) : null;
}

function valorDe(texto: string, casilla: { numero: number; etiqueta: RegExp }): number | null {
  return porEtiqueta(texto, casilla.etiqueta) ?? porNumeroDeCasilla(texto, casilla.numero);
}

/**
 * Returns null when the layout is not recognised, so the caller can fall back
 * to the model instead of shipping a wrong figure. A wrong number here would
 * quietly distort the whole return.
 */
export function extraerCasillas210(texto: string): CasillasDeclaracion | null {
  const anioGravable = anioGravableDe(texto);
  const patrimonioLiquido = valorDe(texto, CASILLAS.patrimonioLiquido);
  if (anioGravable === null || patrimonioLiquido === null) {
    return null;
  }
  return {
    anioGravable,
    patrimonioLiquido,
    impuestoNetoRenta: valorDe(texto, CASILLAS.impuestoNetoRenta) ?? 0,
    anticipoAnioSiguiente: valorDe(texto, CASILLAS.anticipoAnioSiguiente) ?? 0,
    totalSaldoAFavor: valorDe(texto, CASILLAS.totalSaldoAFavor) ?? 0,
  };
}
