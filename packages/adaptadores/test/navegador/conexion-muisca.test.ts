import { afterEach, describe, expect, it } from 'vitest';

import { Secreto } from '@turenta/core';
import type { ContextoOperacionDian, CredencialesDian } from '@turenta/core';

import { ConexionMuisca } from '../../src/dian/conexion-muisca';

import { TITULAR_FICTICIO } from './fixtures/datos-ficticios';
import { levantarMuiscaFalso } from './servidor-fixtures';

import type { MuiscaFalso, ModoServidor } from './servidor-fixtures';


/**
 * Full adapter flow against a fake MUISCA.
 *
 * IMPORTANT LIMIT: these fixtures freeze what WE believe about the portal, not
 * what the portal is. If DIAN renames a control these tests stay green and
 * production breaks anyway. They are regression tests of our own code, not a
 * contract with the tax authority.
 */

const ESPERA_TEST_MS = 15_000;
/** For cases that MUST time out: otherwise CI pays 15 s per test. */
const ESPERA_FALLO_MS = 2_000;

let servidor: MuiscaFalso | null = null;

async function conectar(modo: ModoServidor = 'normal', esperaMs = ESPERA_TEST_MS) {
  servidor = await levantarMuiscaFalso(modo);
  return new ConexionMuisca({ urlBase: servidor.urlBase, esperaMs });
}

function credenciales(contrasena: string = TITULAR_FICTICIO.contrasena): CredencialesDian {
  return {
    tipoDocumento: 'CC',
    numeroDocumento: TITULAR_FICTICIO.documento,
    contrasena: new Secreto(contrasena),
  };
}

function contexto(anioGravable: number): ContextoOperacionDian {
  return {
    titularIdentificacion: TITULAR_FICTICIO.documento,
    operadorUsuarioId: 'usuario-de-prueba',
    anioGravable,
  };
}

afterEach(async () => {
  await servidor?.cerrar();
  servidor = null;
});

describe('exógena: flujo completo contra el MUISCA falso', () => {
  it('autentica, acepta condiciones, elige el año y descarga', async () => {
    const conexion = await conectar();
    const resultado = await conexion.descargarExogena(credenciales(), contexto(2024));
    expect(resultado.exito).toBe(true);
    // The name carries the year: proof selectOption actually applied.
    expect(resultado.nombreArchivo).toBe('reporteExogena2024.xlsx');
    expect(new TextDecoder().decode(resultado.contenido)).toContain('exogena-ficticia-2024');
  });

  it('recorre los pasos en orden: login antes que dashboard antes que descarga', async () => {
    const conexion = await conectar();
    await conexion.descargarExogena(credenciales(), contexto(2025));
    const rutas = servidor?.visitas ?? [];
    const indiceDe = (parte: string) => rutas.findIndex((r) => r.includes(parte));
    expect(indiceDe('WebArquitectura')).toBeGreaterThanOrEqual(0);
    expect(indiceDe('WebDashboard')).toBeGreaterThan(indiceDe('WebArquitectura'));
    expect(indiceDe('/descargar/exogena/')).toBeGreaterThan(indiceDe('WebDashboard'));
  });

  it('si la DIAN rechaza las credenciales, lo dice y no inventa otro motivo', async () => {
    const conexion = await conectar('credenciales_malas');
    const resultado = await conexion.descargarExogena(credenciales('otra-clave'), contexto(2024));
    expect(resultado.exito).toBe(false);
    expect(resultado.motivoFallo).toBe('credenciales_invalidas');
  });

  it('si el portal cambia sus controles, devuelve estructura_cambiada', async () => {
    const conexion = await conectar('portal_cambiado', ESPERA_FALLO_MS);
    const resultado = await conexion.descargarExogena(credenciales(), contexto(2024));
    expect(resultado.exito).toBe(false);
    expect(resultado.motivoFallo).toBe('estructura_cambiada');
  });

  it('nunca devuelve la contraseña, ni siquiera al fallar', async () => {
    const conexion = await conectar('portal_cambiado', ESPERA_FALLO_MS);
    const resultado = await conexion.descargarExogena(credenciales(), contexto(2024));
    expect(JSON.stringify(resultado)).not.toContain(TITULAR_FICTICIO.contrasena);
  });
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

describe('garantías de seguridad del adaptador', () => {
  it('cierra SIEMPRE el navegador, incluso cuando la operación falla', async () => {
    servidor = await levantarMuiscaFalso('portal_cambiado');
    const { chromium } = await import('playwright');
    let cerrados = 0;
    const conexion = new ConexionMuisca({
      urlBase: servidor.urlBase,
      esperaMs: ESPERA_FALLO_MS,
      lanzarNavegador: async () => {
        const navegador = await chromium.launch({ headless: true });
        const cerrarOriginal = navegador.close.bind(navegador);
        navegador.close = async () => {
          cerrados += 1;
          return cerrarOriginal();
        };
        return navegador;
      },
    });
    await conexion.descargarExogena(credenciales(), contexto(2024));
    expect(cerrados).toBe(1);
  });

  it('si el portal no responde, es portal_no_disponible y no un fallo genérico', async () => {
    // Closed port: simulates MUISCA being down.
    const conexion = new ConexionMuisca({ urlBase: 'http://127.0.0.1:1', esperaMs: ESPERA_FALLO_MS });
    const resultado = await conexion.descargarExogena(credenciales(), contexto(2024));
    expect(resultado.exito).toBe(false);
    expect(resultado.motivoFallo).toBe('portal_no_disponible');
  });
});
