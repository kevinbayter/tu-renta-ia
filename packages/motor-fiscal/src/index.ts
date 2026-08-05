export { liquidarDeclaracion } from './motor';
export { obtenerConstantes } from './constantes/registro';
export { AG2025 } from './constantes/ag2025';
export { redondearMil, pisoMil } from './redondeo';
export { impuestoTabla241 } from './liquidacion/tabla-241';
export { calcularAnticipo, porcentajeAnticipo } from './liquidacion/anticipo';
export { porcentajeCesantiasExentas } from './depuracion/rentas-trabajo';
export { fechaVencimiento, ultimosDosDigitos } from './calendario/vencimientos';
export type { ConstantesAnio, RangoTarifa, TramoCesantias } from './constantes/tipos';
export type {
  PerfilFiscal,
  CertificadoLaboral,
  AportesVoluntariosInput,
  DividendosInput,
  GananciasOcasionalesInput,
  HonorariosInput,
  VentaActivoInput,
  HerenciaDonacionInput,
  PremioInput,
  RentasCapitalInput,
  RentasNoLaboralesInput,
  RentasPensionesInput,
  DescuentosInput,
  ComparacionPatrimonialInput,
  DeduccionesInput,
  PatrimonioInput,
  ActivoPatrimonial,
  HistorialInput,
} from './modelo/tipos';
export type {
  ResultadoDeclaracion,
  ResultadoCedulaGeneral,
  ResultadoDividendos,
  ResultadoGananciasOcasionales,
  ResultadoHonorarios,
  ResultadoRentasTrabajo,
  ResultadoRentasCapital,
  ResultadoRentasNoLaborales,
  ResultadoRentasPensiones,
  ResultadoDescuentos,
  ResultadoComparacionPatrimonial,
  ResultadoLiquidacion,
} from './modelo/resultado';
