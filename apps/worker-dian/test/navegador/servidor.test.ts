import { levantarMuiscaFalso } from '@turenta/adaptadores/test/navegador/servidor-fixtures';
import { TITULAR_FICTICIO } from '@turenta/adaptadores/test/navegador/fixtures/datos-ficticios';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { MuiscaFalso } from '@turenta/adaptadores/test/navegador/servidor-fixtures';
import type { Server } from 'node:http';

/**
 * Real worker integration: HTTP request -> ConexionMuisca -> fake MUISCA.
 * Proves the pieces fit together, not just that each one works alone.
 */

const TOKEN = 'token-de-prueba';

let muisca: MuiscaFalso;
let worker: Server;
let urlWorker = '';

beforeAll(async () => {
  muisca = await levantarMuiscaFalso('normal');
  process.env['WORKER_DIAN_TOKEN'] = TOKEN;
  process.env['MUISCA_URL_BASE'] = muisca.urlBase;
  process.env['NODE_ENV'] = 'test';
  // Dynamic import: the module reads the environment when loaded.
  const modulo = await import('../../src/servidor');
  worker = modulo.servidor;
  await new Promise<void>((listo) => worker.listen(0, '127.0.0.1', listo));
  const direccion = worker.address();
  const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
  urlWorker = `http://127.0.0.1:${String(puerto)}`;
});

afterAll(async () => {
  await new Promise<void>((listo) => worker.close(() => listo()));
  await muisca.cerrar();
});

function pedir(ruta: string, cuerpo: unknown, token = TOKEN) {
  return fetch(`${urlWorker}${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
  });
}

const PETICION_VALIDA = {
  tipoDocumento: 'CC',
  numeroDocumento: TITULAR_FICTICIO.documento,
  contrasena: TITULAR_FICTICIO.contrasena,
  contexto: {
    titularIdentificacion: TITULAR_FICTICIO.documento,
    operadorUsuarioId: 'usuario-1',
    anioGravable: 2024,
  },
};

describe('worker aislado de conexión con la DIAN', () => {
  it('responde al healthcheck sin token: es lo que consulta Docker', async () => {
    const respuesta = await fetch(`${urlWorker}/salud`);
    expect(respuesta.status).toBe(200);
    expect(((await respuesta.json()) as { estado: string }).estado).toBe('ok');
  });

  it('rechaza sin token válido', async () => {
    const respuesta = await pedir('/dian/exogena', PETICION_VALIDA, 'token-equivocado');
    expect(respuesta.status).toBe(401);
  });

  it('descarga la exógena de punta a punta y la devuelve en base64', async () => {
    const respuesta = await pedir('/dian/exogena', PETICION_VALIDA);
    const cuerpo = (await respuesta.json()) as {
      exito: boolean;
      nombreArchivo: string;
      contenidoBase64: string;
    };
    expect(cuerpo.exito).toBe(true);
    expect(cuerpo.nombreArchivo).toBe('reporteExogena2024.xlsx');
    expect(Buffer.from(cuerpo.contenidoBase64, 'base64').toString()).toContain('exogena-ficticia');
  });

  it('descarga la declaración presentada del año pedido', async () => {
    const respuesta = await pedir('/dian/declaracion', PETICION_VALIDA);
    const cuerpo = (await respuesta.json()) as { exito: boolean; nombreArchivo: string };
    expect(cuerpo.exito).toBe(true);
    expect(cuerpo.nombreArchivo).toBe('3333333333333.pdf');
  });

  it('nunca devuelve la contraseña en la respuesta', async () => {
    const respuesta = await pedir('/dian/exogena', PETICION_VALIDA);
    expect(await respuesta.text()).not.toContain(TITULAR_FICTICIO.contrasena);
  });

  it('una ruta desconocida no filtra nada ni revienta', async () => {
    const respuesta = await pedir('/dian/presentar', PETICION_VALIDA);
    expect(respuesta.status).toBe(404);
  });

  it('un cuerpo ilegible se responde como fallo, sin tumbar el worker', async () => {
    const respuesta = await fetch(`${urlWorker}/dian/exogena`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: 'no es json',
    });
    const cuerpo = (await respuesta.json()) as { exito: boolean };
    expect(cuerpo.exito).toBe(false);
    // And it is still alive:
    expect((await fetch(`${urlWorker}/salud`)).status).toBe(200);
  });
});
