import { Secreto } from '@turenta/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SolicitudConexionDian } from '@turenta/core';

/**
 * The rule that matters here: evidence is written BEFORE touching the portal,
 * and if it cannot be written the connection does not happen (PLAN-DIAN §1.3).
 */

const registros: string[] = [];
const evidencia = {
  registrarAutorizacion: vi.fn(() => {
    registros.push('evidencia');
    return Promise.resolve({ id: 'evidencia-1' });
  }),
  cerrarAutorizacion: vi.fn((_id: string, desenlace: { resultado: string }) => {
    registros.push(`cierre:${desenlace.resultado}`);
    return Promise.resolve();
  }),
  listarAutorizaciones: vi.fn(() => Promise.resolve([])),
  revocarVigentes: vi.fn(() => Promise.resolve(0)),
  purgarAnterioresA: vi.fn(() => Promise.resolve(0)),
};

const conexion = {
  descargarExogena: vi.fn(() => {
    registros.push('portal');
    return Promise.resolve({ exito: true, contenido: new Uint8Array([1]), nombreArchivo: 'x.xlsx' });
  }),
  descargarDeclaracion: vi.fn(() => Promise.resolve({ exito: true, contenido: new Uint8Array([1]) })),
};

let limitador = crearLimitador();

function crearLimitador() {
  return {
    consultar: vi.fn(() => ({ permitido: true, esperarSegundos: 0 })),
    registrarIntento: vi.fn(),
    registrarFallo: vi.fn(),
    conPermiso: vi.fn(<T,>(operacion: () => Promise<T>) => operacion()),
  };
}

const boveda = {
  guardar: vi.fn(() => Promise.resolve()),
  buscar: vi.fn(() => Promise.resolve(null)),
  marcarUso: vi.fn(() => Promise.resolve()),
  olvidar: vi.fn(() => Promise.resolve(true)),
  listar: vi.fn(() => Promise.resolve([])),
  purgarSinUsoDesde: vi.fn(() => Promise.resolve(0)),
};

vi.mock('@/server/composicion', () => ({
  obtenerConexionDian: () => conexion,
  obtenerEvidenciaDian: () => evidencia,
  obtenerLimitadorDian: () => limitador,
  obtenerBovedaDian: () => boveda,
}));

const { descargarDeLaDian } = await import('@/server/dian/descarga');

function solicitud(): SolicitudConexionDian {
  return {
    credenciales: { tipoDocumento: 'CC', numeroDocumento: '1000000001', contrasena: new Secreto('clave') },
    titular: '1000000001',
    anioGravable: 2025,
    modoIngreso: 'propio',
    recordarAcceso: false,
  };
}

const HUELLA = { ip: '190.0.0.1', userAgent: 'navegador' };

beforeEach(() => {
  registros.length = 0;
  vi.clearAllMocks();
  limitador = crearLimitador();
});

describe('caso de uso de descarga desde la DIAN', () => {
  it('deja evidencia ANTES de tocar el portal', async () => {
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(registros).toEqual(['evidencia', 'portal', 'cierre:exitosa']);
  });

  it('si la evidencia no se puede escribir, NO se conecta', async () => {
    evidencia.registrarAutorizacion.mockRejectedValueOnce(new Error('base caída'));
    await expect(descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA)).rejects.toThrow();
    expect(conexion.descargarExogena).not.toHaveBeenCalled();
  });

  it('cierra la evidencia con el desenlace real cuando el portal falla', async () => {
    conexion.descargarExogena.mockResolvedValueOnce({
      exito: false,
      motivoFallo: 'credenciales_invalidas',
    } as never);
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(registros).toContain('cierre:fallida');
  });

  it('guarda la huella de la petición junto a la autorización', async () => {
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(evidencia.registrarAutorizacion).toHaveBeenCalledWith(expect.anything(), HUELLA);
  });

  it('la autorización solo pide el alcance de la operación en curso', async () => {
    await descargarDeLaDian('declaracion', solicitud(), 'usuario-1', HUELLA);
    expect(evidencia.registrarAutorizacion).toHaveBeenCalledWith(
      expect.objectContaining({ alcances: ['leer_declaraciones'] }),
      HUELLA,
    );
  });

  it('bloquea sin tocar el portal cuando el limitador dice que no', async () => {
    limitador.consultar.mockReturnValueOnce({ permitido: false, esperarSegundos: 42 });
    const { esperarSegundos } = await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(esperarSegundos).toBe(42);
    expect(conexion.descargarExogena).not.toHaveBeenCalled();
    expect(evidencia.registrarAutorizacion).not.toHaveBeenCalled();
  });

  it('unas credenciales rechazadas cuentan como fallo para el limitador', async () => {
    conexion.descargarExogena.mockResolvedValueOnce({
      exito: false,
      motivoFallo: 'credenciales_invalidas',
    } as never);
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(limitador.registrarFallo).toHaveBeenCalled();
  });

  it('un fallo del portal que no son credenciales NO penaliza al usuario', async () => {
    conexion.descargarExogena.mockResolvedValueOnce({
      exito: false,
      motivoFallo: 'portal_no_disponible',
    } as never);
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(limitador.registrarFallo).not.toHaveBeenCalled();
  });

  it('la operación corre dentro del portón de concurrencia', async () => {
    await descargarDeLaDian('exogena', solicitud(), 'usuario-1', HUELLA);
    expect(limitador.conPermiso).toHaveBeenCalled();
  });
});
