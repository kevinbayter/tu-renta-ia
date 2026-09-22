import { Secreto } from '@turenta/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatosPresentacion, SolicitudConexionDian } from '@turenta/core';

/**
 * Marcar "recordar mi acceso" al presentar tiene que guardar el acceso igual
 * que al descargar. Se rompió sin que nadie lo notara: la casilla llegaba hasta
 * la web, pero el contexto que iba al worker no la llevaba, así que el sobre
 * nunca se sellaba y nunca había nada que guardar. El síntoma es sutil —pedir
 * la contraseña una y otra vez— y por eso hace falta fijarlo aquí.
 */

const evidencia = {
  registrarAutorizacion: vi.fn(() => Promise.resolve({ id: 'evidencia-1' })),
  cerrarAutorizacion: vi.fn(() => Promise.resolve()),
  listarAutorizaciones: vi.fn(() => Promise.resolve([])),
  revocarVigentes: vi.fn(() => Promise.resolve(0)),
  purgarAnterioresA: vi.fn(() => Promise.resolve(0)),
};

const SOBRE = { version: 1, iv: 'iv', datos: 'datos', etiqueta: 'etiqueta' };
let contextoRecibido: Record<string, unknown> = {};

const conexion = {
  presentarDeclaracion: vi.fn((_credenciales: unknown, contexto: Record<string, unknown>) => {
    contextoRecibido = contexto;
    // El worker sella el sobre solo si el contexto pidió recordar el acceso.
    const cifrado = contexto['recordarAcceso'] === true ? { cifrado: SOBRE } : {};
    return Promise.resolve({ exito: true, firmada: true, presentada: true, ...cifrado });
  }),
};

const boveda = {
  guardar: vi.fn(() => Promise.resolve()),
  buscar: vi.fn(() => Promise.resolve(null)),
  marcarUso: vi.fn(() => Promise.resolve()),
  olvidar: vi.fn(() => Promise.resolve(true)),
  listar: vi.fn(() => Promise.resolve([])),
  purgarSinUsoDesde: vi.fn(() => Promise.resolve(0)),
};

const limitador = {
  consultar: vi.fn(() => ({ permitido: true, esperarSegundos: 0 })),
  registrarIntento: vi.fn(),
  registrarFallo: vi.fn(),
  conPermiso: vi.fn(<T,>(operacion: () => Promise<T>) => operacion()),
};

vi.mock('@/server/composicion', () => ({
  obtenerConexionDian: () => conexion,
  obtenerEvidenciaDian: () => evidencia,
  obtenerLimitadorDian: () => limitador,
  obtenerBovedaDian: () => boveda,
}));

const { presentarEnLaDian } = await import('@/server/dian/diligenciar');

const DATOS: DatosPresentacion = {
  genero: '1',
  actividadEconomica: '0020',
  casillas: { '29': 1_000_000 },
};

function solicitud(cambios: Partial<SolicitudConexionDian> = {}): SolicitudConexionDian {
  return {
    credenciales: { tipoDocumento: 'CC', numeroDocumento: '1000000001', contrasena: new Secreto('clave') },
    titular: '1000000001',
    anioGravable: 2025,
    modoIngreso: 'propio',
    recordarAcceso: false,
    alcancesAceptados: ['presentar_declaracion'],
    enNombreDeOtro: false,
    ...cambios,
  };
}

const OPERADOR = { usuarioId: 'usuario-1', huella: { ip: '190.0.0.1', userAgent: 'navegador' } };

beforeEach(() => {
  vi.clearAllMocks();
  contextoRecibido = {};
});

describe('recordar el acceso al presentar', () => {
  it('le pide al worker que selle el sobre cuando el usuario marcó la casilla', async () => {
    await presentarEnLaDian(solicitud({ recordarAcceso: true }), DATOS, OPERADOR);
    expect(contextoRecibido['recordarAcceso']).toBe(true);
  });

  it('guarda el acceso para no volver a pedir la contraseña', async () => {
    await presentarEnLaDian(solicitud({ recordarAcceso: true }), DATOS, OPERADOR);
    expect(boveda.guardar).toHaveBeenCalledWith('usuario-1', '1000000001', {
      tipoDocumento: 'CC',
      numeroDocumento: '1000000001',
      cifrado: SOBRE,
    });
  });

  it('sin la casilla no guarda nada: recordar es una decisión del usuario', async () => {
    await presentarEnLaDian(solicitud(), DATOS, OPERADOR);
    expect(contextoRecibido['recordarAcceso']).toBeUndefined();
    expect(boveda.guardar).not.toHaveBeenCalled();
  });
});
