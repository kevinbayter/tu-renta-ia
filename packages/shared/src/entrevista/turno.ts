import { z } from 'zod';

/**
 * Salida estructurada de cada turno del entrevistador IA.
 * El LLM conversa Y captura datos en el mismo turno; el usuario los confirma en la UI.
 * Booleanos como 0/1 (tieneDependiente387) para mantener el schema homogéneo.
 */

export const CAMPOS_ENTREVISTA = [
  'mesesConRelacionLaboral',
  'mesesConPension',
  'tieneDependiente387',
  'dependientesAdicionales336',
  'pagosMedicinaPrepagadaConfirmados',
  'interesesVivienda',
  'interesesIcetex',
  'gmfTotalPagado',
  'rendimientosAdicionalesConComponente',
  'rendimientosSinComponente',
  'ingresosNoLaborales',
  'costosNoLaborales',
  'deudas',
  'declaracionesPrevias',
  'impuestoNetoAnioAnterior',
  'anticipoLiquidadoAnioAnterior',
  'donacionesEsal',
  'aportesAfcPensionVoluntaria',
  'aporteVoluntarioPensionObligatoria',
  'dividendosNoGravados',
  'dividendosGravados',
  'retencionDividendos',
  'patrimonioLiquidoAnterior',
  'justificacionesPatrimoniales',
  'eventoVentaActivos',
  'eventoHerenciaODonacion',
  'eventoPremiosOApuestas',
  'eventoCripto',
  'eventoActivosExterior',
  'eventoIngresosExterior',
  'eventoDividendos',
  'eventoRetirosAfcSinRequisitos',
] as const;

export const turnoEntrevistaSchema = z.strictObject({
  mensajeParaUsuario: z.string(),
  camposCapturados: z.array(
    z.strictObject({
      campo: z.enum(CAMPOS_ENTREVISTA),
      valor: z.number(),
    }),
  ),
  activosCapturados: z.array(
    z.strictObject({
      descripcion: z.string(),
      valor: z.number(),
    }),
  ),
  /** Ventas de activos del año, con TODOS sus datos (fechas ISO YYYY-MM-DD). */
  ventasActivosCapturadas: z.array(
    z.strictObject({
      descripcion: z.string(),
      fechaAdquisicion: z.string(),
      fechaVenta: z.string(),
      precioVenta: z.number(),
      costoFiscal: z.number(),
      esViviendaHabitacion: z.number(),
      destinoAfcOHipoteca: z.number(),
      retencionFuente: z.number(),
    }),
  ),
  herenciasCapturadas: z.array(
    z.strictObject({
      descripcion: z.string(),
      tipo: z.enum(['vivienda_causante', 'otro_inmueble_causante', 'otros_bienes']),
      esLegitimarioOConyuge: z.number(),
      valor: z.number(),
    }),
  ),
  premiosCapturados: z.array(
    z.strictObject({
      descripcion: z.string(),
      valor: z.number(),
      retencionFuente: z.number(),
    }),
  ),
  entrevistaCompleta: z.boolean(),
});

export type TurnoEntrevista = z.infer<typeof turnoEntrevistaSchema>;
export type CampoEntrevista = (typeof CAMPOS_ENTREVISTA)[number];

export const jsonSchemaTurnoEntrevista = z.toJSONSchema(turnoEntrevistaSchema);
