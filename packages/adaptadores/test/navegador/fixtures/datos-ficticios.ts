/**
 * The only place holding fake-MUISCA data. All of it is obviously made up.
 *
 * RULE: these fixtures are written BY HAND from the tables in
 * research/07-automatizacion-dian-analisis-2026.md §2.1.x. Pasting HTML
 * captured from a real session is forbidden: it would bring taxpayer data into
 * the repository. A test watches for exactly that.
 */

export const TITULAR_FICTICIO = {
  nombre: 'PERSONA DE PRUEBA',
  documento: '1000000001',
  contrasena: 'clave-de-prueba-no-real',
} as const;

/** Made-up form numbers: 13 digits like the real ones, all repeated. */
export const DECLARACIONES_FICTICIAS = [
  { formulario: '1111111111111', anio: 2022, presentada: '10/08/2023' },
  { formulario: '2222222222222', anio: 2023, presentada: '29/08/2024' },
  { formulario: '3333333333333', anio: 2024, presentada: '04/09/2025' },
] as const;

export const ANIOS_EXOGENA = [2022, 2023, 2024, 2025] as const;
