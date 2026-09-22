import { deudasReportadas, inmueblesReportados } from './inmuebles-y-deudas';
import { ingresosMandatoReportados } from './mandato';

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
    ingresosArrendamientos: number;
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
  const mandato = ingresosMandatoReportados(exogena);
  const sugerenciasActivos = extraerSaldosNoBancarios(exogena.filas);
  return {
    respuestas: {
      rendimientosSinComponente: rendimientosCesantias,
      rendimientosAdicionalesConComponente: rendimientosFondos,
      ingresosArrendamientos: mandato.arrendamientos,
      ingresosNoLaborales: mandato.otros,
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
    ...lineasMandato(exogena),
    ...lineasPatrimonio(exogena),
  ];
  const saldos = activos.map((a) => `  · ${a.descripcion}: ${pesos(a.valor)}`);
  if (saldos.length > 0) {
    lineas.push('SALDOS A 31-DIC REPORTADOS EN EXÓGENA (ofrécelos como activos a confirmar, uno por uno):', ...saldos);
  }
  return lineas.join('\n');
}

function lineasMandato(exogena: ExogenaParseada): string[] {
  const mandato = ingresosMandatoReportados(exogena);
  const lineas: string[] = [];
  if (mandato.arrendamientos > 0) {
    lineas.push(
      `- ARRIENDOS reportados por inmobiliaria (rentas de capital): ${pesos(mandato.arrendamientos)} en ingresosArrendamientos — confírmalo y pide el certificado de la inmobiliaria: costos con soporte (predial SOLO del inmueble arrendado, comisión de la inmobiliaria con IVA, administración) en costosArrendamientos y la retención en la fuente en retencionArrendamientos.`,
    );
  }
  if (mandato.otros > 0) {
    lineas.push(
      `- Ingresos por mandato sin inmobiliaria: ${pesos(mandato.otros)} precargados como NO laborales — pregunta qué son: si es un arriendo, muévelo a ingresosArrendamientos (y deja ingresosNoLaborales en 0).`,
    );
  }
  mandato.duplicados.forEach((d) =>
    lineas.push(
      `  OJO: ${pesos(d.valor)} aparece reportado por ${d.informantes.join(' y ')} — típico duplicado de mandato: YA lo contamos UNA sola vez; solo confirma que es el mismo ingreso.`,
    ),
  );
  return lineas;
}

function lineasPatrimonio(exogena: ExogenaParseada): string[] {
  const inmuebles = inmueblesReportados(exogena).map(
    (i) => `  · Inmueble matrícula ${i.matricula} (${nombreCorto(i.municipio)}): avalúo ${pesos(i.valor)}`,
  );
  const deudas = deudasReportadas(exogena).map((d) => `  · ${nombreCorto(d.acreedor)}: ${pesos(d.valor)}`);
  return [
    ...(inmuebles.length > 0
      ? [
          'INMUEBLES SEGÚN LA EXÓGENA (predial): ofrécelos como activos a confirmar y pregunta cuál está arrendado; van por el MAYOR entre este avalúo y su costo fiscal si el usuario lo conoce:',
          ...inmuebles,
        ]
      : []),
    ...(deudas.length > 0 ? ['DEUDAS SEGÚN LA EXÓGENA (saldo a 31-dic): confírmalas en deudas y pregunta de qué tipo son:', ...deudas] : []),
  ];
}

function sumar(filas: FilaExogena[]): number {
  return filas.reduce((acc, f) => acc + f.valor, 0);
}

function pesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}
