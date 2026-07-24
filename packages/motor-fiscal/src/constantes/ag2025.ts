import type { ConstantesAnio } from './tipos';

/**
 * Constantes del año gravable 2025 (se declara en 2026).
 * Respaldo documental: normativa/ag2025/02-constantes.md — cada valor tiene fuente normativa.
 * UVT 2025: Resolución DIAN 000193 de 2024.
 */
export const AG2025: ConstantesAnio = {
  anioGravable: 2025,
  uvt: 49_799,

  topesDeclarar: {
    patrimonioUvt: 4_500,
    ingresosUvt: 1_400,
  },

  limiteGlobal: {
    porcentaje: 0.4,
    topeUvt: 1_340,
  },

  rentaExenta25: {
    porcentaje: 0.25,
    topeAnualUvt: 790,
  },

  dependientes387: {
    porcentaje: 0.1,
    topeMensualUvt: 32,
  },

  dependienteAdicional336: {
    uvtPorDependiente: 72,
    maximoDependientes: 4,
  },

  medicinaPrepagada: {
    topeMensualUvt: 16,
  },

  interesesVivienda: { topeAnualUvt: 1_200 },
  interesesIcetex: { topeAnualUvt: 100 },
  gmf: { porcentajeDeducible: 0.5 },
  afcFvp: { porcentaje: 0.3, topeAnualUvt: 3_800 },

  facturaElectronica: {
    porcentaje: 0.01,
    topeAnualUvt: 240,
  },

  componenteInflacionario: {
    porcentajeIngresos: 0.5543,
    porcentajeGastos: 0.2835,
  },

  tabla241: [
    { desdeUvt: 0, hastaUvt: 1_090, tarifa: 0, sumarUvt: 0 },
    { desdeUvt: 1_090, hastaUvt: 1_700, tarifa: 0.19, sumarUvt: 0 },
    { desdeUvt: 1_700, hastaUvt: 4_100, tarifa: 0.28, sumarUvt: 116 },
    { desdeUvt: 4_100, hastaUvt: 8_670, tarifa: 0.33, sumarUvt: 788 },
    { desdeUvt: 8_670, hastaUvt: 18_970, tarifa: 0.35, sumarUvt: 2_296 },
    { desdeUvt: 18_970, hastaUvt: 31_000, tarifa: 0.37, sumarUvt: 5_901 },
    { desdeUvt: 31_000, hastaUvt: Number.POSITIVE_INFINITY, tarifa: 0.39, sumarUvt: 10_352 },
  ],

  tablaCesantias: [
    { hastaUvt: 350, porcentajeExento: 1 },
    { hastaUvt: 410, porcentajeExento: 0.9 },
    { hastaUvt: 470, porcentajeExento: 0.8 },
    { hastaUvt: 530, porcentajeExento: 0.6 },
    { hastaUvt: 590, porcentajeExento: 0.4 },
    { hastaUvt: 650, porcentajeExento: 0.2 },
    { hastaUvt: Number.POSITIVE_INFINITY, porcentajeExento: 0 },
  ],

  anticipo: {
    porcentajePorDeclaracion: [0.25, 0.5, 0.75],
  },
};
