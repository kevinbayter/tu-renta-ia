import { PrismaPg } from '@prisma/adapter-pg';

import type { RepositorioPort, UsuarioRegistrado } from '@turenta/core';

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

  async guardarDeclaracion(usuarioId: string, anioGravable: number, estado: object): Promise<void> {
    await this.prisma.declaracion.upsert({
      where: { usuarioId_anioGravable: { usuarioId, anioGravable } },
      create: { usuarioId, anioGravable, estado },
      update: { estado },
    });
  }

  async cargarDeclaracion(usuarioId: string, anioGravable: number): Promise<object | null> {
    const fila = await this.prisma.declaracion.findUnique({
      where: { usuarioId_anioGravable: { usuarioId, anioGravable } },
      select: { estado: true },
    });
    return (fila?.estado as object | undefined) ?? null;
  }

  async eliminarUsuario(usuarioId: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id: usuarioId } });
  }
}
