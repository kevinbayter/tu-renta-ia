import { describe, expect, it } from 'vitest';

import { MARCA_REDACTADO } from '../src/dian/secreto';
import { validarSolicitudConexion } from '../src/dian/solicitud-conexion';

const ANIO_ACTUAL = 2026;

const VALIDO = {
  tipoDocumento: 'CC',
  numeroDocumento: '1234567890',
  contrasena: 'clave-de-prueba',
  titular: '1234567890',
  anioGravable: 2025,
};

function validar(cambios: Record<string, unknown> = {}) {
  return validarSolicitudConexion({ ...VALIDO, ...cambios }, ANIO_ACTUAL);
}

describe('validación de la solicitud de conexión', () => {
  it('acepta una solicitud correcta y envuelve la contraseña en un Secreto', () => {
    const resultado = validar();
    expect(resultado.valida).toBe(true);
    if (!resultado.valida) {
      return;
    }
    expect(resultado.solicitud.credenciales.contrasena.revelar()).toBe(VALIDO.contrasena);
    expect(JSON.stringify(resultado.solicitud.credenciales)).toContain(MARCA_REDACTADO);
    expect(JSON.stringify(resultado.solicitud.credenciales)).not.toContain(VALIDO.contrasena);
  });

  it('limpia puntos y espacios del documento', () => {
    const resultado = validar({ numeroDocumento: '1.234.567.890', titular: '1.234.567.890' });
    expect(resultado.valida && resultado.solicitud.credenciales.numeroDocumento).toBe('1234567890');
  });

  it('rechaza que el titular sea una cédula ajena a nombre propio', () => {
    // Without this, anyone could forge authorization evidence for someone else.
    const resultado = validar({ titular: '9999999999' });
    expect(resultado).toEqual({ valida: false, error: 'Solo puedes conectar tu propia cuenta' });
  });

  it('en modo tercero exige que el titular sea OTRA persona', () => {
    // The operator signs in with their own credentials; matching means 'propio'.
    const resultado = validar({ modoIngreso: 'tercero' });
    expect(resultado.valida).toBe(false);
  });

  it('en modo tercero acepta un titular distinto y válido', () => {
    const resultado = validar({ modoIngreso: 'tercero', titular: '9999999999' });
    expect(resultado.valida).toBe(true);
    expect(resultado.valida && resultado.solicitud.modoIngreso).toBe('tercero');
    expect(resultado.valida && resultado.solicitud.titular).toBe('9999999999');
  });

  it('rechaza documentos y contraseñas fuera de rango', () => {
    expect(validar({ numeroDocumento: '123', titular: '123' }).valida).toBe(false);
    expect(validar({ contrasena: 'ab' }).valida).toBe(false);
    expect(validar({ contrasena: 'x'.repeat(65) }).valida).toBe(false);
  });

  it('rechaza tipos de documento inventados', () => {
    expect(validar({ tipoDocumento: 'XX' }).valida).toBe(false);
  });

  it('rechaza años imposibles y acepta el año por defecto', () => {
    expect(validar({ anioGravable: 1990 }).valida).toBe(false);
    expect(validar({ anioGravable: ANIO_ACTUAL + 1 }).valida).toBe(false);
    expect(validar({ anioGravable: 2025.5 }).valida).toBe(false);
    const sinAnio = validarSolicitudConexion(
      { ...VALIDO, anioGravable: undefined },
      ANIO_ACTUAL,
    );
    expect(sinAnio.valida && sinAnio.solicitud.anioGravable).toBe(ANIO_ACTUAL - 1);
  });

  it('no revienta con un cuerpo basura', () => {
    expect(validarSolicitudConexion({}, ANIO_ACTUAL).valida).toBe(false);
    expect(
      validarSolicitudConexion({ numeroDocumento: { a: 1 }, contrasena: 42 }, ANIO_ACTUAL).valida,
    ).toBe(false);
  });
});
