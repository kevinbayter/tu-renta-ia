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
  gmf: { porcentajeDeducible: number };
  afcFvp: { porcentaje: number; topeAnualUvt: number };

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
