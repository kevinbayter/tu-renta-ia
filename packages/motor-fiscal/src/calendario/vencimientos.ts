import type { ConstantesAnio } from '../constantes/tipos';

/**
 * Fecha límite para presentar la declaración según los DOS últimos dígitos
 * del documento de identidad (sin dígito de verificación).
 * Pares: 01-02 → primera fecha, ..., 99-00 → última (el par "00" cierra el calendario).
 */
export function fechaVencimiento(identificacion: string, c: ConstantesAnio): string {
  const digitos = ultimosDosDigitos(identificacion);
  const indice = indiceDePar(digitos);
  const fecha = c.calendarioVencimientos[indice];
  if (!fecha) {
    throw new Error(`Calendario de vencimientos incompleto para dígitos ${String(digitos).padStart(2, '0')}`);
  }
  return fecha;
}

export function ultimosDosDigitos(identificacion: string): number {
  const soloDigitos = identificacion.replace(/\D/g, '');
  if (soloDigitos.length < 2) {
    throw new Error('Identificación inválida: se requieren al menos dos dígitos');
  }
  return Number(soloDigitos.slice(-2));
}

function indiceDePar(digitos: number): number {
  const posicion = digitos === 0 ? 100 : digitos;
  return Math.ceil(posicion / 2) - 1;
}
