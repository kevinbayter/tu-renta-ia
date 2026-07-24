export { liquidarDeclaracion } from './motor';
export { obtenerConstantes } from './constantes/registro';
export { AG2025 } from './constantes/ag2025';
export { redondearMil, pisoMil } from './redondeo';
export { impuestoTabla241 } from './liquidacion/tabla-241';
export { calcularAnticipo, porcentajeAnticipo } from './liquidacion/anticipo';
export { porcentajeCesantiasExentas } from './depuracion/rentas-trabajo';
export type { ConstantesAnio, RangoTarifa, TramoCesantias } from './constantes/tipos';
export type {
  PerfilFiscal,
  CertificadoLaboral,
  RentasCapitalInput,
  DeduccionesInput,
  PatrimonioInput,
  ActivoPatrimonial,
  HistorialInput,
} from './modelo/tipos';
export type {
  ResultadoDeclaracion,
  ResultadoCedulaGeneral,
  ResultadoRentasTrabajo,
  ResultadoRentasCapital,
  ResultadoLiquidacion,
} from './modelo/resultado';
