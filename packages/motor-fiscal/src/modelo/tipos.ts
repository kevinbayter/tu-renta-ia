/** Modelo de dominio del perfil fiscal. Montos en pesos COP enteros, sin redondear. */

export interface CertificadoLaboral {
  nitEmpleador: string;
  /** Todos los pagos laborales del 220 EXCEPTO cesantías (salarios, prestaciones, otros). */
  pagosLaborales: number;
  /** Casilla 47 del 220: cesantías e intereses efectivamente pagados. */
  cesantiasPagadas: number;
  /** Casilla 49 del 220: cesantías consignadas al fondo. */
  cesantiasConsignadas: number;
  aportesSalud: number;
  aportesPension: number;
  retencionFuente: number;
  /** Casilla 59 del 220: ingreso laboral promedio últimos 6 meses (exención cesantías). */
  ingresoPromedioSeisMeses: number;
}

export interface RentasCapitalInput {
  /** Rendimientos financieros con derecho a componente inflacionario (bancos, FICs). */
  rendimientosConComponente: number;
  /** Rendimientos sin componente inflacionario (p. ej. rendimientos de cesantías). */
  rendimientosSinComponente: number;
  gmfPagado: number;
  retencionFuente: number;
}

export interface DeduccionesInput {
  /** Meses con relación laboral en el año (prorratea topes mensuales). */
  mesesConRelacionLaboral: number;
  /** Aplica la deducción del 10% por dependientes (art. 387). */
  tieneDependiente387: boolean;
  /** Dependientes para la deducción de 72 UVT c/u (art. 336-3), máx. según constantes. */
  dependientesAdicionales336: number;
  pagosMedicinaPrepagada: number;
  interesesVivienda: number;
  interesesIcetex: number;
}

export interface RentasNoLaboralesInput {
  /** Arriendos vía mandato, honorarios sin vínculo y demás del art. 335 (ya deduplicados). */
  ingresosBrutos: number;
  /** Costos y gastos procedentes con soporte (num. 4 art. 336). */
  costosYGastos: number;
  retencionFuente: number;
}

export interface RentasPensionesInput {
  /** Pensiones de jubilación, invalidez, vejez, sobrevivientes y riesgos laborales (art. 337). */
  ingresosBrutos: number;
  /** INCRNGO: aportes obligatorios a salud y al fondo de solidaridad del pensionado. */
  aportesSaludYFsp: number;
  retencionFuente: number;
  /** Meses con mesada en el año (la exención del 206-5 es de 1.000 UVT por mes). */
  mesesConPension: number;
}

export interface ActivoPatrimonial {
  descripcion: string;
  valor: number;
}

export interface PatrimonioInput {
  activos: ActivoPatrimonial[];
  deudas: number;
}

export interface HistorialInput {
  /** Número de declaraciones presentadas antes de esta (define % de anticipo). */
  declaracionesPrevias: number;
  impuestoNetoAnioAnterior: number;
  saldoFavorAnioAnterior: number;
  anticipoLiquidadoAnioAnterior: number;
}

export interface PerfilFiscal {
  anioGravable: number;
  certificadosLaborales: CertificadoLaboral[];
  rentasCapital: RentasCapitalInput;
  /** Rentas no laborales de la cédula general (art. 335); ausente = sin estos ingresos. */
  rentasNoLaborales?: RentasNoLaboralesInput;
  /** Cédula de pensiones (art. 337); ausente = sin ingresos pensionales. */
  rentasPensiones?: RentasPensionesInput;
  deducciones: DeduccionesInput;
  /** Monto de compras con factura electrónica susceptible del beneficio del 1%. */
  comprasFacturaElectronica: number;
  patrimonio: PatrimonioInput;
  historial: HistorialInput;
}
