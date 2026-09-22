/**
 * Casilla 24 del 210: actividad económica principal. La que vale es la del RUT
 * (MUISCA la precarga); para el borrador se sugiere la de la renta predominante
 * con los códigos que la DIAN reserva a personas naturales sin actividad CIIU.
 * Si predominan honorarios u otras rentas, el código es un CIIU que solo está
 * en el RUT: se deja en blanco antes que inventarlo.
 */

const CODIGOS = {
  asalariado: '0010',
  pensionado: '0020',
  rentistaDeCapital: '0090',
} as const;

export function actividadEconomicaSugerida(casillas: Record<string, number>): string {
  const candidatos: [string, number][] = [
    [CODIGOS.asalariado, casillas['32'] ?? 0],
    [CODIGOS.pensionado, casillas['99'] ?? 0],
    [CODIGOS.rentistaDeCapital, casillas['58'] ?? 0],
    ['', casillas['43'] ?? 0],
    ['', casillas['74'] ?? 0],
  ];
  const [codigo, valor] = candidatos.reduce((mayor, actual) => (actual[1] > mayor[1] ? actual : mayor));
  return valor > 0 ? codigo : '';
}
