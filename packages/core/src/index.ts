export { type LlmPort } from './puertos/llm-port';
export { type ArchivoStoragePort } from './puertos/archivo-storage-port';
export {
  type ExtractorDocumentosPort,
  type DocumentoFuente,
  type ResultadoExtraccion,
} from './puertos/extractor-documentos-port';
export {
  type RepositorioPort,
  type EmailPort,
  type UsuarioRegistrado,
} from './puertos/repositorio-port';
export { type FilaExogena, type TopesExogena, type ExogenaParseada } from './exogena/tipos';
export {
  saldoAFavorAnterior,
  comprasFacturaElectronicaConBeneficio,
  retencionesReportadas,
  rendimientosReportados,
  saldosPatrimonialesReportados,
  obligadoADeclarar,
  umbralesObligadoADeclarar,
} from './exogena/interpretar';
export { type RespuestasEntrevista } from './perfil/respuestas';
export { construirPerfilFiscal, type InsumosPerfil } from './perfil/construir-perfil';
