// Adaptadores de infraestructura (implementan puertos de @turenta/core).
export { OpenAiCompatibleLlmAdapter, type LlmProviderConfig } from './llm/openai-compatible-llm-adapter';
export { crearLlmDesdeEnv } from './llm/crear-llm';
export { parsearExogena } from './extraccion/exogena/parser-exogena';
export { extraerTextoPdf, type TextoPdf } from './extraccion/pdf/extraer-texto';
export { ExtractorCertificados } from './extraccion/certificados/extractor-certificados';
export { generarResumenElegante, type DatosDeclarante } from './generacion/resumen/resumen-elegante';
export { generarBorradorCompleto } from './generacion/borrador-completo';
export { generarFormulario210, calcularDigitoVerificacion } from './generacion/formulario210/generar-formulario-210';
export { RepositorioPrisma } from './persistencia/repositorio-prisma';
export { EmailConsolaAdapter } from './email/email-consola';
export { EmailSmtpAdapter, type SmtpConfig } from './email/email-smtp';
export { EmailBrevoAdapter, type BrevoConfig } from './email/email-brevo';
export { crearEmailDesdeEnv } from './email/crear-email';
