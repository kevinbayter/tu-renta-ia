import type { ProgresoDeclaracion } from '../declaracion/progreso';

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
  progreso: ProgresoDeclaracion;
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

  listarPersonas(usuarioId: string): Promise<PersonaAdministrada[]>;
  /** Upsert por (usuario, identificación). Devuelve el id. */
  guardarPersona(usuarioId: string, persona: Omit<PersonaAdministrada, 'id'>): Promise<{ id: string }>;
  eliminarPersona(usuarioId: string, personaId: string): Promise<void>;

  registrarActividad(
    usuarioId: string,
    evento: { tipo: string; descripcion: string; declaracionId?: string },
  ): Promise<void>;
  listarActividad(usuarioId: string, limite: number): Promise<EventoActividad[]>;

  listarNotificaciones(usuarioId: string): Promise<NotificacionUsuario[]>;
  /** Crea la notificación solo si su clave de idempotencia no existe. Devuelve true si la creó. */
  crearNotificacionSiNueva(usuarioId: string, notificacion: NotificacionNueva): Promise<boolean>;
  marcarNotificacionesLeidas(usuarioId: string): Promise<void>;
  eliminarDeclaracion(usuarioId: string, declaracionId: string): Promise<void>;

  /** Habeas data: elimina el usuario y TODOS sus datos (cascada). */
  eliminarUsuario(usuarioId: string): Promise<void>;
}

/** Puerto de envío de correos (OTP de ingreso y avisos). */
export interface EmailPort {
  enviarCodigo(email: string, codigo: string): Promise<void>;
  enviarAviso(email: string, asunto: string, mensaje: string): Promise<void>;
}

export interface PersonaAdministrada {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  telefono: string;
}

export interface EventoActividad {
  id: string;
  tipo: string;
  descripcion: string;
  declaracionId: string;
  creadaEn: string;
}

export interface NotificacionUsuario {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  creadaEn: string;
}

/** Notificación a crear; la clave de idempotencia evita duplicados al re-evaluar. */
export interface NotificacionNueva {
  tipo: string;
  titulo: string;
  cuerpo: string;
  claveIdempotencia: string;
  esCritica: boolean;
}
