import type { SolicitudConexionDian } from './solicitud-conexion';

/**
 * Whose DIAN account a user may open. With their own ID, only their own
 * account; with someone else's credentials, only a person they already prepare
 * a return for. Without this, anyone holding a leaked password could use the
 * platform to pull a stranger's tax data under the evidence of "own account".
 */

export interface ContextoTitularidad {
  /** ID stored in the authenticated user's profile; '' when not registered. */
  cedulaUsuario: string;
  /** IDs of the third-party returns this user prepares. */
  cedulasDeTerceros: string[];
}

function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function errorDeTitularidad(solicitud: SolicitudConexionDian, contexto: ContextoTitularidad): string | null {
  const cedulaUsuario = soloDigitos(contexto.cedulaUsuario);
  const esSuya = cedulaUsuario !== '' && cedulaUsuario === solicitud.titular;
  if (!solicitud.enNombreDeOtro) {
    return esSuya ? null : 'Esta cuenta de la DIAN no es la tuya. Si es de otra persona, conéctala desde su declaración.';
  }
  if (esSuya) {
    return 'Esta es tu propia cuenta: conéctala desde tu declaración.';
  }
  const esDeUnTercero = contexto.cedulasDeTerceros.map(soloDigitos).includes(solicitud.titular);
  return esDeUnTercero ? null : 'Primero crea la declaración de esa persona para poder conectar su cuenta.';
}
