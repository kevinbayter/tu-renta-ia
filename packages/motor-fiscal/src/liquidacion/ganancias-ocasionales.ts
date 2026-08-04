import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoGananciasOcasionales } from '../modelo/resultado';
import type {
  GananciasOcasionalesInput,
  HerenciaDonacionInput,
  VentaActivoInput,
} from '../modelo/tipos';

/**
 * Ganancias ocasionales (arts. 300-317 E.T., tarifas y exenciones Ley 2277/2022).
 * Respaldo: normativa/ag2025/09-ganancias-ocasionales.md.
 * Las ventas con menos de 2 años de posesión NO entran aquí: son renta líquida
 * ordinaria (art. 300) y el motor las manda a rentas no laborales.
 */

const SIN_GANANCIAS: ResultadoGananciasOcasionales = {
  ingresos: 0,
  costos: 0,
  exentas: 0,
  gravables: 0,
  baseTarifaGeneral: 0,
  basePremios: 0,
  impuesto: 0,
  retenciones: 0,
  ventasARentaOrdinaria: { ingresos: 0, costos: 0 },
  netaParaComparacion: 0,
};

export function liquidarGananciasOcasionales(
  entrada: GananciasOcasionalesInput | undefined,
  c: ConstantesAnio,
): ResultadoGananciasOcasionales {
  if (!entrada) {
    return SIN_GANANCIAS;
  }
  const ventasGo = entrada.ventas.filter((v) => poseidoDosAniosOMas(v));
  const ventasCortas = entrada.ventas.filter((v) => !poseidoDosAniosOMas(v));
  return consolidar(
    depurarVentas(ventasGo, c),
    depurarHerencias(entrada.herencias, c),
    sumar(entrada.premios, (p) => Math.max(0, p.valor)),
    redondearMil(
      sumar(ventasGo, (v) => Math.max(0, v.retencionFuente)) +
        sumar(entrada.premios, (p) => Math.max(0, p.retencionFuente)),
    ),
    ventasCortas,
    c,
  );
}

function consolidar(
  ventas: DepuracionVentas,
  herencias: DepuracionHerencias,
  premios: number,
  retenciones: number,
  ventasCortas: VentaActivoInput[],
  c: ConstantesAnio,
): ResultadoGananciasOcasionales {
  const bases = calcularBases(ventas, herencias, premios, c);
  return {
    ...bases,
    retenciones,
    ventasARentaOrdinaria: totalVentasCortas(ventasCortas),
    netaParaComparacion: Math.max(0, bases.ingresos - bases.costos),
  };
}

type BasesGravables = Omit<
  ResultadoGananciasOcasionales,
  'retenciones' | 'ventasARentaOrdinaria' | 'netaParaComparacion'
>;

function calcularBases(
  ventas: DepuracionVentas,
  herencias: DepuracionHerencias,
  premios: number,
  c: ConstantesAnio,
): BasesGravables {
  const baseTarifaGeneral = Math.max(
    0,
    redondearMil(ventas.utilidadNeta - ventas.exentas + herencias.ingresos - herencias.exentas),
  );
  const basePremios = redondearMil(premios);
  return {
    ingresos: redondearMil(ventas.ingresos + herencias.ingresos + premios),
    costos: redondearMil(ventas.costos),
    exentas: redondearMil(ventas.exentas + herencias.exentas),
    gravables: baseTarifaGeneral + basePremios,
    baseTarifaGeneral,
    basePremios,
    impuesto: redondearMil(
      baseTarifaGeneral * c.gananciaOcasional.tarifaGeneral +
        basePremios * c.gananciaOcasional.tarifaPremios,
    ),
  };
}

function totalVentasCortas(ventasCortas: VentaActivoInput[]): { ingresos: number; costos: number } {
  return {
    ingresos: redondearMil(sumar(ventasCortas, (v) => Math.max(0, v.precioVenta))),
    costos: redondearMil(sumar(ventasCortas, (v) => Math.max(0, v.costoFiscal))),
  };
}

interface DepuracionVentas {
  ingresos: number;
  costos: number;
  /** Utilidades menos pérdidas de las ventas GO (art. 311 permite compensarlas entre sí). */
  utilidadNeta: number;
  exentas: number;
}

function depurarVentas(ventas: VentaActivoInput[], c: ConstantesAnio): DepuracionVentas {
  const ingresos = sumar(ventas, (v) => Math.max(0, v.precioVenta));
  const costos = sumar(ventas, (v) => Math.max(0, v.costoFiscal));
  const utilidadNeta = ingresos - costos;
  const exentas = sumar(ventas, (v) => exencionVentaVivienda(v, c));
  return { ingresos, costos, utilidadNeta, exentas };
}

/** Art. 311-1: 5.000 UVT de la utilidad en venta de la vivienda de habitación, SOLO con destinación AFC/hipoteca. */
function exencionVentaVivienda(venta: VentaActivoInput, c: ConstantesAnio): number {
  if (!venta.esViviendaHabitacion || !venta.destinoAfcOHipoteca) {
    return 0;
  }
  const utilidad = Math.max(0, venta.precioVenta - venta.costoFiscal);
  return Math.min(utilidad, c.gananciaOcasional.exencionVentaViviendaUvt * c.uvt);
}

interface DepuracionHerencias {
  ingresos: number;
  exentas: number;
}

/** Exenciones del art. 307, concurrentes: por tipo de bien y luego por beneficiario. */
function depurarHerencias(herencias: HerenciaDonacionInput[], c: ConstantesAnio): DepuracionHerencias {
  const ingresos = sumar(herencias, (h) => Math.max(0, h.valor));
  const porBien = sumar(herencias, (h) => exencionPorTipoDeBien(h, c));
  const baseRestante = ingresos - porBien;
  const legitimario = exencionLegitimario(herencias, baseRestante, c);
  const noLegitimario = exencionNoLegitimario(herencias, baseRestante - legitimario, c);
  return { ingresos, exentas: porBien + legitimario + noLegitimario };
}

function exencionPorTipoDeBien(h: HerenciaDonacionInput, c: ConstantesAnio): number {
  const valor = Math.max(0, h.valor);
  if (h.tipo === 'vivienda_causante') {
    return Math.min(valor, c.gananciaOcasional.exencionViviendaCausanteUvt * c.uvt);
  }
  if (h.tipo === 'otro_inmueble_causante') {
    return Math.min(valor, c.gananciaOcasional.exencionOtroInmuebleCausanteUvt * c.uvt);
  }
  return 0;
}

/** Num. 3 art. 307: primeras 3.250 UVT de las asignaciones del cónyuge/legitimario. */
function exencionLegitimario(
  herencias: HerenciaDonacionInput[],
  baseRestante: number,
  c: ConstantesAnio,
): number {
  if (!herencias.some((h) => h.esLegitimarioOConyuge)) {
    return 0;
  }
  return Math.max(0, Math.min(baseRestante, c.gananciaOcasional.exencionPorBeneficiarioUvt * c.uvt));
}

/** Num. 4 art. 307: 20% de lo recibido por no legitimarios y donaciones, tope 1.625 UVT. */
function exencionNoLegitimario(
  herencias: HerenciaDonacionInput[],
  baseRestante: number,
  c: ConstantesAnio,
): number {
  const recibido = sumar(
    herencias.filter((h) => !h.esLegitimarioOConyuge),
    (h) => Math.max(0, h.valor),
  );
  if (recibido === 0) {
    return 0;
  }
  const veintePorCiento = recibido * c.gananciaOcasional.exencionNoLegitimarioPorcentaje;
  const tope = c.gananciaOcasional.exencionNoLegitimarioTopeUvt * c.uvt;
  return Math.max(0, Math.min(baseRestante, veintePorCiento, tope));
}

interface FechaSimple {
  anio: number;
  mes: number;
  dia: number;
}

function descomponer(fecha: string): FechaSimple | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) {
    return null;
  }
  return { anio: Number(partes[1]), mes: Number(partes[2]), dia: Number(partes[3]) };
}

/** Fechas ilegibles se tratan como <2 años: renta ordinaria, la lectura conservadora del art. 300. */
function poseidoDosAniosOMas(venta: VentaActivoInput): boolean {
  const adquisicion = descomponer(venta.fechaAdquisicion);
  const enajenacion = descomponer(venta.fechaVenta);
  if (!adquisicion || !enajenacion) {
    return false;
  }
  const limite: FechaSimple = { ...adquisicion, anio: adquisicion.anio + 2 };
  return comparar(enajenacion, limite) >= 0;
}

function comparar(a: FechaSimple, b: FechaSimple): number {
  return a.anio - b.anio || a.mes - b.mes || a.dia - b.dia;
}

function sumar<T>(lista: T[], valor: (x: T) => number): number {
  return lista.reduce((acc, x) => acc + valor(x), 0);
}
