/**
 * Respuestas de la entrevista: datos que NO están en exógena ni certificados
 * (o que el usuario debe confirmar). En Fase 3 la entrevista conversacional
 * llenará esta estructura; hoy se llena programáticamente.
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
  /** Casilla 31 de la declaración anterior; habilita la comparación patrimonial (art. 236). */
  patrimonioLiquidoAnterior?: number;
  /** Causas justificativas del incremento patrimonial (art. 239): herencias, préstamos, valorizaciones. */
  justificacionesPatrimoniales?: number;
}
