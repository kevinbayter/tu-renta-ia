import type { EmailPort } from '@turenta/core';

import { EmailBrevoAdapter } from './email-brevo';
import { EmailConsolaAdapter } from './email-consola';
import { EmailSmtpAdapter } from './email-smtp';


/**
 * Factory de correo desde variables de entorno. Prioridad:
 *   1) Brevo (BREVO_API_KEY) — API HTTP transaccional
 *   2) SMTP genérico (EMAIL_SMTP_HOST) — Gmail/Resend/SendGrid/Mailtrap
 *   3) Consola (dev) — imprime el código en el log
 * Cambiar de proveedor = cambiar env vars, cero cambios de código.
 */
export function crearEmailDesdeEnv(env: Record<string, string | undefined>): EmailPort {
  const brevo = crearBrevo(env);
  if (brevo) {
    return brevo;
  }
  const smtp = crearSmtp(env);
  return smtp ?? new EmailConsolaAdapter();
}

function crearBrevo(env: Record<string, string | undefined>): EmailPort | null {
  const apiKey = env['BREVO_API_KEY'];
  const fromEmail = env['EMAIL_FROM_ADDRESS'];
  if (!apiKey || !fromEmail) {
    return null;
  }
  return new EmailBrevoAdapter({
    apiKey,
    fromEmail,
    fromNombre: env['EMAIL_FROM_NOMBRE'] ?? 'TuRenta AI',
  });
}

function crearSmtp(env: Record<string, string | undefined>): EmailPort | null {
  const host = env['EMAIL_SMTP_HOST'];
  const user = env['EMAIL_SMTP_USER'];
  const pass = env['EMAIL_SMTP_PASS'];
  if (!host || !user || !pass) {
    return null;
  }
  return new EmailSmtpAdapter({
    host,
    port: Number(env['EMAIL_SMTP_PORT'] ?? '587'),
    user,
    pass,
    from: env['EMAIL_FROM'] ?? `TuRenta AI <${user}>`,
  });
}
