import { createTransport } from 'nodemailer';

import type { EmailPort } from '@turenta/core';

import { cuerpoHtmlAviso, cuerpoHtmlCodigo, cuerpoTextoCodigo } from './plantillas';

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
      text: cuerpoTextoCodigo(codigo),
      html: cuerpoHtmlCodigo(codigo),
    });
  }

  async enviarAviso(email: string, asunto: string, mensaje: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email,
      subject: asunto,
      text: mensaje,
      html: cuerpoHtmlAviso(asunto, mensaje),
    });
  }
}


