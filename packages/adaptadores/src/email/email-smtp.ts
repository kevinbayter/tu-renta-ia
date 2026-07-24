import { createTransport } from 'nodemailer';

import type { EmailPort } from '@turenta/core';

import type { Transporter } from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** Remitente visible, p. ej. "TuRenta AI <no-responder@turenta.co>". */
  from: string;
}

/**
 * Adaptador de correo real vía SMTP (nodemailer). Compatible con Gmail,
 * Resend SMTP, SendGrid, Mailtrap, etc. — solo cambian las credenciales.
 */
export class EmailSmtpAdapter implements EmailPort {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }

  async enviarCodigo(email: string, codigo: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email,
      subject: `${codigo} es tu código de ingreso a TuRenta AI`,
      text: cuerpoTexto(codigo),
      html: cuerpoHtml(codigo),
    });
  }
}

function cuerpoTexto(codigo: string): string {
  return `Tu código de ingreso a TuRenta AI es: ${codigo}\n\nVence en 10 minutos. Si no lo solicitaste, ignora este correo.`;
}

function cuerpoHtml(codigo: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
  <p style="color:#4f46e5;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase">TuRenta AI</p>
  <h1 style="font-size:20px;margin:8px 0 16px">Tu código de ingreso</h1>
  <p style="font-size:14px;color:#57534e">Úsalo para entrar a tu cuenta. Vence en 10 minutos.</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;font-family:monospace;background:#eef2ff;color:#4338ca;text-align:center;padding:16px;border-radius:12px;margin:16px 0">${codigo}</p>
  <p style="font-size:12px;color:#a8a29e">Si no solicitaste este código, ignora este correo.</p>
</div>`;
}
