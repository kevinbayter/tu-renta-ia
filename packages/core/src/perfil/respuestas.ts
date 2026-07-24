/**
 * Respuestas de la entrevista: datos que NO están en exógena ni certificados
 * (o que el usuario debe confirmar). En Fase 3 la entrevista conversacional
 * llenará esta estructura; hoy se llena programáticamente.
 */
export interface RespuestasEntrevista {
  mesesConRelacionLaboral: number;
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
  /** Activos que no vienen de certificados: bienes personales, CxC, saldos confirmados. */
  activosManuales: { descripcion: string; valor: number }[];
  deudas: number;
  declaracionesPrevias: number;
  impuestoNetoAnioAnterior: number;
  anticipoLiquidadoAnioAnterior: number;
}
