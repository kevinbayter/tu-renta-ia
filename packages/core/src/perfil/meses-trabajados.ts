/**
 * Meses con relación laboral derivados del "Período de la certificación" de los
 * certificados 220 (unión de meses cubiertos dentro del año gravable). El valor
 * se precarga y la entrevista solo lo confirma.
 */

interface PeriodoCertificado {
  periodoInicio?: string;
  periodoFin?: string;
}

export function mesesTrabajadosSegunCertificados(
  certificados: PeriodoCertificado[],
  anioGravable: number,
): number | null {
  const rangos = certificados
    .map((c) => mesesDelPeriodo(c, anioGravable))
    .filter((r): r is number[] => r !== null);
  if (rangos.length === 0) {
    return null;
  }
  return new Set(rangos.flat()).size;
}

function mesesDelPeriodo(cert: PeriodoCertificado, anioGravable: number): number[] | null {
  const inicio = mesInicio(cert.periodoInicio, anioGravable);
  const fin = mesFin(cert.periodoFin, anioGravable);
  if (inicio === null || fin === null || fin < inicio) {
    return null;
  }
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
}

/** Mes de inicio dentro del año gravable: si empezó antes, cuenta desde enero. */
function mesInicio(fecha: string | undefined, anioGravable: number): number | null {
  const partes = descomponer(fecha);
  if (!partes || partes.anio > anioGravable) {
    return null;
  }
  return partes.anio < anioGravable ? 1 : partes.mes;
}

/** Mes final dentro del año gravable: si termina después, cuenta hasta diciembre. */
function mesFin(fecha: string | undefined, anioGravable: number): number | null {
  const partes = descomponer(fecha);
  if (!partes || partes.anio < anioGravable) {
    return null;
  }
  return partes.anio > anioGravable ? 12 : partes.mes;
}

function descomponer(fecha: string | undefined): { anio: number; mes: number } | null {
  const partes = /^(\d{4})-(\d{1,2})-\d{1,2}$/.exec(fecha ?? '');
  if (!partes?.[1] || !partes[2]) {
    return null;
  }
  const mes = Number(partes[2]);
  if (mes < 1 || mes > 12) {
    return null;
  }
  return { anio: Number(partes[1]), mes };
}
