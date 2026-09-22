/** Casilla 286 del 210: mismas opciones y códigos que el portal de la DIAN. */
export const GENEROS_DIAN = [
  { codigo: '1', etiqueta: 'Femenino' },
  { codigo: '2', etiqueta: 'Masculino' },
  { codigo: '3', etiqueta: 'No binario' },
  { codigo: '4', etiqueta: 'Otro' },
  { codigo: '6', etiqueta: 'Prefiero no responder' },
] as const;

export function esGeneroValido(codigo: string): boolean {
  return GENEROS_DIAN.some((g) => g.codigo === codigo);
}
