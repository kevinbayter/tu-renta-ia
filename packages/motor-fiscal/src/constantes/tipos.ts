/** Rango de la tabla del art. 241 E.T., expresado en UVT. */
export interface RangoTarifa {
  desdeUvt: number;
  hastaUvt: number;
  tarifa: number;
  sumarUvt: number;
}

/** Tramo de la tabla de cesantías exentas (art. 206-4 E.T.). */
export interface TramoCesantias {
  hastaUvt: number;
  porcentajeExento: number;
}

/** Constantes normativas de un año gravable. Fuente humana: normativa/agYYYY/. */
export interface ConstantesAnio {
  anioGravable: number;
  uvt: number;

  topesDeclarar: {
    patrimonioUvt: number;
    ingresosUvt: number;
  };

  limiteGlobal: {
    porcentaje: number;
    topeUvt: number;
  };

  rentaExenta25: {
    porcentaje: number;
    topeAnualUvt: number;
  };

  dependientes387: {
    porcentaje: number;
    topeMensualUvt: number;
  };

  dependienteAdicional336: {
    uvtPorDependiente: number;
    maximoDependientes: number;
  };

  medicinaPrepagada: {
    topeMensualUvt: number;
  };

  interesesVivienda: { topeAnualUvt: number };
  interesesIcetex: { topeAnualUvt: number };

  /** Num. 5 art. 206 E.T. (mod. Ley 2277/2022): mesada exenta hasta este tope mensual. */
  pensiones: { exencionMensualUvt: number };

  /** Descuentos tributarios: art. 257 (25% de la donación) con el tope del art. 258. */
  descuentos: {
    donacionesPorcentaje: number;
    limiteSobreImpuesto: number;
  };
  gmf: { porcentajeDeducible: number };
  afcFvp: { porcentaje: number; topeAnualUvt: number };
  /** Art. 55: cotización voluntaria al RAIS como INCRNGO (25% del ingreso, 2.500 UVT). */
  aporteVoluntarioRais: { porcentaje: number; topeAnualUvt: number };
  /** Arts. 307, 311-1, 314, 317: tarifas y exenciones de ganancias ocasionales. */
  gananciaOcasional: {
    tarifaGeneral: number;
    tarifaPremios: number;
    exencionViviendaCausanteUvt: number;
    exencionOtroInmuebleCausanteUvt: number;
    exencionPorBeneficiarioUvt: number;
    exencionNoLegitimarioPorcentaje: number;
    exencionNoLegitimarioTopeUvt: number;
    exencionVentaViviendaUvt: number;
  };

  facturaElectronica: {
    porcentaje: number;
    topeAnualUvt: number;
  };

  componenteInflacionario: {
    porcentajeIngresos: number;
    porcentajeGastos: number;
  };

  tabla241: RangoTarifa[];
  tablaCesantias: TramoCesantias[];

  anticipo: {
    porcentajePorDeclaracion: [number, number, number];
  };

  /**
   * Fechas de vencimiento (ISO) para presentar la declaración, en orden de
   * pares de dígitos: índice 0 = terminaciones 01-02, ..., índice 49 = 99-00.
   */
  calendarioVencimientos: string[];
}
