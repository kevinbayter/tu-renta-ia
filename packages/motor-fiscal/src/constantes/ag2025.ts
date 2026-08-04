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

  // Num. 5 art. 206 E.T. (mod. Ley 2277/2022): mesada exenta hasta 1.000 UVT/mes
  // (normativa/ag2025/04-pensiones.md)
  pensiones: { exencionMensualUvt: 1_000 },

  // Art. 257: descuento del 25% de lo donado a ESAL del régimen especial.
  // Art. 258: los descuentos 255/256/257 no exceden el 25% del impuesto de renta.
  // (normativa/ag2025/06-descuentos-y-comparacion.md)
  descuentos: {
    donacionesPorcentaje: 0.25,
    limiteSobreImpuesto: 0.25,
  },
  gmf: { porcentajeDeducible: 0.5 },
  // Arts. 126-1/126-4: límite CONJUNTO de AFC + pensión voluntaria
  // (normativa/ag2025/08-afc-pension-voluntaria-salud.md)
  afcFvp: { porcentaje: 0.3, topeAnualUvt: 3_800 },
  // Art. 55 (mod. Ley 2010/2019): INCRNGO, mismo doc de respaldo.
  aporteVoluntarioRais: { porcentaje: 0.25, topeAnualUvt: 2_500 },

  // Arts. 307/311-1 (mod. Ley 2277/2022), 314 (15%) y 317 (20%)
  // (normativa/ag2025/09-ganancias-ocasionales.md)
  gananciaOcasional: {
    tarifaGeneral: 0.15,
    tarifaPremios: 0.2,
    exencionViviendaCausanteUvt: 13_000,
    exencionOtroInmuebleCausanteUvt: 6_500,
    exencionPorBeneficiarioUvt: 3_250,
    exencionNoLegitimarioPorcentaje: 0.2,
    exencionNoLegitimarioTopeUvt: 1_625,
    exencionVentaViviendaUvt: 5_000,
  },

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

  // Decreto 2229 de 2023: vencimientos 2026 por dos últimos dígitos (normativa/ag2025/03-calendario.md)
  calendarioVencimientos: [
    '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-18', '2026-08-19',
    '2026-08-20', '2026-08-21', '2026-08-24', '2026-08-25', '2026-08-26',
    '2026-08-27', '2026-08-28', '2026-08-31', '2026-09-01', '2026-09-02',
    '2026-09-03', '2026-09-04', '2026-09-07', '2026-09-08', '2026-09-09',
    '2026-09-10', '2026-09-11', '2026-09-14', '2026-09-15', '2026-09-16',
    '2026-09-17', '2026-09-18', '2026-09-21', '2026-09-22', '2026-09-23',
    '2026-09-24', '2026-09-25', '2026-09-28', '2026-10-01', '2026-10-02',
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09',
    '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-19',
    '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26',
  ],
};
