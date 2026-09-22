export {
  clasificacionDocumentoSchema,
  certificado220Schema,
  certificadoBancarioSchema,
  certificadoPrepagadaSchema,
  declaracionAnteriorSchema,
  jsonSchemas,
} from './extraccion/certificados';
export type {
  ClasificacionDocumento,
  Certificado220Extraido,
  CertificadoBancarioExtraido,
  CertificadoPrepagadaExtraido,
  DeclaracionAnteriorExtraida,
  CertificadoExtraido,
} from './extraccion/certificados';
export {
  CAMPOS_ENTREVISTA,
  turnoEntrevistaSchema,
  jsonSchemaTurnoEntrevista,
} from './entrevista/turno';
export type { TurnoEntrevista, CampoEntrevista } from './entrevista/turno';
export { ACTIVIDADES_ECONOMICAS_DIAN, nombreActividadEconomica } from './dian/actividades-economicas';
export { actividadSugeridaSchema, jsonSchemaActividadSugerida, type ActividadSugerida } from './dian/actividad-sugerida';
