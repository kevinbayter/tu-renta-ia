/** Venta de un activo capturada en la entrevista (el motor decide GO vs renta ordinaria por fechas). */
export interface VentaActivoCapturada {
  descripcion: string;
  /** ISO YYYY-MM-DD. */
  fechaAdquisicion: string;
  fechaVenta: string;
  precioVenta: number;
  costoFiscal: number;
  esViviendaHabitacion: boolean;
  /** Dinero llevado a cuenta AFC o abonado a la hipoteca del inmueble vendido (311-1). */
  destinoAfcOHipoteca: boolean;
  retencionFuente: number;
}

export interface HerenciaCapturada {
  descripcion: string;
  tipo: 'vivienda_causante' | 'otro_inmueble_causante' | 'otros_bienes';
  esLegitimarioOConyuge: boolean;
  valor: number;
}

export interface PremioCapturado {
  descripcion: string;
  valor: number;
  retencionFuente: number;
}

/**
 * Respuestas de la entrevista: datos que NO están en exógena ni certificados
 * (o que el usuario debe confirmar).
 */
export interface RespuestasEntrevista {
  mesesConRelacionLaboral: number;
  /** Meses con mesada pensional en el año (exención 206-5 = 1.000 UVT/mes); 12 si no se indica. */
  mesesConPension?: number;
  tieneDependiente387: boolean;
  dependientesAdicionales336: number;
  /** Valor de medicina prepagada confirmado por el usuario para el año gravable. */
  pagosMedicinaPrepagadaConfirmados: number;
  interesesVivienda: number;
  interesesIcetex: number;
  /** GMF total del año (los certificados bancarios suelen traer solo una parte). */
  gmfTotalPagado: number;
  /** Rendimientos con componente inflacionario adicionales a los certificados (p. ej. FICs de exógena confirmados). */
  rendimientosAdicionalesConComponente: number;
  /** Rendimientos sin componente inflacionario (p. ej. rendimientos de cesantías). */
  rendimientosSinComponente: number;
  /** Ingresos no laborales confirmados (arriendos vía mandato, etc.), ya deduplicados. */
  ingresosNoLaborales?: number;
  /** Costos y gastos procedentes de esos ingresos (predial, administración, con soporte). */
  costosNoLaborales?: number;
  /** Activos que no vienen de certificados: bienes personales, CxC, saldos confirmados. */
  activosManuales: { descripcion: string; valor: number }[];
  deudas: number;
  declaracionesPrevias: number;
  impuestoNetoAnioAnterior: number;
  anticipoLiquidadoAnioAnterior: number;
  /** Donaciones a ESAL con certificación del donatario (descuento del 25%, art. 257). */
  donacionesEsal?: number;
  /** Aportes del año a AFC + pensiones voluntarias (arts. 126-1/126-4), según certificados. */
  aportesAfcPensionVoluntaria?: number;
  /** Cotización VOLUNTARIA al fondo de pensión obligatoria/RAIS (art. 55), según certificado. */
  aporteVoluntarioPensionObligatoria?: number;
  /** Casilla 31 de la declaración anterior; habilita la comparación patrimonial (art. 236). */
  patrimonioLiquidoAnterior?: number;
  /** Causas justificativas del incremento patrimonial (art. 239): herencias, préstamos, valorizaciones. */
  justificacionesPatrimoniales?: number;

  /** Ganancias ocasionales capturadas (el motor las liquida desde la Fase 3). */
  ventasActivos?: VentaActivoCapturada[];
  herenciasRecibidas?: HerenciaCapturada[];
  premiosRecibidos?: PremioCapturado[];

  /**
   * Eventos del año (0/1). Venta/herencia/premios marcan que HAY datos por
   * capturar (incompleta hasta que sus listas tengan elementos); el resto son
   * casos que el motor aún no liquida y dejan la declaración incompleta.
   */
  eventoVentaActivos?: number;
  eventoHerenciaODonacion?: number;
  eventoPremiosOApuestas?: number;
  eventoCripto?: number;
  eventoActivosExterior?: number;
  eventoIngresosExterior?: number;
  eventoDividendos?: number;
  eventoRetirosAfcSinRequisitos?: number;
}
