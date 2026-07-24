/** Fila de la "Consulta de información reportada por terceros" (exógena DIAN). */
export interface FilaExogena {
  nitInformante: string;
  nombreInformante: string;
  detalle: string;
  valor: number;
  usoSugerido: string;
  infoAdicional: string;
}

export interface TopesExogena {
  ingresos: number;
  patrimonio: number;
  consumoTarjetas: number;
  movimientos: number;
  compras: number;
}

export interface ExogenaParseada {
  anioGravable: number;
  /** Cédula del consultante que descargó el reporte (encabezado del Excel DIAN). */
  identificacionConsultante?: string;
  topes: TopesExogena;
  filas: FilaExogena[];
}
