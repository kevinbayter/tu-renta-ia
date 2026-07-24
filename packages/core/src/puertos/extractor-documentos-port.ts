import type {
  Certificado220Extraido,
  CertificadoBancarioExtraido,
  CertificadoPrepagadaExtraido,
  ClasificacionDocumento,
} from '@turenta/shared';

export interface DocumentoFuente {
  /** Texto embebido del PDF (vacío si es escaneado). */
  texto: string;
  /** Páginas como imágenes base64 (solo para escaneados). */
  imagenesBase64?: string[];
}

export interface ResultadoExtraccion<T> {
  datos: T;
  /** true si las dos pasadas de extracción coincidieron en todos los montos. */
  pasadasCoinciden: boolean;
  discrepancias: string[];
}

/** Puerto de extracción de documentos con IA (implementado en adaptadores). */
export interface ExtractorDocumentosPort {
  clasificar(doc: DocumentoFuente): Promise<ClasificacionDocumento['tipo']>;
  extraer220(doc: DocumentoFuente): Promise<ResultadoExtraccion<Certificado220Extraido>>;
  extraerBancario(doc: DocumentoFuente): Promise<ResultadoExtraccion<CertificadoBancarioExtraido>>;
  extraerPrepagada(doc: DocumentoFuente): Promise<ResultadoExtraccion<CertificadoPrepagadaExtraido>>;
}
