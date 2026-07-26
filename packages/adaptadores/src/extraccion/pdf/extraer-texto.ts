import { extractText, getDocumentProxy } from 'unpdf';

export interface TextoPdf {
  texto: string;
  totalPaginas: number;
  /** true si el PDF casi no tiene texto embebido (probablemente escaneado → usar visión). */
  esEscaneado: boolean;
}

const MINIMO_CARACTERES_POR_PAGINA = 200;

export async function extraerTextoPdf(contenido: Uint8Array): Promise<TextoPdf> {
  // pdf.js transfiere el buffer y lo deja inservible para el llamador. Copiar
  // aquí evita que leer el texto impida después renderizar la misma página.
  const documento = await getDocumentProxy(Uint8Array.from(contenido));
  const { text, totalPages } = await extractText(documento, { mergePages: true });
  const texto = text.trim();
  const caracteresPorPagina = totalPages > 0 ? texto.length / totalPages : 0;
  return {
    texto,
    totalPaginas: totalPages,
    esEscaneado: caracteresPorPagina < MINIMO_CARACTERES_POR_PAGINA,
  };
}
