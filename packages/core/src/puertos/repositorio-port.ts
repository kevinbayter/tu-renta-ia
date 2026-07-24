export interface UsuarioRegistrado {
  id: string;
  email: string;
}

export interface PerfilUsuario {
  nombres: string;
  apellidos: string;
  identificacion: string;
}

export interface TitularDeclaracion {
  nombres: string;
  apellidos: string;
  identificacion: string;
  esPropia: boolean;
}

export interface DeclaracionResumen {
  id: string;
  anioGravable: number;
  titular: TitularDeclaracion;
  actualizadaEn: string;
  /** null si aún no se ha calculado. */
  saldoAFavor: number | null;
  saldoAPagar: number | null;
}

/** Puerto de persistencia (usuarios, OTP, perfil y declaraciones). */
export interface RepositorioPort {
  upsertUsuario(email: string): Promise<UsuarioRegistrado>;
  buscarUsuarioPorEmail(email: string): Promise<UsuarioRegistrado | null>;
  guardarOtp(usuarioId: string, codigoHash: string, expiraEn: Date): Promise<void>;
  /** Consume el OTP si existe, no está usado y no ha expirado. Devuelve true si fue válido. */
  consumirOtp(usuarioId: string, codigoHash: string, ahora: Date): Promise<boolean>;

  obtenerPerfil(usuarioId: string): Promise<PerfilUsuario | null>;
  actualizarPerfil(usuarioId: string, perfil: PerfilUsuario): Promise<void>;

  listarDeclaraciones(usuarioId: string): Promise<DeclaracionResumen[]>;
  /** Upsert por (usuario, identificación del titular, año). Devuelve el id. */
  guardarDeclaracion(
    usuarioId: string,
    anioGravable: number,
    titular: TitularDeclaracion,
    estado: object,
  ): Promise<{ id: string }>;
  cargarDeclaracion(usuarioId: string, declaracionId: string): Promise<object | null>;
  eliminarDeclaracion(usuarioId: string, declaracionId: string): Promise<void>;

  /** Habeas data: elimina el usuario y TODOS sus datos (cascada). */
  eliminarUsuario(usuarioId: string): Promise<void>;
}

/** Puerto de envío de correos (OTP de ingreso). */
export interface EmailPort {
  enviarCodigo(email: string, codigo: string): Promise<void>;
}
