import { z } from 'zod';

/**
 * Salida estructurada de cada turno del entrevistador IA.
 * El LLM conversa Y captura datos en el mismo turno; el usuario los confirma en la UI.
 * Booleanos como 0/1 (tieneDependiente387) para mantener el schema homogéneo.
 */

export const CAMPOS_ENTREVISTA = [
  'mesesConRelacionLaboral',
  'tieneDependiente387',
  'dependientesAdicionales336',
  'pagosMedicinaPrepagadaConfirmados',
  'interesesVivienda',
  'interesesIcetex',
  'gmfTotalPagado',
  'rendimientosAdicionalesConComponente',
  'rendimientosSinComponente',
  'deudas',
  'declaracionesPrevias',
  'impuestoNetoAnioAnterior',
  'anticipoLiquidadoAnioAnterior',
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
  entrevistaCompleta: z.boolean(),
});

export type TurnoEntrevista = z.infer<typeof turnoEntrevistaSchema>;
export type CampoEntrevista = (typeof CAMPOS_ENTREVISTA)[number];

export const jsonSchemaTurnoEntrevista = z.toJSONSchema(turnoEntrevistaSchema);
