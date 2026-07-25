/**
 * Stored DIAN access, at the user's explicit request.
 *
 * The application only ever handles an opaque blob: the key that decrypts it
 * lives in the isolated worker, which has no database access. Stealing the
 * database yields nothing usable, and the web app cannot read a password even
 * if it wanted to.
 */

/** Opaque to everyone except the worker that holds the key. */
export interface CredencialGuardada {
  tipoDocumento: string;
  numeroDocumento: string;
  /** AES-256-GCM envelope produced by the worker. */
  cifrado: {
    version: number;
    nonce: string;
    tag: string;
    contenido: string;
  };
}

export interface AccesoGuardado extends CredencialGuardada {
  id: string;
  titularIdentificacion: string;
  creadoEn: string;
  ultimoUsoEn: string | null;
}

export interface BovedaCredencialesPort {
  /** Stores or replaces the access for this taxpayer. Requires explicit consent. */
  guardar(
    usuarioId: string,
    titularIdentificacion: string,
    credencial: CredencialGuardada,
  ): Promise<void>;

  /** Returns the blob to hand to the worker, or null if there is none. */
  buscar(usuarioId: string, titularIdentificacion: string): Promise<AccesoGuardado | null>;

  /** Records that it was used, which also feeds the inactivity expiry. */
  marcarUso(id: string, ahora: Date): Promise<void>;

  /** The user revoking their stored access: it must disappear immediately. */
  olvidar(usuarioId: string, titularIdentificacion: string): Promise<boolean>;

  /** What the user can see about their own stored accesses (never the secret). */
  listar(usuarioId: string): Promise<Omit<AccesoGuardado, 'cifrado'>[]>;

  /** Retention: drops accesses unused past the cutoff. */
  purgarSinUsoDesde(limite: Date): Promise<number>;
}
