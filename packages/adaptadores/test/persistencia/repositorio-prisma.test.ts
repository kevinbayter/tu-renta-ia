import { describe, expect, it } from 'vitest';

import { RepositorioPrisma } from '../../src/persistencia/repositorio-prisma';

import type { PrismaClient } from '../../src/persistencia/generado/client';

type Fila = Record<string, string>;

interface Upsert {
  where: { usuarioId_identificacion: { usuarioId: string; identificacion: string } };
  create: Fila;
  update: Fila;
}

/** In-memory persona table with Prisma's upsert semantics (column defaults included). */
function prismaFalso(): PrismaClient {
  const filas = new Map<string, Fila>();
  const upsert = ({ where, create, update }: Upsert) => {
    const { usuarioId, identificacion } = where.usuarioId_identificacion;
    const clave = `${usuarioId}:${identificacion}`;
    const previa = filas.get(clave);
    const fila = previa ? { ...previa, ...update } : { id: `persona-${String(filas.size + 1)}`, email: '', telefono: '', ...create };
    filas.set(clave, fila);
    return Promise.resolve({ id: fila['id'] });
  };
  const findMany = () => Promise.resolve([...filas.values()]);
  return { persona: { upsert, findMany } } as unknown as PrismaClient;
}

const CLIENTE = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  identificacion: '1000000001',
  email: 'ana@correo.co',
  telefono: '3001234567',
};

describe('personas administradas', () => {
  it('registrarla desde una declaración no borra el email ni el teléfono del cliente', async () => {
    const repositorio = new RepositorioPrisma(prismaFalso());
    await repositorio.guardarPersona('usuario-1', CLIENTE);
    await repositorio.asegurarPersona('usuario-1', {
      nombres: 'Ana María',
      apellidos: 'Pérez',
      identificacion: '1.000.000.001',
    });
    const personas = await repositorio.listarPersonas('usuario-1');
    expect(personas).toHaveLength(1);
    expect(personas[0]).toMatchObject({ nombres: 'Ana María', email: CLIENTE.email, telefono: CLIENTE.telefono });
  });

  it('la crea sin datos de contacto si aún no existe', async () => {
    const repositorio = new RepositorioPrisma(prismaFalso());
    await repositorio.asegurarPersona('usuario-1', { nombres: 'Luis', apellidos: 'Gómez', identificacion: '79.000.001' });
    const personas = await repositorio.listarPersonas('usuario-1');
    expect(personas).toEqual([expect.objectContaining({ identificacion: '79000001', email: '', telefono: '' })]);
  });
});
