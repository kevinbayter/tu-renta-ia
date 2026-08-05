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

export interface AportesVoluntariosInput {
  /** AFC (126-4) + pensiones voluntarias (126-1): renta exenta con límite conjunto 30%/3.800 UVT. */
  afcYPensionVoluntaria: number;
  /** Cotización voluntaria al fondo de pensión OBLIGATORIA (art. 55): INCRNGO 25%/2.500 UVT. */
  voluntarioPensionObligatoria: number;
}

export interface HonorariosInput {
  /** Honorarios y compensaciones por servicios personales SIN relación laboral (facturas/cuentas de cobro). */
  ingresos: number;
  /** Costos y gastos procedentes con soporte (excluyentes con el 25% — art. 336-4). */
  costos: number;
  /** Aportes PILA del independiente a salud y pensión obligatorias (INCRNGO). */
  aportesObligatorios: number;
  retencionFuente: number;
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

export interface VentaActivoInput {
  descripcion: string;
  /** Fechas ISO (YYYY-MM-DD). El motor decide con ellas: ≥2 años GO, <2 años renta ordinaria (art. 300). */
  fechaAdquisicion: string;
  fechaVenta: string;
  precioVenta: number;
  costoFiscal: number;
  esViviendaHabitacion: boolean;
  /** Dinero depositado en cuenta AFC o abonado a la hipoteca del inmueble vendido (exención 311-1). */
  destinoAfcOHipoteca: boolean;
  /** Retención practicada en la venta (p. ej. 1% en la escritura). */
  retencionFuente: number;
}

export interface HerenciaDonacionInput {
  descripcion: string;
  tipo: 'vivienda_causante' | 'otro_inmueble_causante' | 'otros_bienes';
  /** true = heredero/legatario legitimario o cónyuge (num. 3 art. 307); false = num. 4 (20%, tope 1.625 UVT). */
  esLegitimarioOConyuge: boolean;
  /** Valor del bien según art. 303 (a 31-dic del año anterior a la sucesión/donación). */
  valor: number;
}

export interface PremioInput {
  descripcion: string;
  valor: number;
  /** Retención del 20% practicada por el operador (premios >48 UVT). */
  retencionFuente: number;
}

export interface GananciasOcasionalesInput {
  ventas: VentaActivoInput[];
  herencias: HerenciaDonacionInput[];
  premios: PremioInput[];
}

export interface DescuentosInput {
  /** Donaciones a ESAL del régimen especial con certificación (art. 257). */
  donacionesEsal: number;
}

export interface DividendosInput {
  /** 1ª subcédula: utilidades 2017+ NO gravadas en cabeza de la sociedad (num. 3 art. 49). */
  noGravados: number;
  /** 2ª subcédula: utilidades gravadas (par. 2 art. 49) — 35% y el neto a la tabla. */
  gravados: number;
  retencionFuente: number;
}

export interface ComparacionPatrimonialInput {
  /** Casilla 31 de la declaración del año anterior; 0 = no se compara. */
  patrimonioLiquidoAnterior: number;
  gananciaOcasionalNeta: number;
  /** Impuestos de renta y complementarios pagados durante el año (art. 237). */
  impuestosPagadosEnElAnio: number;
  /** Causas justificativas declaradas por el usuario (art. 239): herencias, préstamos, valorizaciones. */
  justificacionesDeclaradas: number;
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
  /** Honorarios de independiente (subcédula 43-57); ausente = sin honorarios. */
  honorarios?: HonorariosInput;
  rentasCapital: RentasCapitalInput;
  /** Rentas no laborales de la cédula general (art. 335); ausente = sin estos ingresos. */
  rentasNoLaborales?: RentasNoLaboralesInput;
  /** Cédula de pensiones (art. 337); ausente = sin ingresos pensionales. */
  rentasPensiones?: RentasPensionesInput;
  deducciones: DeduccionesInput;
  /** Aportes voluntarios a AFC/pensión (arts. 55, 126-1, 126-4); ausente = sin aportes. */
  aportesVoluntarios?: AportesVoluntariosInput;
  /** Monto de compras con factura electrónica susceptible del beneficio del 1%. */
  comprasFacturaElectronica: number;
  patrimonio: PatrimonioInput;
  /** Descuentos tributarios (art. 257); ausente = sin descuentos. */
  descuentos?: DescuentosInput;
  /** Ganancias ocasionales (arts. 300-317); ausente = sin GO. */
  gananciasOcasionales?: GananciasOcasionalesInput;
  /** Cédula de dividendos (arts. 242, 254-1); ausente = sin dividendos. */
  dividendos?: DividendosInput;
  /** Datos para la comparación patrimonial (arts. 236-239); ausente = no se evalúa. */
  comparacionPatrimonial?: ComparacionPatrimonialInput;
  historial: HistorialInput;
}
