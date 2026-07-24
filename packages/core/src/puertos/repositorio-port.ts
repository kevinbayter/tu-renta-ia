export interface UsuarioRegistrado {
  id: string;
  email: string;
}

/** Puerto de persistencia (usuarios, OTP y estado de declaraciones). */
export interface RepositorioPort {
  upsertUsuario(email: string): Promise<UsuarioRegistrado>;
  buscarUsuarioPorEmail(email: string): Promise<UsuarioRegistrado | null>;
  guardarOtp(usuarioId: string, codigoHash: string, expiraEn: Date): Promise<void>;
  /** Consume el OTP si existe, no está usado y no ha expirado. Devuelve true si fue válido. */
  consumirOtp(usuarioId: string, codigoHash: string, ahora: Date): Promise<boolean>;
  guardarDeclaracion(usuarioId: string, anioGravable: number, estado: object): Promise<void>;
  cargarDeclaracion(usuarioId: string, anioGravable: number): Promise<object | null>;
  /** Habeas data: elimina el usuario y TODOS sus datos (cascada). */
  eliminarUsuario(usuarioId: string): Promise<void>;
}

/** Puerto de envío de correos (OTP de ingreso). */
export interface EmailPort {
  enviarCodigo(email: string, codigo: string): Promise<void>;
}
