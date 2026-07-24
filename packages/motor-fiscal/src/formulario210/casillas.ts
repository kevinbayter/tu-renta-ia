import type { ResultadoCedulaGeneral, ResultadoLiquidacion } from '../modelo/resultado';

interface DatosCasillas {
  facturaElectronica: number;
  patrimonioBruto: number;
  deudas: number;
  patrimonioLiquido: number;
  cedula: ResultadoCedulaGeneral;
  liquidacion: ResultadoLiquidacion;
  cantidadDependientes: number;
}

/** Mapea el resultado a casillas del formulario 210 (Res. DIAN 000044/2024). */
export function mapearCasillas(d: DatosCasillas): Record<string, number> {
  return {
    ...casillasPatrimonio(d),
    ...casillasTrabajo(d.cedula),
    ...casillasCapital(d.cedula),
    ...casillasConsolidacion(d.cedula),
    ...casillasLiquidacion(d.liquidacion),
    ...casillasDependientes(d),
  };
}

function casillasPatrimonio(d: DatosCasillas): Record<string, number> {
  return {
    '28': d.facturaElectronica,
    '29': d.patrimonioBruto,
    '30': d.deudas,
    '31': d.patrimonioLiquido,
  };
}

function casillasTrabajo(cedula: ResultadoCedulaGeneral): Record<string, number> {
  const t = cedula.trabajo;
  return {
    '32': t.ingresosBrutos,
    '33': t.incrngo,
    '34': t.rentaLiquida,
    '36': t.totalRentasExentas,
    '37': t.totalRentasExentas,
    '39': t.totalDeduccionesImputables,
    '40': t.totalDeduccionesImputables,
    '41': t.asignadoLimitado,
    '42': t.rentaLiquidaOrdinaria,
  };
}

function casillasCapital(cedula: ResultadoCedulaGeneral): Record<string, number> {
  const k = cedula.capital;
  return {
    '58': k.ingresosBrutos,
    '59': k.incrngoComponenteInflacionario,
    '61': k.rentaLiquida,
    '67': k.deduccionGmf,
    '68': k.deduccionGmf,
    '69': k.asignadoLimitado,
    '70': k.rentaLiquidaOrdinaria,
    '73': k.rentaLiquidaOrdinaria,
  };
}

function casillasConsolidacion(cedula: ResultadoCedulaGeneral): Record<string, number> {
  return {
    '91': cedula.rentaLiquidaCedula,
    '92': cedula.totalExentasYDeduccionesConFueraDeLimite,
    '93': cedula.rentaLiquidaGravable,
    '97': cedula.rentaLiquidaGravable,
  };
}

function casillasLiquidacion(l: ResultadoLiquidacion): Record<string, number> {
  return {
    '116': l.impuestoSobreRentaLiquida,
    '121': l.impuestoSobreRentaLiquida,
    '126': l.impuestoNetoRenta,
    '127': 0,
    '129': l.totalImpuestoACargo,
    '130': l.anticipoLiquidadoAnterior,
    '131': l.saldoFavorAnterior,
    '132': l.retenciones,
    '133': l.anticipoAnioSiguiente,
    '134': l.saldoAPagar,
    '136': l.saldoAPagar,
    '137': l.totalSaldoAFavor,
  };
}

function casillasDependientes(d: DatosCasillas): Record<string, number> {
  return {
    '138': d.cantidadDependientes,
    '139': d.cedula.deduccionDependientesAdicionales,
  };
}
