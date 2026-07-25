import { describe, expect, it } from 'vitest';

import { VERSION_TEXTO_AUTORIZACION, crearAutorizacion, serializarAutorizacion, textoAutorizacion } from '@turenta/core';

import {
  ANIOS_RETENCION_EVIDENCIA,
  EvidenciaAutorizacionPrisma,
  hashAutorizacion,
  hashDelTexto,
  limiteDeRetencion,
} from '../../src/persistencia/evidencia-autorizacion-prisma';

import type { PrismaClient } from '../../src/persistencia/generado/client';

const AHORA = new Date('2026-08-15T10:00:00Z');
const TITULAR = '1000000001';

function autorizacionDe() {
  return crearAutorizacion(
    {
      titularIdentificacion: TITULAR,
      operadorUsuarioId: 'usuario-1',
      alcances: ['leer_exogena'],
      textoAceptado: serializarAutorizacion(textoAutorizacion(TITULAR, ['leer_exogena'])),
    },
    AHORA,
  );
}

/** Prisma client double: records what it is asked, without a database. */
function prismaFalso() {
  const escrituras: Record<string, unknown>[] = [];
  const cliente = {
    autorizacionDian: {
      create: ({ data }: { data: Record<string, unknown> }) => {
        escrituras.push(data);
        return Promise.resolve({ id: 'evidencia-1' });
      },
      update: ({ data }: { data: Record<string, unknown> }) => {
        escrituras.push(data);
        return Promise.resolve({});
      },
      updateMany: ({ data }: { data: Record<string, unknown> }) => {
        escrituras.push(data);
        return Promise.resolve({ count: 2 });
      },
      deleteMany: () => Promise.resolve({ count: 7 }),
      findMany: () =>
        Promise.resolve([
          {
            id: 'evidencia-1',
            titularIdentificacion: TITULAR,
            alcances: ['leer_exogena'],
            versionTexto: VERSION_TEXTO_AUTORIZACION,
            textoHash: 'abc',
            otorgadaEn: AHORA,
            expiraEn: AHORA,
            ip: '1.2.3.4',
            resultado: 'exitosa',
            motivoFallo: '',
            revocadaEn: null,
          },
        ]),
    },
  } as unknown as PrismaClient;
  return { cliente, escrituras };
}

describe('hash del texto de autorización', () => {
  it('es determinista: el mismo consentimiento da siempre el mismo hash', () => {
    expect(hashAutorizacion(TITULAR, ['leer_exogena'])).toBe(hashAutorizacion(TITULAR, ['leer_exogena']));
  });

  it('cambia si cambia el titular o el alcance: no se puede reutilizar', () => {
    const base = hashAutorizacion(TITULAR, ['leer_exogena']);
    expect(hashAutorizacion('9999999999', ['leer_exogena'])).not.toBe(base);
    expect(hashAutorizacion(TITULAR, ['presentar_declaracion'])).not.toBe(base);
  });

  it('es un SHA-256 en hexadecimal', () => {
    expect(hashDelTexto('hola')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashea EXACTAMENTE el texto que la pantalla muestra', () => {
    // If the UI wrote its own text we would store the hash of something the
    // user never saw.
    const mostrado = serializarAutorizacion(textoAutorizacion(TITULAR, ['leer_exogena']));
    expect(hashAutorizacion(TITULAR, ['leer_exogena'])).toBe(hashDelTexto(mostrado));
  });
});

describe('persistencia de la evidencia', () => {
  it('guarda el hash y la versión, nunca el texto completo', async () => {
    const { cliente, escrituras } = prismaFalso();
    const evidencia = new EvidenciaAutorizacionPrisma(cliente);
    await evidencia.registrarAutorizacion(autorizacionDe(), { ip: '1.2.3.4', userAgent: 'navegador' });
    const guardado = escrituras[0] as Record<string, string>;
    expect(guardado['textoHash']).toBe(hashAutorizacion(TITULAR, ['leer_exogena']));
    expect(guardado['versionTexto']).toBe(VERSION_TEXTO_AUTORIZACION);
    expect(JSON.stringify(guardado)).not.toContain('Autorizo a TuRenta AI');
  });

  it('nunca escribe nada que huela a credencial', async () => {
    const { cliente, escrituras } = prismaFalso();
    const evidencia = new EvidenciaAutorizacionPrisma(cliente);
    await evidencia.registrarAutorizacion(autorizacionDe(), { ip: '1.2.3.4', userAgent: 'navegador' });
    const claves = Object.keys(escrituras[0] ?? {}).join(' ').toLowerCase();
    expect(claves).not.toMatch(/contrasena|password|clave|token|secret/);
  });

  it('guarda la huella de la petición: IP y user agent', async () => {
    const { cliente, escrituras } = prismaFalso();
    await new EvidenciaAutorizacionPrisma(cliente).registrarAutorizacion(autorizacionDe(), {
      ip: '190.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(escrituras[0]).toMatchObject({ ip: '190.0.0.1', userAgent: 'Mozilla/5.0' });
  });

  it('cierra la evidencia con el desenlace real de la operación', async () => {
    const { cliente, escrituras } = prismaFalso();
    await new EvidenciaAutorizacionPrisma(cliente).cerrarAutorizacion(
      'evidencia-1',
      { resultado: 'fallida', motivoFallo: 'credenciales_invalidas' },
      AHORA,
    );
    expect(escrituras[0]).toMatchObject({ resultado: 'fallida', motivoFallo: 'credenciales_invalidas' });
  });

  it('revocar corta lo vigente y deja constancia de cuándo', async () => {
    const { cliente, escrituras } = prismaFalso();
    const cuantas = await new EvidenciaAutorizacionPrisma(cliente).revocarVigentes('usuario-1', AHORA);
    expect(cuantas).toBe(2);
    expect(escrituras[0]).toMatchObject({ resultado: 'revocada', revocadaEn: AHORA });
  });

  it('lista las autorizaciones del usuario en forma publicable', async () => {
    const { cliente } = prismaFalso();
    const lista = await new EvidenciaAutorizacionPrisma(cliente).listarAutorizaciones('usuario-1', 10);
    expect(lista[0]?.otorgadaEn).toBe(AHORA.toISOString());
    expect(lista[0]?.alcances).toEqual(['leer_exogena']);
  });
});

describe('retención de la evidencia', () => {
  it('el límite son 5 años hacia atrás', () => {
    const limite = limiteDeRetencion(new Date('2026-08-15T10:00:00Z'));
    expect(limite.getUTCFullYear()).toBe(2026 - ANIOS_RETENCION_EVIDENCIA);
  });

  it('purgar devuelve cuántas evidencias se eliminaron', async () => {
    const { cliente } = prismaFalso();
    expect(await new EvidenciaAutorizacionPrisma(cliente).purgarAnterioresA(AHORA)).toBe(7);
  });
});
