// Adaptadores de infraestructura (implementan puertos de @turenta/core).
export { OpenAiCompatibleLlmAdapter, type LlmProviderConfig } from './llm/openai-compatible-llm-adapter';
export { crearLlmDesdeEnv } from './llm/crear-llm';
export { parsearExogena } from './extraccion/exogena/parser-exogena';
export { extraerTextoPdf, type TextoPdf } from './extraccion/pdf/extraer-texto';
export { renderizarPdf } from './extraccion/pdf/renderizar-pdf';
export { ExtractorCertificados } from './extraccion/certificados/extractor-certificados';
export { generarResumenElegante, type DatosDeclarante } from './generacion/resumen/resumen-elegante';
export { generarBorradorCompleto } from './generacion/borrador-completo';
export { generarFormulario210, calcularDigitoVerificacion } from './generacion/formulario210/generar-formulario-210';
export { RepositorioPrisma } from './persistencia/repositorio-prisma';
export { EmailConsolaAdapter } from './email/email-consola';
export { EmailSmtpAdapter, type SmtpConfig } from './email/email-smtp';
export { EmailBrevoAdapter, type BrevoConfig } from './email/email-brevo';
export { crearEmailDesdeEnv } from './email/crear-email';
// OJO: ConexionMuisca NO se exporta aquí a propósito. Vive tras el subpath
// '@turenta/adaptadores/dian' para que apps/web no arrastre Playwright ni
// Chromium: quien ejecuta el navegador es el worker aislado (PLAN-DIAN §2).
export {
  ConexionDianRemota,
  type ConfigWorkerDian,
} from './dian/conexion-dian-remota';
export {
  crearConexionDianDesdeEnv,
  conexionDianHabilitada,
} from './dian/crear-conexion-dian';
export { LimitadorDian } from './dian/limitador-dian';
export {
  EvidenciaAutorizacionPrisma,
  hashDelTexto,
  hashAutorizacion,
  limiteDeRetencion,
  ANIOS_RETENCION_EVIDENCIA,
} from './persistencia/evidencia-autorizacion-prisma';
export {
  BovedaCredencialesPrisma,
  limiteDeInactividad,
  DIAS_SIN_USO_ANTES_DE_BORRAR,
} from './persistencia/boveda-credenciales-prisma';
