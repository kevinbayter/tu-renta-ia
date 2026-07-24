import { fechaVencimiento, obtenerConstantes } from '@turenta/motor-fiscal';

import type { DeclaracionResumen } from '@turenta/core';

export interface VencimientoTitular {
  titular: string;
  identificacion: string;
  anioGravable: number;
  fechaIso: string;
  dias: number;
}

/** Vencimientos por titular (sin duplicar cédulas), ordenados del más próximo al más lejano. */
export function vencimientosDe(lista: DeclaracionResumen[], hoy: Date): VencimientoTitular[] {
  const porCedula = new Map<string, VencimientoTitular>();
  lista
    .map((d) => aVencimiento(d, hoy))
    .filter((v): v is VencimientoTitular => v !== null)
    .forEach((v) => porCedula.set(v.identificacion, v));
  return [...porCedula.values()].sort((a, b) => a.fechaIso.localeCompare(b.fechaIso));
}

export function formatearFechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(dia)} de ${meses[Number(mes) - 1] ?? ''} de ${anio ?? ''}`;
}

function aVencimiento(d: DeclaracionResumen, hoy: Date): VencimientoTitular | null {
  try {
    const fechaIso = fechaVencimiento(d.titular.identificacion, obtenerConstantes(d.anioGravable));
    return {
      titular: `${d.titular.nombres} ${d.titular.apellidos}`.trim(),
      identificacion: d.titular.identificacion,
      anioGravable: d.anioGravable,
      fechaIso,
      dias: diasHasta(fechaIso, hoy),
    };
  } catch {
    return null;
  }
}

function diasHasta(fechaIso: string, hoy: Date): number {
  const objetivo = new Date(`${fechaIso}T00:00:00`);
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo.getTime() - base.getTime()) / 86_400_000);
}
