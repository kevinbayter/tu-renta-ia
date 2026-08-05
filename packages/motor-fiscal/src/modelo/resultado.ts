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

export interface ResultadoHonorarios {
  ingresosBrutos: number;
  incrngo: number;
  costos: number;
  rentaLiquida: number;
  exenta25: number;
  solicitadoExentasYDeducciones: number;
  /** Modo ganador del art. 336-4 (se liquidan ambos y gana el de menor RLG). */
  modo: 'costos' | 'renta_exenta_25';
  asignadoLimitado: number;
  rentaLiquidaOrdinaria: number;
}

export interface ResultadoCedulaGeneral {
  trabajo: ResultadoRentasTrabajo;
  honorarios: ResultadoHonorarios;
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
  /** Descuento por dividendos del art. 254-1 (fuera del tope del 258). */
  porDividendos: number;
  /** Tope del art. 258 (25% del impuesto) que se pudo aplicar a las donaciones. */
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

export interface ResultadoDividendos {
  /** Casilla 107: 1ª subcédula 2017+ (num. 3 art. 49). */
  noGravados: number;
  /** Casilla 108: 2ª subcédula 2017+ (par. 2 art. 49). */
  gravados: number;
  /** 35% sobre la 2ª subcédula (art. 242). */
  impuestoGravados35: number;
  netoGravadosATabla: number;
  /** Lo que suma a la base de la tabla 241 (art. 331): noGravados + neto de gravados. */
  baseParaTabla: number;
  /** Descuento del art. 254-1 (19% sobre el exceso de 1.090 UVT de la 1ª subcédula). */
  descuento: number;
  retencionFuente: number;
}

export interface ResultadoGananciasOcasionales {
  /** Casilla 112: precios de venta GO + valores de herencias/donaciones + premios. */
  ingresos: number;
  /** Casilla 113: costo fiscal de los activos vendidos (≥2 años). */
  costos: number;
  /** Casilla 114: exenciones 307 y 311-1. */
  exentas: number;
  /** Casilla 115. */
  gravables: number;
  baseTarifaGeneral: number;
  basePremios: number;
  /** Casilla 127: 15% general + 20% premios. */
  impuesto: number;
  retenciones: number;
  /** Ventas <2 años (art. 300): van a rentas no laborales como renta ordinaria. */
  ventasARentaOrdinaria: { ingresos: number; costos: number };
  /** Ingresos − costos: capacidad de justificación patrimonial (art. 237). */
  netaParaComparacion: number;
}

export interface ResultadoLiquidacion {
  impuestoSobreRentaLiquida: number;
  /** 35% de la 2ª subcédula de dividendos (art. 242); 0 sin dividendos gravados. */
  impuestoDividendosGravados: number;
  descuentos: ResultadoDescuentos;
  impuestoNetoRenta: number;
  impuestoGananciasOcasionales: number;
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
  dividendos: ResultadoDividendos;
  gananciasOcasionales: ResultadoGananciasOcasionales;
  comparacionPatrimonial: ResultadoComparacionPatrimonial;
  liquidacion: ResultadoLiquidacion;
  /** Casillas del formulario 210 (clave = número de casilla). */
  casillas: Record<string, number>;
}
