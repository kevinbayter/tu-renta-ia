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

export interface ResultadoCedulaGeneral {
  trabajo: ResultadoRentasTrabajo;
  capital: ResultadoRentasCapital;
  rentaLiquidaCedula: number;
  limiteGlobal: number;
  deduccionFacturaElectronica: number;
  deduccionDependientesAdicionales: number;
  totalExentasYDeduccionesConFueraDeLimite: number;
  rentaLiquidaGravable: number;
}

export interface ResultadoLiquidacion {
  impuestoSobreRentaLiquida: number;
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
  liquidacion: ResultadoLiquidacion;
  /** Casillas del formulario 210 (clave = número de casilla). */
  casillas: Record<string, number>;
}
