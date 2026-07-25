import { PrismaPg } from '@prisma/adapter-pg';

import type { AccesoGuardado, BovedaCredencialesPort, CredencialGuardada } from '@turenta/core';

import { PrismaClient } from './generado/client';


/**
 * Stored DIAN accesses in Postgres. Only ciphertext lands here: the key is in
 * the isolated worker, which cannot reach this database.
 */

/** Unused for this long and it goes: an access nobody uses is only a liability. */
export const DIAS_SIN_USO_ANTES_DE_BORRAR = 90;

interface FilaCredencial {
  id: string;
  titularIdentificacion: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cifradoVersion: number;
  cifradoNonce: string;
  cifradoTag: string;
  cifradoContenido: string;
  creadoEn: Date;
  ultimoUsoEn: Date | null;
}

function aAcceso(fila: FilaCredencial): AccesoGuardado {
  return {
    id: fila.id,
    titularIdentificacion: fila.titularIdentificacion,
    tipoDocumento: fila.tipoDocumento,
    numeroDocumento: fila.numeroDocumento,
    cifrado: {
      version: fila.cifradoVersion,
      nonce: fila.cifradoNonce,
      tag: fila.cifradoTag,
      contenido: fila.cifradoContenido,
    },
    creadoEn: fila.creadoEn.toISOString(),
    ultimoUsoEn: fila.ultimoUsoEn ? fila.ultimoUsoEn.toISOString() : null,
  };
}

function datosDe(credencial: CredencialGuardada) {
  return {
    tipoDocumento: credencial.tipoDocumento,
    numeroDocumento: credencial.numeroDocumento,
    cifradoVersion: credencial.cifrado.version,
    cifradoNonce: credencial.cifrado.nonce,
    cifradoTag: credencial.cifrado.tag,
    cifradoContenido: credencial.cifrado.contenido,
  };
}

export class BovedaCredencialesPrisma implements BovedaCredencialesPort {
  constructor(private readonly prisma: PrismaClient) {}

  static desdeUrl(connectionString: string): BovedaCredencialesPrisma {
    return new BovedaCredencialesPrisma(
      new PrismaClient({ adapter: new PrismaPg({ connectionString }) }),
    );
  }

  async guardar(
    usuarioId: string,
    titularIdentificacion: string,
    credencial: CredencialGuardada,
  ): Promise<void> {
    const datos = datosDe(credencial);
    await this.prisma.credencialDian.upsert({
      where: { usuarioId_titularIdentificacion: { usuarioId, titularIdentificacion } },
      create: { usuarioId, titularIdentificacion, ...datos },
      update: { ...datos, ultimoUsoEn: null },
    });
  }

  async buscar(usuarioId: string, titularIdentificacion: string): Promise<AccesoGuardado | null> {
    const fila = await this.prisma.credencialDian.findUnique({
      where: { usuarioId_titularIdentificacion: { usuarioId, titularIdentificacion } },
    });
    return fila ? aAcceso(fila) : null;
  }

  async marcarUso(id: string, ahora: Date): Promise<void> {
    await this.prisma.credencialDian.update({ where: { id }, data: { ultimoUsoEn: ahora } });
  }

  async olvidar(usuarioId: string, titularIdentificacion: string): Promise<boolean> {
    const { count } = await this.prisma.credencialDian.deleteMany({
      where: { usuarioId, titularIdentificacion },
    });
    return count > 0;
  }

  /** Never returns the envelope: this is what the user's own screen shows. */
  async listar(usuarioId: string): Promise<Omit<AccesoGuardado, 'cifrado'>[]> {
    const filas = await this.prisma.credencialDian.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
    return filas.map(aAcceso).map(({ cifrado: _cifrado, ...resto }) => resto);
  }

  async purgarSinUsoDesde(limite: Date): Promise<number> {
    const { count } = await this.prisma.credencialDian.deleteMany({
      where: { OR: [{ ultimoUsoEn: { lt: limite } }, { ultimoUsoEn: null, creadoEn: { lt: limite } }] },
    });
    return count;
  }
}

export function limiteDeInactividad(ahora: Date): Date {
  const limite = new Date(ahora);
  limite.setDate(limite.getDate() - DIAS_SIN_USO_ANTES_DE_BORRAR);
  return limite;
}
