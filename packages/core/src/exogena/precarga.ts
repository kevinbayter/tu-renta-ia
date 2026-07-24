import { ingresosNoLaboralesReportados } from './no-laborales';

import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Precarga determinista de la entrevista desde la exógena: lo que ya está
 * reportado por terceros NO se le pregunta al usuario — se precarga y la
 * entrevista solo lo confirma o ajusta.
 */

export interface PrecargaExogena {
  /** Campos de RespuestasEntrevista que se pueden precargar con valor. */
  respuestas: {
    rendimientosSinComponente: number;
    rendimientosAdicionalesConComponente: number;
    ingresosNoLaborales: number;
  };
  /** Saldos reportados a 31-dic que la entrevista debe ofrecer como activos. */
  sugerenciasActivos: { descripcion: string; valor: number }[];
  /** Resumen legible para el system prompt del entrevistador. */
  resumen: string;
}

export function precargarDesdeExogena(exogena: ExogenaParseada): PrecargaExogena {
  const rendimientosCesantias = sumar(exogena.filas.filter(esRendimientoCesantias));
  const rendimientosFondos = sumar(exogena.filas.filter(esRendimientoFondoInversion));
  const noLaborales = ingresosNoLaboralesReportados(exogena);
  const sugerenciasActivos = extraerSaldosNoBancarios(exogena.filas);
  return {
    respuestas: {
      rendimientosSinComponente: rendimientosCesantias,
      rendimientosAdicionalesConComponente: rendimientosFondos,
      ingresosNoLaborales: noLaborales.total,
    },
    sugerenciasActivos,
    resumen: construirResumen(exogena, rendimientosCesantias, rendimientosFondos, sugerenciasActivos),
  };
}

function esRendimientoCesantias(fila: FilaExogena): boolean {
  const detalle = fila.detalle.toLowerCase();
  return detalle.includes('rendimientos causados') && detalle.includes('cesant');
}

function esRendimientoFondoInversion(fila: FilaExogena): boolean {
  // Solo la fila "Cartera Colectiva Rendimientos Pagados": la DIAN duplica el
  // mismo valor bajo "Valor Total Rendimientos pagados" (se excluye para no doble contar).
  // Los rendimientos BANCARIOS (concepto 5063) llegan por el certificado del banco.
  return fila.detalle.toLowerCase().includes('cartera colectiva rendimientos pagados');
}

function esSaldoReportado(fila: FilaExogena): boolean {
  return fila.detalle.toLowerCase().startsWith('saldo') && fila.usoSugerido.includes('R29');
}

function esSaldoBancario(fila: FilaExogena): boolean {
  return fila.detalle.toLowerCase().includes('saldo cuentas bancarias');
}

function extraerSaldosNoBancarios(filas: FilaExogena[]): { descripcion: string; valor: number }[] {
  // Los saldos de cuentas bancarias llegan por el certificado del banco (evita duplicar);
  // los demás (fondos de inversión, depósitos electrónicos) se sugieren como activos.
  return filas
    .filter((f) => esSaldoReportado(f) && !esSaldoBancario(f) && f.valor > 0)
    .map((f) => ({ descripcion: `${nombreCorto(f.nombreInformante)} (según exógena)`, valor: f.valor }));
}

function nombreCorto(razonSocial: string): string {
  return razonSocial.split(' ').slice(0, 3).join(' ');
}

function construirResumen(
  exogena: ExogenaParseada,
  rendimientosCesantias: number,
  rendimientosFondos: number,
  activos: { descripcion: string; valor: number }[],
): string {
  const lineas = [
    `Exógena AG${String(exogena.anioGravable)} con ${String(exogena.filas.length)} reportes de terceros.`,
    `YA PRECARGADO desde la exógena (solo pide CONFIRMAR, no volver a preguntar):`,
    `- Rendimientos de cesantías: ${pesos(rendimientosCesantias)}`,
    `- Rendimientos de fondos de inversión (carteras colectivas): ${pesos(rendimientosFondos)}`,
    `- Compras con factura electrónica y saldo a favor del año anterior: se aplican automáticamente.`,
    ...lineasNoLaborales(exogena),
  ];
  const saldos = activos.map((a) => `  · ${a.descripcion}: ${pesos(a.valor)}`);
  if (saldos.length > 0) {
    lineas.push('SALDOS A 31-DIC REPORTADOS EN EXÓGENA (ofrécelos como activos a confirmar, uno por uno):', ...saldos);
  }
  return lineas.join('\n');
}

function lineasNoLaborales(exogena: ExogenaParseada): string[] {
  const noLaborales = ingresosNoLaboralesReportados(exogena);
  if (noLaborales.total === 0) {
    return [];
  }
  const lineas = [
    `- Ingresos NO laborales (arriendos/mandato): ${pesos(noLaborales.total)} — confirma este valor y pregunta por costos con soporte (predial del inmueble arrendado, administración) para costosNoLaborales.`,
  ];
  noLaborales.duplicados.forEach((d) =>
    lineas.push(
      `  OJO: ${pesos(d.valor)} aparece reportado por ${d.informantes.join(' y ')} — típico duplicado de mandato: YA lo contamos UNA sola vez; solo confirma que es el mismo ingreso.`,
    ),
  );
  return lineas;
}

function sumar(filas: FilaExogena[]): number {
  return filas.reduce((acc, f) => acc + f.valor, 0);
}

function pesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}
