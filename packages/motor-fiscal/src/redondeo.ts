/**
 * Redondeos del formulario 210 (art. 577 E.T.): valores al múltiplo de mil.
 * `redondearMil` (al más cercano) aplica a las casillas en general.
 * `pisoMil` aplica al impuesto por tabla — comportamiento calibrado contra el
 * caso dorado de referencia AG2025 (ver normativa/ag2025/01-fuentes-normativas.md §reglas).
 */
export function redondearMil(valor: number): number {
  return Math.round(valor / 1000) * 1000;
}

export function pisoMil(valor: number): number {
  return Math.floor(valor / 1000) * 1000;
}
