/**
 * Clasificación honesta del resultado de una declaración: jamás se muestra
 * "pendiente de pago" con $0 — si no hay saldo, el estado es "sin saldo".
 */

export type EstadoResultado = 'en_progreso' | 'saldo_a_favor' | 'a_pagar' | 'sin_saldo';

export function clasificarResultado(
  saldoAFavor: number | null,
  saldoAPagar: number | null,
): EstadoResultado {
  if (saldoAFavor === null) {
    return 'en_progreso';
  }
  if (saldoAFavor > 0) {
    return 'saldo_a_favor';
  }
  if ((saldoAPagar ?? 0) > 0) {
    return 'a_pagar';
  }
  return 'sin_saldo';
}
