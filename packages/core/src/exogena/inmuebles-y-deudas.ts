import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Bienes y deudas que la exógena ya conoce y que el usuario suele olvidar al
 * listar su patrimonio: los inmuebles (avalúos del predial, uno por matrícula)
 * y las deudas que reportan los acreedores. Solo se sugieren: el valor
 * patrimonial del inmueble es el mayor entre avalúo y costo fiscal (art. 277),
 * y el costo fiscal solo lo conoce el usuario.
 */

export interface InmuebleExogena {
  matricula: string;
  valor: number;
  municipio: string;
}

export interface DeudaExogena {
  acreedor: string;
  valor: number;
}

const DETALLE_PREDIAL = /aval[uú]o catastral|base del impuesto predial/;
const DETALLE_DEUDA = /cuentas por pagar|saldo de pr[eé]stamos|cr[eé]dito hipotecario/;

export function inmueblesReportados(exogena: ExogenaParseada): InmuebleExogena[] {
  const porMatricula = new Map<string, InmuebleExogena>();
  exogena.filas
    .filter((f) => DETALLE_PREDIAL.test(f.detalle.toLowerCase()) && f.valor > 0)
    .forEach((f) => {
      const matricula = matriculaDe(f);
      const previo = porMatricula.get(matricula);
      // Avalúo y base del predial llegan como filas separadas del mismo inmueble.
      porMatricula.set(matricula, { matricula, municipio: f.nombreInformante, valor: Math.max(previo?.valor ?? 0, f.valor) });
    });
  return [...porMatricula.values()];
}

export function deudasReportadas(exogena: ExogenaParseada): DeudaExogena[] {
  return exogena.filas
    .filter((f) => DETALLE_DEUDA.test(f.detalle.toLowerCase()) && f.valor > 0)
    .map((f) => ({ acreedor: f.nombreInformante.replace(/[\s-]+$/, ''), valor: f.valor }));
}

function matriculaDe(fila: FilaExogena): string {
  return /matr[ií]cula:\s*([\w-]+)/i.exec(fila.infoAdicional)?.[1] ?? fila.detalle;
}
