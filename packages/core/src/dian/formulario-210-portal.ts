import type { DiferenciaCasilla } from '../puertos/conexion-dian-port';

/**
 * El 210 en el portal (WebFormRenta210v18), mapeado en research/09: cada
 * casilla es el campo `#cs_id_<número>`. Unas se digitan y otras las calcula el
 * portal. TuRenta digita las primeras con los valores del motor y exige que las
 * segundas den lo mismo: si el portal y el motor no coinciden, no se guarda.
 */

/** Casillas numéricas que se digitan en el portal, por sección. */
export const CASILLAS_ENTRADA_210: readonly string[] = [
  '297',
  '29', '30',
  '355', '356', '33', '35', '36', '38', '39',
  '43', '44', '45', '47', '48', '50', '51', '56',
  '58', '59', '60', '62', '63', '64', '66', '67', '72',
  '74', '75', '76', '77', '79', '80', '81', '83', '84', '89',
  '94', '95', '96', '98',
  '99', '100', '102',
  '104', '105', '107', '109', '110',
  '112', '113', '114',
  '122', '123', '124', '126', '127', '128', '130', '131', '132', '133', '141',
];

/** Casillas que calcula el portal y que el motor también calcula: se comparan. */
export const CASILLAS_VERIFICADAS_210: readonly string[] = [
  '28', '31',
  '32', '34', '37', '40', '41', '42',
  '46', '49', '52', '53', '54', '57',
  '61', '65', '68', '69', '70', '73',
  '78', '82', '85', '86', '87', '90',
  '91', '92', '93', '97',
  '101', '103',
  '111', '115', '116', '121', '125', '129', '134', '136', '137',
];

/**
 * Valor a digitar en cada casilla de entrada. El motor lleva los salarios en la
 * 32 (que el portal calcula desde 355 + 356); lo que el motor no produce es 0,
 * porque el portal arranca con la sugerida de la DIAN y hay que pisarla entera.
 */
export function valoresDeEntrada210(casillas: Record<string, number>): Record<string, number> {
  const derivadas: Record<string, number> = { '355': casillas['32'] ?? 0, '356': 0 };
  return Object.fromEntries(CASILLAS_ENTRADA_210.map((c) => [c, derivadas[c] ?? casillas[c] ?? 0]));
}

/**
 * Casillas de secciones repartidas de principio a fin del formulario. Si el
 * robot no las leyó, no recorrió el formulario completo y "no hay diferencias"
 * no significa nada: no se guarda.
 */
export const CASILLAS_ANCLA_210: readonly string[] = ['31', '91', '111'];

export function anclasSinLeer(leidasDelPortal: Record<string, number>): string[] {
  return CASILLAS_ANCLA_210.filter((c) => !(c in leidasDelPortal));
}

/** Lo que el portal calculó distinto al motor (solo casillas que el portal mostró). */
export function diferenciasConPortal(
  casillas: Record<string, number>,
  leidasDelPortal: Record<string, number>,
): DiferenciaCasilla[] {
  return CASILLAS_VERIFICADAS_210.filter((c) => c in leidasDelPortal)
    .map((c) => ({ casilla: c, turenta: casillas[c] ?? 0, portal: leidasDelPortal[c] ?? 0 }))
    .filter((d) => d.turenta !== d.portal);
}

/** "16,181,000" o "16.181.000" → 16181000. Vacío → 0. */
export function montoDelPortal(texto: string): number {
  const limpio = texto.replace(/[^\d-]/g, '');
  return limpio === '' || limpio === '-' ? 0 : Number(limpio);
}

/** Nombre de cada sección del editor, por una casilla que solo ella tiene (research/09 §3). */
const SECCIONES_210: readonly [string, string][] = [
  ['286', 'datos del declarante'],
  ['297', 'deducciones y beneficios'],
  ['241', 'dependientes'],
  ['29', 'patrimonio'],
  ['355', 'rentas de trabajo'],
  ['43', 'rentas de trabajo sin relación laboral'],
  ['58', 'rentas de capital'],
  ['74', 'rentas no laborales'],
  ['91', 'cédula general'],
  ['99', 'pensiones'],
  ['104', 'dividendos'],
  ['112', 'ganancias ocasionales'],
  ['122', 'liquidación privada'],
  ['136', 'total a pagar'],
];

/** Para contarle al usuario en qué va el robot: "rentas de capital". Vacío si no se reconoce. */
export function nombreDeSeccion210(casillasEnPantalla: readonly string[]): string {
  return SECCIONES_210.find(([casilla]) => casillasEnPantalla.includes(casilla))?.[1] ?? '';
}
