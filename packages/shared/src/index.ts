export {
  clasificacionDocumentoSchema,
  certificado220Schema,
  certificadoBancarioSchema,
  certificadoPrepagadaSchema,
  jsonSchemas,
} from './extraccion/certificados';
export type {
  ClasificacionDocumento,
  Certificado220Extraido,
  CertificadoBancarioExtraido,
  CertificadoPrepagadaExtraido,
  CertificadoExtraido,
} from './extraccion/certificados';
export {
  CAMPOS_ENTREVISTA,
  turnoEntrevistaSchema,
  jsonSchemaTurnoEntrevista,
} from './entrevista/turno';
export type { TurnoEntrevista, CampoEntrevista } from './entrevista/turno';
