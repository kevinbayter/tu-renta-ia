import { PrismaPg } from '@prisma/adapter-pg';

import type {
  DeclaracionResumen,
  PerfilUsuario,
  RepositorioPort,
  TitularDeclaracion,
  UsuarioRegistrado,
} from '@turenta/core';

import { PrismaClient } from './generado/client';

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
    await this.prisma.codigoOtp.create({ data: { usuarioId, codigoHash, expiraEn } });
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
