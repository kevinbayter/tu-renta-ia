import { createServer } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { Secreto } from '@turenta/core';
import type { ContextoOperacionDian, CredencialesDian } from '@turenta/core';

import { ConexionDianRemota } from '../../src/dian/conexion-dian-remota';
import { crearConexionDianDesdeEnv, conexionDianHabilitada } from '../../src/dian/crear-conexion-dian';

import type { Server } from 'node:http';

const CLAVE = 'clave-centinela-no-real';
const TOKEN = 'token-de-prueba';

function credenciales(): CredencialesDian {
  return { tipoDocumento: 'CC', numeroDocumento: '1000000001', contrasena: new Secreto(CLAVE) };
}

const CONTEXTO: ContextoOperacionDian = {
  titularIdentificacion: '1000000001',
  operadorUsuarioId: 'usuario-1',
  anioGravable: 2025,
};

let servidor: Server | null = null;
const recibido: { autorizacion: string | undefined; cuerpo: string; ruta: string } = {
  autorizacion: undefined,
  cuerpo: '',
  ruta: '',
};

/** Fake worker: replies what we tell it and records what it received. */
async function levantarWorker(
  respuesta: Record<string, unknown>,
  estado = 200,
): Promise<string> {
  servidor = createServer((peticion, salida) => {
    recibido.ruta = peticion.url ?? '';
    recibido.autorizacion = peticion.headers.authorization;
    let datos = '';
    peticion.on('data', (t) => (datos += String(t)));
    peticion.on('end', () => {
      recibido.cuerpo = datos;
      salida.writeHead(estado, { 'content-type': 'application/json' });
      salida.end(JSON.stringify(respuesta));
    });
  });
  await new Promise<void>((listo) => servidor?.listen(0, '127.0.0.1', listo));
  const direccion = servidor.address();
  const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
  return `http://127.0.0.1:${String(puerto)}`;
}

afterEach(async () => {
  await new Promise<void>((listo) => (servidor ? servidor.close(() => listo()) : listo()));
  servidor = null;
});

describe('conexión remota con el worker aislado', () => {
  it('devuelve el archivo que entrega el worker', async () => {
    const url = await levantarWorker({
      exito: true,
      nombreArchivo: 'reporteExogena2025.xlsx',
      contenidoBase64: Buffer.from('contenido-ficticio').toString('base64'),
    });
    const resultado = await new ConexionDianRemota({ url, token: TOKEN }).descargarExogena(
      credenciales(),
      CONTEXTO,
    );
    expect(resultado.exito).toBe(true);
    expect(resultado.nombreArchivo).toBe('reporteExogena2025.xlsx');
    expect(new TextDecoder().decode(resultado.contenido)).toBe('contenido-ficticio');
  });

  it('autentica con el token compartido y usa la ruta de la operación', async () => {
    const url = await levantarWorker({ exito: false, motivoFallo: 'desconocido' });
    await new ConexionDianRemota({ url, token: TOKEN }).descargarDeclaracion(credenciales(), CONTEXTO);
    expect(recibido.autorizacion).toBe(`Bearer ${TOKEN}`);
    expect(recibido.ruta).toBe('/dian/declaracion');
  });

  it('propaga el motivo de fallo del worker sin reinterpretarlo', async () => {
    const url = await levantarWorker({ exito: false, motivoFallo: 'credenciales_invalidas' });
    const resultado = await new ConexionDianRemota({ url, token: TOKEN }).descargarExogena(
      credenciales(),
      CONTEXTO,
    );
    expect(resultado.motivoFallo).toBe('credenciales_invalidas');
  });

  it('si el worker no responde, dice servicio_no_disponible: no culpa a la DIAN', async () => {
    const conexion = new ConexionDianRemota({
      url: 'http://127.0.0.1:1',
      token: TOKEN,
      tiempoMaximoMs: 1_000,
    });
    const resultado = await conexion.descargarExogena(credenciales(), CONTEXTO);
    expect(resultado.motivoFallo).toBe('servicio_no_disponible');
  });

  it('un 429 del worker se traduce a servicio_no_disponible', async () => {
    const url = await levantarWorker({}, 429);
    const resultado = await new ConexionDianRemota({ url, token: TOKEN }).descargarExogena(
      credenciales(),
      CONTEXTO,
    );
    expect(resultado.motivoFallo).toBe('servicio_no_disponible');
  });

  it('nunca devuelve la contraseña en el resultado', async () => {
    const url = await levantarWorker({ exito: false, motivoFallo: 'desconocido', detalle: 'x' });
    const resultado = await new ConexionDianRemota({ url, token: TOKEN }).descargarExogena(
      credenciales(),
      CONTEXTO,
    );
    expect(JSON.stringify(resultado)).not.toContain(CLAVE);
  });
});

describe('fábrica desde el entorno', () => {
  it('sin worker configurado no revienta: degrada y deja viva la vía manual', async () => {
    const conexion = crearConexionDianDesdeEnv({});
    const resultado = await conexion.descargarExogena(credenciales(), CONTEXTO);
    expect(resultado.exito).toBe(false);
    expect(resultado.motivoFallo).toBe('servicio_no_disponible');
    expect(conexionDianHabilitada({})).toBe(false);
  });

  it('con worker configurado, la conexión queda habilitada', () => {
    const env = { WORKER_DIAN_URL: 'http://worker:8080', WORKER_DIAN_TOKEN: 'x' };
    expect(conexionDianHabilitada(env)).toBe(true);
    expect(crearConexionDianDesdeEnv(env)).toBeInstanceOf(ConexionDianRemota);
  });

  it('una configuración a medias se trata como no habilitada', () => {
    expect(conexionDianHabilitada({ WORKER_DIAN_URL: 'http://worker:8080' })).toBe(false);
  });
});
