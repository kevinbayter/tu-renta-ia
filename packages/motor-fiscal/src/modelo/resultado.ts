/** Resultado de la liquidación. Valores ya redondeados a miles (casillas del 210). */

export interface ResultadoRentasTrabajo {
  ingresosBrutos: number;
  incrngo: number;
  rentaLiquida: number;
  deduccionDependientes: number;
  deduccionPrepagada: number;
  deduccionIntereses: number;
  totalDeduccionesImputables: number;
  cesantiasExentas: number;
  exenta25: number;
  totalRentasExentas: number;
  solicitadoExentasYDeducciones: number;
  asignadoLimitado: number;
  rentaLiquidaOrdinaria: number;
}

export interface ResultadoRentasCapital {
  ingresosBrutos: number;
  incrngoComponenteInflacionario: number;
  rentaLiquida: number;
  deduccionGmf: number;
  solicitadoExentasYDeducciones: number;
  asignadoLimitado: number;
  rentaLiquidaOrdinaria: number;
}

export interface ResultadoRentasPensiones {
  ingresosBrutos: number;
  incrngo: number;
  rentaLiquida: number;
  rentaExenta: number;
  rentaLiquidaGravable: number;
}

export interface ResultadoRentasNoLaborales {
  ingresosBrutos: number;
  costosYGastos: number;
  rentaLiquida: number;
  asignadoLimitado: number;
  rentaLiquidaOrdinaria: number;
}

export interface ResultadoCedulaGeneral {
  trabajo: ResultadoRentasTrabajo;
  capital: ResultadoRentasCapital;
  noLaborales: ResultadoRentasNoLaborales;
  rentaLiquidaCedula: number;
  limiteGlobal: number;
  deduccionFacturaElectronica: number;
  deduccionDependientesAdicionales: number;
  totalExentasYDeduccionesConFueraDeLimite: number;
  rentaLiquidaGravable: number;
}

export interface ResultadoDescuentos {
  donacionesRealizadas: number;
  porDonaciones: number;
  /** Tope del art. 258 (25% del impuesto) que se pudo aplicar. */
  limiteAplicado: number;
  total: number;
}

export interface ResultadoComparacionPatrimonial {
  /** false cuando no se informó el patrimonio líquido del año anterior. */
  aplica: boolean;
  patrimonioLiquidoAnterior: number;
  incremento: number;
  capacidadDeJustificacion: number;
  /** > 0 exige explicación al usuario (art. 239); la plataforma NO la grava sola. */
  diferenciaSinJustificar: number;
}

export interface ResultadoLiquidacion {
  impuestoSobreRentaLiquida: number;
  descuentos: ResultadoDescuentos;
  impuestoNetoRenta: number;
  totalImpuestoACargo: number;
  anticipoAnioSiguiente: number;
  retenciones: number;
  saldoFavorAnterior: number;
  anticipoLiquidadoAnterior: number;
  saldoAPagar: number;
  totalSaldoAFavor: number;
}

export interface ResultadoDeclaracion {
  anioGravable: number;
  patrimonioBruto: number;
  deudas: number;
  patrimonioLiquido: number;
  cedulaGeneral: ResultadoCedulaGeneral;
  cedulaPensiones: ResultadoRentasPensiones;
  comparacionPatrimonial: ResultadoComparacionPatrimonial;
  liquidacion: ResultadoLiquidacion;
  /** Casillas del formulario 210 (clave = número de casilla). */
  casillas: Record<string, number>;
}
