import { obtenerConstantes } from './constantes/registro';
import { depurarCedulaGeneral } from './depuracion/cedula-general';
import { depurarDividendos } from './depuracion/dividendos';
import { depurarPensiones } from './depuracion/pensiones';
import { mapearCasillas } from './formulario210/casillas';
import { liquidarGananciasOcasionales } from './liquidacion/ganancias-ocasionales';
import { liquidar } from './liquidacion/liquidar';
import { compararPatrimonio } from './patrimonio/comparacion';
import { redondearMil } from './redondeo';

import type { ResultadoDeclaracion, ResultadoDividendos, ResultadoGananciasOcasionales } from './modelo/resultado';
import type { PerfilFiscal } from './modelo/tipos';

/**
 * Punto de entrada del motor fiscal: liquida la declaración de renta (formulario 210)
 * de una persona natural residente. Función pura y determinista.
 */
export function liquidarDeclaracion(perfil: PerfilFiscal): ResultadoDeclaracion {
  const c = obtenerConstantes(perfil.anioGravable);
  const gananciasOcasionales = liquidarGananciasOcasionales(perfil.gananciasOcasionales, c);
  const dividendos = depurarDividendos(perfil.dividendos, c);
  const cedulaGeneral = depurarCedulaGeneral(conVentasCortoPlazo(perfil, gananciasOcasionales), c);
  const cedulaPensiones = depurarPensiones(perfil.rentasPensiones, c);
  // Art. 331 E.T. (Ley 2277/2022): la tarifa del 241 se aplica a la SUMA de cédulas.
  const rentaLiquidaGravable =
    cedulaGeneral.rentaLiquidaGravable + cedulaPensiones.rentaLiquidaGravable + dividendos.baseParaTabla;
  const liquidacion = liquidar(
    rentaLiquidaGravable,
    calcularRetenciones(perfil) + gananciasOcasionales.retenciones + dividendos.retencionFuente,
    perfil.historial,
    c,
    perfil.descuentos,
    gananciasOcasionales.impuesto,
    dividendos,
  );
  return armarResultado(perfil, { gananciasOcasionales, dividendos, cedulaGeneral, cedulaPensiones, rentaLiquidaGravable, liquidacion });
}

interface PiezasResultado {
  gananciasOcasionales: ResultadoGananciasOcasionales;
  dividendos: ResultadoDividendos;
  cedulaGeneral: ResultadoDeclaracion['cedulaGeneral'];
  cedulaPensiones: ResultadoDeclaracion['cedulaPensiones'];
  rentaLiquidaGravable: number;
  liquidacion: ResultadoDeclaracion['liquidacion'];
}

function armarResultado(perfil: PerfilFiscal, piezas: PiezasResultado): ResultadoDeclaracion {
  const { gananciasOcasionales, dividendos, cedulaGeneral, cedulaPensiones, rentaLiquidaGravable, liquidacion } = piezas;
  const patrimonio = calcularPatrimonio(perfil);
  return {
    anioGravable: perfil.anioGravable,
    ...patrimonio,
    cedulaGeneral,
    cedulaPensiones,
    dividendos,
    gananciasOcasionales,
    comparacionPatrimonial: compararPatrimonio(
      conGananciaOcasionalNeta(perfil, gananciasOcasionales),
      patrimonio.patrimonioLiquido,
      rentaLiquidaGravable,
      // Art. 237: las rentas exentas suman a la capacidad de justificación.
      cedulaGeneral.totalExentasYDeduccionesConFueraDeLimite + cedulaPensiones.rentaExenta,
    ),
    liquidacion,
    casillas: construirCasillas(perfil, cedulaGeneral, cedulaPensiones, dividendos, gananciasOcasionales, liquidacion, patrimonio),
  };
}

/** La GO neta de la comparación patrimonial la calcula el motor; el valor externo se ignora. */
function conGananciaOcasionalNeta(perfil: PerfilFiscal, go: ResultadoGananciasOcasionales) {
  if (!perfil.comparacionPatrimonial) {
    return undefined;
  }
  return { ...perfil.comparacionPatrimonial, gananciaOcasionalNeta: go.netaParaComparacion };
}

/** Art. 300: ventas con menos de 2 años entran como renta ordinaria en no laborales. */
function conVentasCortoPlazo(perfil: PerfilFiscal, go: ResultadoGananciasOcasionales): PerfilFiscal {
  const cortas = go.ventasARentaOrdinaria;
  if (cortas.ingresos === 0 && cortas.costos === 0) {
    return perfil;
  }
  const base = perfil.rentasNoLaborales ?? { ingresosBrutos: 0, costosYGastos: 0, retencionFuente: 0 };
  return {
    ...perfil,
    rentasNoLaborales: {
      ...base,
      ingresosBrutos: base.ingresosBrutos + cortas.ingresos,
      costosYGastos: base.costosYGastos + cortas.costos,
    },
  };
}

function calcularPatrimonio(perfil: PerfilFiscal): {
  patrimonioBruto: number;
  deudas: number;
  patrimonioLiquido: number;
} {
  const patrimonioBruto = redondearMil(sumarActivos(perfil));
  const deudas = redondearMil(perfil.patrimonio.deudas);
  return { patrimonioBruto, deudas, patrimonioLiquido: Math.max(0, patrimonioBruto - deudas) };
}

function calcularRetenciones(perfil: PerfilFiscal): number {
  const laborales = perfil.certificadosLaborales.reduce((acc, x) => acc + x.retencionFuente, 0);
  const honorarios = perfil.honorarios?.retencionFuente ?? 0;
  const pensionales = perfil.rentasPensiones?.retencionFuente ?? 0;
  const noLaborales = perfil.rentasNoLaborales?.retencionFuente ?? 0;
  return redondearMil(laborales + honorarios + perfil.rentasCapital.retencionFuente + pensionales + noLaborales);
}

function sumarActivos(perfil: PerfilFiscal): number {
  return perfil.patrimonio.activos.reduce((acc, activo) => acc + activo.valor, 0);
}

function construirCasillas(
  perfil: PerfilFiscal,
  cedula: ResultadoDeclaracion['cedulaGeneral'],
  pensiones: ResultadoDeclaracion['cedulaPensiones'],
  dividendos: ResultadoDividendos,
  gananciasOcasionales: ResultadoGananciasOcasionales,
  liquidacion: ResultadoDeclaracion['liquidacion'],
  patrimonio: { patrimonioBruto: number; deudas: number; patrimonioLiquido: number },
): Record<string, number> {
  return mapearCasillas({
    facturaElectronica: cedula.deduccionFacturaElectronica,
    ...patrimonio,
    cedula,
    pensiones,
    dividendos,
    gananciasOcasionales,
    liquidacion,
    cantidadDependientes: perfil.deducciones.dependientesAdicionales336,
  });
}
