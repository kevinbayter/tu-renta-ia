/**
 * Nombre del archivo del borrador. Se usa en el servidor (Content-Disposition) y
 * en el cliente (descarga del blob): una sola fuente para que coincidan.
 */

/** Sin tildes ni caracteres que incomoden a Windows/macOS al guardar. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function nombreArchivoBorrador(
  declarante: { nombres: string; apellidos: string },
  anioGravable: number,
): string {
  const titular = normalizar(`${declarante.nombres} ${declarante.apellidos}`.trim());
  const base = `Borrador-210-AG${String(anioGravable)}`;
  return titular ? `${base}-${titular}.pdf` : `${base}.pdf`;
}
