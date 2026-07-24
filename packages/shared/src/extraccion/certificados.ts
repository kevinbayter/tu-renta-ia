import { z } from 'zod';

/**
 * Schemas Zod de los datos extraídos de documentos tributarios por el LLM.
 * Montos en pesos COP enteros (sin puntos ni decimales). 0 cuando no aparece.
 * strictObject → additionalProperties:false en el JSON Schema (extracción estricta).
 */

export const clasificacionDocumentoSchema = z.strictObject({
  tipo: z.enum(['certificado_220', 'certificado_bancario', 'medicina_prepagada', 'exogena', 'otro']),
});
export type ClasificacionDocumento = z.infer<typeof clasificacionDocumentoSchema>;

export const certificado220Schema = z.strictObject({
  tipoDocumento: z.literal('certificado_220'),
  nitRetenedor: z.string(),
  razonSocial: z.string(),
  anioGravable: z.number().int(),
  /** Período de la certificación (fechas De → A del encabezado), YYYY-MM-DD o "". */
  periodoInicio: z.string(),
  periodoFin: z.string(),
  pagosSalarios: z.number().int(),
  pagosPrestaciones: z.number().int(),
  otrosPagos: z.number().int(),
  /** Casilla 48 del 220: pensiones de jubilación, vejez o invalidez (0 si no aplica). */
  pagosPension: z.number().int(),
  cesantiasPagadas: z.number().int(),
  cesantiasConsignadas: z.number().int(),
  totalIngresosBrutos: z.number().int(),
  aportesSalud: z.number().int(),
  aportesPension: z.number().int(),
  ingresoPromedioSeisMeses: z.number().int(),
  retencionFuente: z.number().int(),
});
export type Certificado220Extraido = z.infer<typeof certificado220Schema>;

export const certificadoBancarioSchema = z.strictObject({
  tipoDocumento: z.literal('certificado_bancario'),
  entidad: z.string(),
  anioGravable: z.number().int(),
  saldoCuentas: z.number().int(),
  rendimientos: z.number().int(),
  gmf: z.number().int(),
  retencionFuente: z.number().int(),
  componenteInflacionarioInformado: z.number().int(),
});
export type CertificadoBancarioExtraido = z.infer<typeof certificadoBancarioSchema>;

export const certificadoPrepagadaSchema = z.strictObject({
  tipoDocumento: z.literal('medicina_prepagada'),
  entidad: z.string(),
  amparos: z.array(
    z.strictObject({
      valor: z.number().int(),
      vigenciaInicio: z.string(),
      vigenciaFin: z.string(),
    }),
  ),
});
export type CertificadoPrepagadaExtraido = z.infer<typeof certificadoPrepagadaSchema>;

export type CertificadoExtraido =
  | Certificado220Extraido
  | CertificadoBancarioExtraido
  | CertificadoPrepagadaExtraido;

/** JSON Schemas (draft 2020-12) para response_format json_schema del LLM. */
export const jsonSchemas = {
  clasificacion: z.toJSONSchema(clasificacionDocumentoSchema),
  certificado220: z.toJSONSchema(certificado220Schema),
  certificadoBancario: z.toJSONSchema(certificadoBancarioSchema),
  certificadoPrepagada: z.toJSONSchema(certificadoPrepagadaSchema),
} as const;
