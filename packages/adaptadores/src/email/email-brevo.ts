import type { EmailPort } from '@turenta/core';

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
    await this.enviar(email, `${codigo} es tu código de ingreso a TuRenta AI`, cuerpoTexto(codigo), cuerpoHtml(codigo));
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

function cuerpoHtmlAviso(asunto: string, mensaje: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:460px;margin:0 auto;padding:24px">
  <p style="color:#16a34a;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase">TuRenta AI</p>
  <h1 style="font-size:19px;margin:8px 0 12px">${asunto}</h1>
  <p style="font-size:14px;color:#57534e;line-height:1.6">${mensaje}</p>
  <p style="font-size:12px;color:#a8a29e;margin-top:20px">Recibes este aviso porque tienes una declaración en TuRenta AI.</p>
</div>`;
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
