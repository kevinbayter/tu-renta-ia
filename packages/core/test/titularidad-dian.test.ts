import { describe, expect, it } from 'vitest';

import { validarSolicitudConexion } from '../src/dian/solicitud-conexion';
import { errorDeTitularidad } from '../src/dian/titularidad';

import type { SolicitudConexionDian } from '../src/dian/solicitud-conexion';

const USUARIO = '1234567890';
const TERCERO = '23456789';
const DESCONOCIDO = '99999999';

function solicitud(titular: string, enNombreDeOtro: boolean): SolicitudConexionDian {
  const resultado = validarSolicitudConexion(
    { tipoDocumento: 'CC', numeroDocumento: titular, contrasena: 'clave-de-prueba', titular, enNombreDeOtro },
    2026,
  );
  if (!resultado.valida) {
    throw new Error(resultado.error);
  }
  return resultado.solicitud;
}

const CONTEXTO = { cedulaUsuario: '1.234.567.890', cedulasDeTerceros: [TERCERO] };

describe('de quién es la cuenta de la DIAN que se abre', () => {
  it('a nombre propio solo la cuenta del usuario', () => {
    expect(errorDeTitularidad(solicitud(USUARIO, false), CONTEXTO)).toBeNull();
    expect(errorDeTitularidad(solicitud(TERCERO, false), CONTEXTO)).toContain('no es la tuya');
  });

  it('sin cédula en el perfil no se abre ninguna cuenta como propia', () => {
    const sinPerfil = { cedulaUsuario: '', cedulasDeTerceros: [] };
    expect(errorDeTitularidad(solicitud(USUARIO, false), sinPerfil)).not.toBeNull();
  });

  it('en nombre de otro solo una persona a la que el usuario le elabora la declaración', () => {
    expect(errorDeTitularidad(solicitud(TERCERO, true), CONTEXTO)).toBeNull();
    expect(errorDeTitularidad(solicitud(DESCONOCIDO, true), CONTEXTO)).toContain('Primero crea la declaración');
  });

  it('la cuenta propia no se abre como si fuera de otro', () => {
    expect(errorDeTitularidad(solicitud(USUARIO, true), CONTEXTO)).toContain('tu propia cuenta');
  });
});
