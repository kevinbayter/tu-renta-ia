// Adaptadores de infraestructura (implementan puertos de @turenta/core).
export { OpenAiCompatibleLlmAdapter, type LlmProviderConfig } from './llm/openai-compatible-llm-adapter';
export { crearLlmDesdeEnv } from './llm/crear-llm';
export { parsearExogena } from './extraccion/exogena/parser-exogena';
export { extraerTextoPdf, type TextoPdf } from './extraccion/pdf/extraer-texto';
export { ExtractorCertificados } from './extraccion/certificados/extractor-certificados';
export { generarPdfBorrador210, type DatosDeclarante } from './generacion/pdf-borrador-210';
export { RepositorioPrisma } from './persistencia/repositorio-prisma';
export { EmailConsolaAdapter } from './email/email-consola';
