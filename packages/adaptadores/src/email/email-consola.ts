import type { EmailPort } from '@turenta/core';

/**
 * Adaptador de correo para DESARROLLO: imprime el código en el log del servidor.
 * En producción se reemplaza por un proveedor real (Resend/SES) implementando EmailPort.
 */
export class EmailConsolaAdapter implements EmailPort {
  enviarCodigo(email: string, codigo: string): Promise<void> {
    // eslint-disable-next-line no-console -- adaptador de desarrollo: el código DEBE verse en el log
    console.error(`[TuRenta DEV] Código de ingreso para ${email}: ${codigo}`);
    return Promise.resolve();
  }
}
