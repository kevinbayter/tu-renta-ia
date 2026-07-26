import { PrismaPg } from '@prisma/adapter-pg';

import { progresoDeclaracion } from '@turenta/core';
import type {
  DeclaracionResumen,
  EventoActividad,
  NotificacionNueva,
  NotificacionUsuario,
  PerfilUsuario,
  PersonaAdministrada,
  RepositorioPort,
  TitularDeclaracion,
  UsuarioRegistrado,
} from '@turenta/core';

import { PrismaClient } from './generado/client';

import type { Prisma } from './generado/client';

/** Adaptador de persistencia sobre Postgres (Prisma 7 + driver pg). */
export class RepositorioPrisma implements RepositorioPort {
  private readonly prisma: PrismaClient;

  constructor(connectionString: string) {
    const adapter = new PrismaPg({ connectionString });
    this.prisma = new PrismaClient({ adapter });
  }

  async upsertUsuario(email: string): Promise<UsuarioRegistrado> {
    const normalizado = email.trim().toLowerCase();
    return this.prisma.usuario.upsert({
      where: { email: normalizado },
      create: { email: normalizado },
      update: {},
      select: { id: true, email: true },
    });
  }

  async buscarUsuarioPorEmail(email: string): Promise<UsuarioRegistrado | null> {
    return this.prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });
  }

  async guardarOtp(usuarioId: string, codigoHash: string, expiraEn: Date): Promise<void> {
    // Invalidate any prior unused code so at most one is ever live: otherwise a
    // resend leaves several valid codes, widening a brute-force window.
    await this.prisma.$transaction([
      this.prisma.codigoOtp.updateMany({
        where: { usuarioId, usadoEn: null },
        data: { usadoEn: new Date() },
      }),
      this.prisma.codigoOtp.create({ data: { usuarioId, codigoHash, expiraEn } }),
    ]);
  }

  async consumirOtp(usuarioId: string, codigoHash: string, ahora: Date): Promise<boolean> {
    const resultado = await this.prisma.codigoOtp.updateMany({
      where: { usuarioId, codigoHash, usadoEn: null, expiraEn: { gt: ahora } },
      data: { usadoEn: ahora },
    });
    return resultado.count > 0;
  }

  async obtenerPerfil(usuarioId: string): Promise<PerfilUsuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombres: true, apellidos: true, identificacion: true },
    });
  }

  async actualizarPerfil(usuarioId: string, perfil: PerfilUsuario): Promise<void> {
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: perfil });
  }

  async obtenerPreferencias(usuarioId: string): Promise<unknown> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { preferencias: true },
    });
    return fila?.preferencias ?? {};
  }

  async guardarPreferencias(usuarioId: string, preferencias: Record<string, unknown>): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { preferencias: preferencias as Prisma.InputJsonValue },
    });
  }

  async obtenerFotoAvatar(usuarioId: string): Promise<Uint8Array | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { fotoAvatar: true },
    });
    return fila?.fotoAvatar ?? null;
  }

  async guardarFotoAvatar(usuarioId: string, foto: Uint8Array | null): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { fotoAvatar: foto ? new Uint8Array(foto) : null },
    });
  }

  async listarDeclaraciones(usuarioId: string): Promise<DeclaracionResumen[]> {
    const filas = await this.prisma.declaracion.findMany({
      where: { usuarioId },
      orderBy: [{ esPropia: 'desc' }, { titularIdentificacion: 'asc' }, { anioGravable: 'desc' }],
    });
    return filas.map((fila) => aResumen(fila));
  }

  async guardarDeclaracion(
    usuarioId: string,
    anioGravable: number,
    titular: TitularDeclaracion,
    estado: object,
  ): Promise<{ id: string }> {
    const datos = datosDeTitular(titular, estado);
    return this.prisma.declaracion.upsert({
      where: {
        usuarioId_titularIdentificacion_anioGravable: {
          usuarioId,
          titularIdentificacion: datos.titularIdentificacion,
          anioGravable,
        },
      },
      create: { usuarioId, anioGravable, ...datos },
      update: datos,
      select: { id: true },
    });
  }

  async cargarDeclaracion(usuarioId: string, declaracionId: string): Promise<object | null> {
    const fila = await this.prisma.declaracion.findFirst({
      where: { id: declaracionId, usuarioId },
      select: { estado: true },
    });
    return (fila?.estado as object | undefined) ?? null;
  }

  async eliminarDeclaracion(usuarioId: string, declaracionId: string): Promise<void> {
    await this.prisma.declaracion.deleteMany({ where: { id: declaracionId, usuarioId } });
  }

  async eliminarUsuario(usuarioId: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id: usuarioId } });
  }

  async listarPersonas(usuarioId: string): Promise<PersonaAdministrada[]> {
    return this.prisma.persona.findMany({
      where: { usuarioId },
      orderBy: [{ nombres: 'asc' }],
      select: { id: true, nombres: true, apellidos: true, identificacion: true, email: true, telefono: true },
    });
  }

  async guardarPersona(usuarioId: string, persona: Omit<PersonaAdministrada, 'id'>): Promise<{ id: string }> {
    const identificacion = persona.identificacion.replace(/\D/g, '');
    const datos = { ...persona, identificacion };
    return this.prisma.persona.upsert({
      where: { usuarioId_identificacion: { usuarioId, identificacion } },
      create: { usuarioId, ...datos },
      update: datos,
      select: { id: true },
    });
  }

  async eliminarPersona(usuarioId: string, personaId: string): Promise<void> {
    await this.prisma.persona.deleteMany({ where: { id: personaId, usuarioId } });
  }

  async registrarActividad(
    usuarioId: string,
    evento: { tipo: string; descripcion: string; declaracionId?: string },
  ): Promise<void> {
    await this.prisma.actividad.create({
      data: { usuarioId, tipo: evento.tipo, descripcion: evento.descripcion, declaracionId: evento.declaracionId ?? '' },
    });
  }

  async listarActividad(usuarioId: string, limite: number): Promise<EventoActividad[]> {
    const filas = await this.prisma.actividad.findMany({
      where: { usuarioId },
      orderBy: { creadaEn: 'desc' },
      take: limite,
    });
    return filas.map((f) => ({ ...f, creadaEn: f.creadaEn.toISOString() }));
  }

  async listarNotificaciones(usuarioId: string): Promise<NotificacionUsuario[]> {
    const filas = await this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { creadaEn: 'desc' },
      take: 30,
    });
    return filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      titulo: f.titulo,
      cuerpo: f.cuerpo,
      leida: f.leidaEn !== null,
      creadaEn: f.creadaEn.toISOString(),
    }));
  }

  async crearNotificacionSiNueva(usuarioId: string, notificacion: NotificacionNueva): Promise<boolean> {
    const creada = await this.prisma.notificacion
      .create({
        data: {
          usuarioId,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          cuerpo: notificacion.cuerpo,
          claveIdempotencia: notificacion.claveIdempotencia,
        },
      })
      .catch(() => null);
    return creada !== null;
  }

  async marcarNotificacionesLeidas(usuarioId: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leidaEn: null },
      data: { leidaEn: new Date() },
    });
  }
}

function datosDeTitular(titular: TitularDeclaracion, estado: object) {
  return {
    titularNombres: titular.nombres,
    titularApellidos: titular.apellidos,
    titularIdentificacion: titular.identificacion.replace(/\D/g, ''),
    esPropia: titular.esPropia,
    estado,
  };
}

interface FilaDeclaracion {
  id: string;
  anioGravable: number;
  titularNombres: string;
  titularApellidos: string;
  titularIdentificacion: string;
  esPropia: boolean;
  actualizadaEn: Date;
  estado: unknown;
}

function aResumen(fila: FilaDeclaracion): DeclaracionResumen {
  const liquidacion = extraerLiquidacion(fila.estado);
  return {
    id: fila.id,
    anioGravable: fila.anioGravable,
    titular: {
      nombres: fila.titularNombres,
      apellidos: fila.titularApellidos,
      identificacion: fila.titularIdentificacion,
      esPropia: fila.esPropia,
    },
    actualizadaEn: fila.actualizadaEn.toISOString(),
    saldoAFavor: liquidacion?.totalSaldoAFavor ?? null,
    saldoAPagar: liquidacion?.saldoAPagar ?? null,
    progreso: progresoDeclaracion(fila.estado),
  };
}

function extraerLiquidacion(estado: unknown): { totalSaldoAFavor: number; saldoAPagar: number } | null {
  const resultado = (estado as { resultado?: { liquidacion?: { totalSaldoAFavor?: number; saldoAPagar?: number } } } | null)?.resultado;
  const liquidacion = resultado?.liquidacion;
  if (typeof liquidacion?.totalSaldoAFavor !== 'number' || typeof liquidacion.saldoAPagar !== 'number') {
    return null;
  }
  return { totalSaldoAFavor: liquidacion.totalSaldoAFavor, saldoAPagar: liquidacion.saldoAPagar };
}
