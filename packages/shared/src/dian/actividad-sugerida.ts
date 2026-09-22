import { z } from 'zod';

/** Respuesta de la IA al sugerir la casilla 24; el código se valida luego contra el catálogo. */
export const actividadSugeridaSchema = z.strictObject({ codigo: z.string(), razon: z.string() });

export type ActividadSugerida = z.infer<typeof actividadSugeridaSchema>;

export const jsonSchemaActividadSugerida = {
  type: 'object',
  properties: { codigo: { type: 'string' }, razon: { type: 'string' } },
  required: ['codigo', 'razon'],
  additionalProperties: false,
} as const;
