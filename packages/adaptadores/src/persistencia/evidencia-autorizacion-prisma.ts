import { createHash } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { serializarAutorizacion, textoAutorizacion } from '@turenta/core';
import type {
  AlcanceAutorizacion,
  AutorizacionDian,
  DesenlaceAutorizacion,
  EvidenciaAutorizacion,
  EvidenciaAutorizacionPort,
  HuellaPeticion,
} from '@turenta/core';


import { PrismaClient } from './generado/client';

/**
 * Authorization evidence in Postgres (PLAN-DIAN §1.3).
 *
 * Stores the HASH of the accepted text, not the text: it proves the integrity
 * of what the user read without duplicating content on every row. The text can
 * always be rebuilt from core because it is versioned.
 *
 * RULE: no credential enters here. Not the password, not anything derived.
 */

/** Retention: 5 years, the return's statute of limitations plus margin. */
export const ANIOS_RETENCION_EVIDENCIA = 5;

export function hashDelTexto(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/** Hash of what the screen showed: recomputed server-side, never trusted from the client. */
export function hashAutorizacion(titular: string, alcances: AlcanceAutorizacion[]): string {
  return hashDelTexto(serializarAutorizacion(textoAutorizacion(titular, alcances)));
}

interface FilaEvidencia {
  id: string;
  titularIdentificacion: string;
  alcances: string[];
  versionTexto: string;
  textoHash: string;
  otorgadaEn: Date;
  expiraEn: Date;
  ip: string;
  resultado: string;
  motivoFallo: string;
  revocadaEn: Date | null;
}

function aEvidencia(fila: FilaEvidencia): EvidenciaAutorizacion {
  return {
    id: fila.id,
    titularIdentificacion: fila.titularIdentificacion,
    alcances: fila.alcances as AlcanceAutorizacion[],
    versionTexto: fila.versionTexto,
    textoHash: fila.textoHash,
    otorgadaEn: fila.otorgadaEn.toISOString(),
    expiraEn: fila.expiraEn.toISOString(),
    ip: fila.ip,
    resultado: fila.resultado as EvidenciaAutorizacion['resultado'],
    motivoFallo: fila.motivoFallo,
    revocadaEn: fila.revocadaEn ? fila.revocadaEn.toISOString() : null,
  };
}

const CAMPOS: Record<keyof FilaEvidencia, true> = {
  id: true,
  titularIdentificacion: true,
  alcances: true,
  versionTexto: true,
  textoHash: true,
  otorgadaEn: true,
  expiraEn: true,
  ip: true,
  resultado: true,
  motivoFallo: true,
  revocadaEn: true,
};

export class EvidenciaAutorizacionPrisma implements EvidenciaAutorizacionPort {
  constructor(private readonly prisma: PrismaClient) {}

  static desdeUrl(connectionString: string): EvidenciaAutorizacionPrisma {
    return new EvidenciaAutorizacionPrisma(new PrismaClient({ adapter: new PrismaPg({ connectionString }) }));
  }

  registrarAutorizacion(
    autorizacion: AutorizacionDian,
    huella: HuellaPeticion,
  ): Promise<{ id: string }> {
    const texto = textoAutorizacion(autorizacion.titularIdentificacion, autorizacion.alcances);
    return this.prisma.autorizacionDian.create({
      data: {
        operadorUsuarioId: autorizacion.operadorUsuarioId,
        titularIdentificacion: autorizacion.titularIdentificacion,
        alcances: autorizacion.alcances,
        versionTexto: texto.version,
        textoHash: hashDelTexto(serializarAutorizacion(texto)),
        otorgadaEn: autorizacion.otorgadaEn,
        expiraEn: autorizacion.expiraEn,
        ip: huella.ip,
        userAgent: huella.userAgent,
      },
      select: { id: true },
    });
  }

  async cerrarAutorizacion(
    evidenciaId: string,
    desenlace: DesenlaceAutorizacion,
    ahora: Date,
  ): Promise<void> {
    await this.prisma.autorizacionDian.update({
      where: { id: evidenciaId },
      data: {
        resultado: desenlace.resultado,
        motivoFallo: desenlace.motivoFallo ?? '',
        finalizadaEn: ahora,
      },
    });
  }

  async listarAutorizaciones(
    operadorUsuarioId: string,
    limite: number,
  ): Promise<EvidenciaAutorizacion[]> {
    const filas = await this.prisma.autorizacionDian.findMany({
      where: { operadorUsuarioId },
      orderBy: { otorgadaEn: 'desc' },
      take: limite,
      select: CAMPOS,
    });
    return filas.map(aEvidencia);
  }

  /** Cuts everything still live: the habeas data "revoke". */
  async revocarVigentes(operadorUsuarioId: string, ahora: Date): Promise<number> {
    const { count } = await this.prisma.autorizacionDian.updateMany({
      where: { operadorUsuarioId, resultado: 'en_curso', revocadaEn: null },
      data: { resultado: 'revocada', revocadaEn: ahora, finalizadaEn: ahora },
    });
    return count;
  }

  async purgarAnterioresA(limite: Date): Promise<number> {
    const { count } = await this.prisma.autorizacionDian.deleteMany({
      where: { otorgadaEn: { lt: limite } },
    });
    return count;
  }
}

/** Cutoff date beyond which evidence must no longer be kept. */
export function limiteDeRetencion(ahora: Date): Date {
  const limite = new Date(ahora);
  limite.setFullYear(limite.getFullYear() - ANIOS_RETENCION_EVIDENCIA);
  return limite;
}
