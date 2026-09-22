export { type LlmPort } from './puertos/llm-port';
export { extraerValidado, type Validador } from './llm/extraer-validado';
export { GENEROS_DIAN, esGeneroValido } from './perfil/genero';
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
  type PerfilUsuario,
  type TitularDeclaracion,
  type DeclaracionResumen,
  type PersonaAdministrada,
  type EventoActividad,
  type NotificacionUsuario,
  type NotificacionNueva,
} from './puertos/repositorio-port';
export {
  notificacionesDeVencimiento,
  type VencimientoNotificable,
} from './notificaciones/vencimientos';
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
export { precargarDesdeExogena, type PrecargaExogena } from './exogena/precarga';
export {
  inmueblesReportados,
  deudasReportadas,
  type InmuebleExogena,
  type DeudaExogena,
} from './exogena/inmuebles-y-deudas';
export { documentosEsperados, type DocumentoEsperado } from './exogena/documentos-esperados';
export {
  coincideEntidad,
  tokensDeEntidad,
  saldosBancariosSinCertificado,
  rendimientosBancariosSinCertificado,
  type SaldoBancarioExogena,
} from './exogena/bancos-sin-certificado';
export { pensionesSinCertificado, type PensionesExogena } from './exogena/pensiones-sin-certificado';
export {
  ingresosMandatoReportados,
  type IngresosMandatoExogena,
  type DuplicadoMandato,
} from './exogena/mandato';
export { mesesTrabajadosSegunCertificados } from './perfil/meses-trabajados';
export {
  type RespuestasEntrevista,
  type VentaActivoCapturada,
  type HerenciaCapturada,
  type PremioCapturado,
} from './perfil/respuestas';
export {
  detectarCasosNoSoportados,
  detectarAdvertencias,
  type CasoNoSoportado,
  type AdvertenciaDeclaracion,
} from './perfil/casos-no-soportados';
export {
  normalizarPreferencias,
  PREFERENCIAS_POR_DEFECTO,
  type PreferenciasUsuario,
} from './perfil/preferencias';
export { construirPerfilFiscal, type InsumosPerfil } from './perfil/construir-perfil';
export { progresoDeclaracion, type ProgresoDeclaracion } from './declaracion/progreso';
export { clasificarResultado, type EstadoResultado } from './declaracion/clasificacion';
export {
  evaluarDeclaracion,
  type EvaluacionDeclaracion,
  type Recomendacion,
} from './declaracion/recomendaciones';
export {
  type ConexionDianPort,
  type CredencialesDian,
  type ContextoOperacionDian,
  type ProgresoConexion,
  type EtapaConexion,
  type ResultadoDescarga,
  type GeneroDian,
  type DatosPresentacion,
  type ResultadoPresentacion,
  type DatosDiligenciamiento,
  type DiferenciaCasilla,
  type ResultadoDiligenciamiento,
  type MotivoFalloDian,
  type ModoIngresoDian,
  type SobreCifrado,
  type TipoDocumentoDian,
} from './puertos/conexion-dian-port';
export {
  crearAutorizacion,
  autorizacionVigente,
  permiteAlcance,
  textoAutorizacion,
  serializarAutorizacion,
  MINUTOS_VIGENCIA_AUTORIZACION,
  VERSION_TEXTO_AUTORIZACION,
  type AutorizacionDian,
  type AlcanceAutorizacion,
  type TextoAutorizacion,
} from './dian/autorizacion';
export { Secreto, MARCA_REDACTADO } from './dian/secreto';
export { mensajeDeFallo, estadoDeFallo, esFaltaDeDatos } from './dian/mensajes-fallo';
export {
  redactar,
  redactarValores,
  detalleSeguro,
  esClaveSecreta,
} from './dian/redaccion';
export {
  evaluarConexionDian,
  evaluarAmbito,
  vigentes,
  LIMITES,
  MAXIMO_CONEXIONES_CONCURRENTES,
  type AmbitoLimite,
  type Veredicto,
} from './dian/limite-conexiones';
export {
  validarSolicitudConexion,
  type CuerpoConexion,
  type SolicitudConexionDian,
  type ResultadoValidacion,
} from './dian/solicitud-conexion';
export { errorDeTitularidad, type ContextoTitularidad } from './dian/titularidad';
export {
  CASILLAS_ENTRADA_210,
  CASILLAS_VERIFICADAS_210,
  valoresDeEntrada210,
  diferenciasConPortal,
  montoDelPortal,
  nombreDeSeccion210,
  anclasSinLeer,
  CASILLAS_ANCLA_210,
} from './dian/formulario-210-portal';
export {
  type EvidenciaAutorizacionPort,
  type EvidenciaAutorizacion,
  type HuellaPeticion,
  type ResultadoAutorizacion,
  type DesenlaceAutorizacion,
} from './puertos/evidencia-autorizacion-port';
export {
  type BovedaCredencialesPort,
  type CredencialGuardada,
  type AccesoGuardado,
} from './puertos/boveda-credenciales-port';
