import { afterEach, describe, expect, it } from 'vitest';

import { ConexionMuisca } from '../../src/dian/conexion-muisca';

import { ESPERA_TEST_MS, contexto, credenciales } from './ayudas-muisca';
import { levantarMuiscaFalso } from './servidor-fixtures';

import type { MuiscaFalso, ModoServidor } from './servidor-fixtures';

/** Descarga de declaraciones ya presentadas. */

let servidor: MuiscaFalso | null = null;

async function conectar(modo: ModoServidor = 'normal', esperaMs = ESPERA_TEST_MS) {
  servidor = await levantarMuiscaFalso(modo);
  return new ConexionMuisca({ urlBase: servidor.urlBase, esperaMs });
}

afterEach(async () => {
  await servidor?.cerrar();
  servidor = null;
});

describe('declaraciones presentadas: flujo completo', () => {
  it('abre el menú con hover real y descarga el PDF del año pedido', async () => {
    const conexion = await conectar();
    const resultado = await conexion.descargarDeclaracion(credenciales(), contexto(2024));
    expect(resultado.exito).toBe(true);
    // Row 2024: proves it picked the right row and did not grab the
    // corregir/pagar icons.
    expect(resultado.nombreArchivo).toBe('3333333333333.pdf');
  });

  it('elige la fila del año pedido, no la primera de la tabla', async () => {
    const conexion = await conectar();
    const resultado = await conexion.descargarDeclaracion(credenciales(), contexto(2022));
    expect(resultado.nombreArchivo).toBe('1111111111111.pdf');
  });

  it('sin declaraciones responde sin_declaracion, que NO es un error del portal', async () => {
    const conexion = await conectar('sin_declaraciones');
    const resultado = await conexion.descargarDeclaracion(credenciales(), contexto(2024));
    expect(resultado.motivoFallo).toBe('sin_declaracion');
  });

  it('un año que no está en la tabla responde sin_declaracion', async () => {
    const conexion = await conectar();
    const resultado = await conexion.descargarDeclaracion(credenciales(), contexto(2019));
    expect(resultado.motivoFallo).toBe('sin_declaracion');
  });
});
