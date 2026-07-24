/** Puerto de almacenamiento de documentos del usuario (local en dev, S3 en prod). */
export interface ArchivoStoragePort {
  guardar(input: { usuarioId: string; nombre: string; contenido: Uint8Array }): Promise<{ clave: string }>;
  leer(clave: string): Promise<Uint8Array>;
  eliminar(clave: string): Promise<void>;
}
