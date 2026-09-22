import { afterEach, describe, expect, it } from 'vitest';

import { ConexionMuisca } from '../../src/dian/conexion-muisca';

import { ESPERA_FALLO_MS, ESPERA_TEST_MS, contexto, credenciales } from './ayudas-muisca';
import { TITULAR_FICTICIO } from './fixtures/datos-ficticios';
import { levantarMuiscaFalso } from './servidor-fixtures';

import type { MuiscaFalso, ModoServidor } from './servidor-fixtures';

/** Exógena y garantías transversales del adaptador. */

let servidor: MuiscaFalso | null = null;

async function conectar(modo: ModoServidor = 'normal', esperaMs = ESPERA_TEST_MS) {
  servidor = await levantarMuiscaFalso(modo);
  return new ConexionMuisca({ urlBase: servidor.urlBase, esperaMs });
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
    expect(indiceDe('/descargar/exogena')).toBeGreaterThan(indiceDe('WebDashboard'));
  });

  it('espera a que el portal registre el año antes de generar el reporte', async () => {
    // The year is registered by a RichFaces postback, not client-side. Racing
    // it generated a report with no year: no file and no error either. A slow
    // portal is the only way to tell waiting apart from getting lucky.
    const conexion = await conectar('portal_lento');
    const resultado = await conexion.descargarExogena(credenciales(), contexto(2023));
    expect(resultado.exito).toBe(true);
    expect(resultado.nombreArchivo).toBe('reporteExogena2023.xlsx');
  });

  it('descarga una sola vez: generar ya trae el archivo', async () => {
    const conexion = await conectar();
    await conexion.descargarExogena(credenciales(), contexto(2024));
    const descargas = (servidor?.visitas ?? []).filter((r) => r === '/descargar/exogena');
    expect(descargas).toHaveLength(1);
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
