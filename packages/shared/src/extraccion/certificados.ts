import { z } from 'zod';

/**
 * Schemas Zod de los datos extraídos de documentos tributarios por el LLM.
 * Montos en pesos COP enteros (sin puntos ni decimales). 0 cuando no aparece.
 * strictObject → additionalProperties:false en el JSON Schema (extracción estricta).
 */

export const clasificacionDocumentoSchema = z.strictObject({
  tipo: z.enum([
    'certificado_220',
    'certificado_bancario',
    'medicina_prepagada',
    'exogena',
    'declaracion_anterior',
    'otro',
  ]),
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

/**
 * Declaración de renta (formulario 210) de un año gravable ANTERIOR. Evita
 * preguntarle al usuario datos que él no recuerda: los lee de su propio PDF.
 */
export const declaracionAnteriorSchema = z.strictObject({
  tipoDocumento: z.literal('declaracion_anterior'),
  /** Año gravable de ESA declaración (no el que se está preparando). */
  anioGravable: z.number().int(),
  /** Casilla 29: patrimonio bruto. Sirve para comprobar que la 31 se leyó bien. */
  patrimonioBruto: z.number().int(),
  /** Casilla 30: deudas. Con la 29 verifica la 31 sin creerle al modelo. */
  deudas: z.number().int(),
  /** Casilla 31: patrimonio líquido (base de la comparación patrimonial, art. 236). */
  patrimonioLiquido: z.number().int(),
  /** Casilla 126: impuesto neto de renta. */
  impuestoNetoRenta: z.number().int(),
  /** Casilla 133: anticipo liquidado para el año siguiente. */
  anticipoAnioSiguiente: z.number().int(),
  /** Casilla 137: total saldo a favor. */
  totalSaldoAFavor: z.number().int(),
});
export type DeclaracionAnteriorExtraida = z.infer<typeof declaracionAnteriorSchema>;

export type CertificadoExtraido =
  | Certificado220Extraido
  | CertificadoBancarioExtraido
  | CertificadoPrepagadaExtraido
  | DeclaracionAnteriorExtraida;

/** JSON Schemas (draft 2020-12) para response_format json_schema del LLM. */
export const jsonSchemas = {
  clasificacion: z.toJSONSchema(clasificacionDocumentoSchema),
  certificado220: z.toJSONSchema(certificado220Schema),
  certificadoBancario: z.toJSONSchema(certificadoBancarioSchema),
  certificadoPrepagada: z.toJSONSchema(certificadoPrepagadaSchema),
  declaracionAnterior: z.toJSONSchema(declaracionAnteriorSchema),
} as const;
