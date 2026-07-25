import type { EmailPort } from '@turenta/core';

import { cuerpoHtmlAviso, cuerpoHtmlCodigo, cuerpoTextoCodigo } from './plantillas';

export interface BrevoConfig {
  apiKey: string;
  /** Correo remitente verificado en Brevo. */
  fromEmail: string;
  fromNombre: string;
}

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Adaptador de correo vía API transaccional HTTP de Brevo (Sendinblue).
 * Usa la API key `xkeysib-...`. El remitente debe estar verificado en Brevo.
 */
export class EmailBrevoAdapter implements EmailPort {
  constructor(private readonly config: BrevoConfig) {}

  async enviarCodigo(email: string, codigo: string): Promise<void> {
    await this.enviar(email, `${codigo} es tu código de ingreso a TuRenta AI`, cuerpoTextoCodigo(codigo), cuerpoHtmlCodigo(codigo));
  }

  async enviarAviso(email: string, asunto: string, mensaje: string): Promise<void> {
    await this.enviar(email, asunto, mensaje, cuerpoHtmlAviso(asunto, mensaje));
  }

  private async enviar(email: string, asunto: string, texto: string, html: string): Promise<void> {
    const respuesta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.config.fromNombre, email: this.config.fromEmail },
        to: [{ email }],
        subject: asunto,
        textContent: texto,
        htmlContent: html,
      }),
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      throw new Error(`Brevo error ${String(respuesta.status)}: ${detalle}`);
    }
  }
}



