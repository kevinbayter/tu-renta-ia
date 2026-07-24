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
  topes: TopesExogena;
  filas: FilaExogena[];
}
