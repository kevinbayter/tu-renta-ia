import { extractText, getDocumentProxy } from 'unpdf';

export interface TextoPdf {
  texto: string;
  totalPaginas: number;
  /** true si el PDF casi no tiene texto embebido (probablemente escaneado → usar visión). */
  esEscaneado: boolean;
}

const MINIMO_CARACTERES_POR_PAGINA = 200;

export async function extraerTextoPdf(contenido: Uint8Array): Promise<TextoPdf> {
  const documento = await getDocumentProxy(contenido);
  const { text, totalPages } = await extractText(documento, { mergePages: true });
  const texto = text.trim();
  const caracteresPorPagina = totalPages > 0 ? texto.length / totalPages : 0;
  return {
    texto,
    totalPaginas: totalPages,
    esEscaneado: caracteresPorPagina < MINIMO_CARACTERES_POR_PAGINA,
  };
}
