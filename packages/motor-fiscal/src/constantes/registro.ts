import { AG2025 } from './ag2025';

import type { ConstantesAnio } from './tipos';

const REGISTRO: Record<number, ConstantesAnio> = {
  2025: AG2025,
};

export function obtenerConstantes(anioGravable: number): ConstantesAnio {
  const constantes = REGISTRO[anioGravable];
  if (!constantes) {
    throw new Error(`Año gravable ${String(anioGravable)} no soportado por el motor fiscal`);
  }
  return constantes;
}
