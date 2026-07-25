/**
 * Plantillas HTML de los correos. Escritas con tablas y estilos en línea porque
 * es lo único que renderizan bien Gmail, Outlook y Apple Mail (nada de flexbox,
 * grid ni SVG). Colores de la marca: verde primario y navy profundo.
 */

const VERDE = '#16a34a';
const VERDE_SUAVE = '#ecfdf3';
const NAVY = '#0b1a2e';
const TEXTO = '#0f172a';
const TEXTO_SUAVE = '#64748b';
const BORDE = '#e5eaf0';

const CABECERA = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
        <tr><td style="background:${NAVY};border-radius:18px 18px 0 0;padding:22px 40px">
          <span style="font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">TuRenta<span style="color:${VERDE}"> AI</span></span>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid ${BORDE};border-top:0;border-radius:0 0 18px 18px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">`;

const PIE = `</table>
        </td></tr>
        <tr><td style="padding:20px 40px" align="center">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${TEXTO_SUAVE}">
            Tu declaración de renta, sin enredos · <a href="https://turenta.tax" style="color:${VERDE};text-decoration:none">turenta.tax</a>
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#94a3b8">
            Tus datos viajan cifrados y puedes eliminarlos cuando quieras (Ley 1581 de 2012).
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const BLOQUE_CODIGO = (codigo: string): string => `
<tr><td style="padding:36px 40px 8px">
  <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:${TEXTO}">Tu código de ingreso</h1>
  <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:${TEXTO_SUAVE}">
    Úsalo para entrar a tu cuenta. Vence en <strong style="color:${TEXTO}">10 minutos</strong> y solo funciona una vez.
  </p>
</td></tr>
<tr><td style="padding:24px 40px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center" style="background:${VERDE_SUAVE};border:1px solid ${VERDE}33;border-radius:14px;padding:22px 16px">
      <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:38px;font-weight:700;letter-spacing:10px;color:${VERDE};line-height:1">${codigo}</div>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:16px 40px 32px">
  <p style="margin:0;font-size:13px;line-height:1.6;color:${TEXTO_SUAVE}">
    ¿No solicitaste este código? Ignora este correo — nadie puede entrar a tu cuenta sin él.
  </p>
</td></tr>`;

const BLOQUE_AVISO = (asunto: string, mensaje: string): string => `
<tr><td style="padding:36px 40px 32px">
  <h1 style="margin:0;font-size:21px;line-height:1.35;font-weight:700;color:${TEXTO}">${asunto}</h1>
  <p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:${TEXTO_SUAVE}">${mensaje}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px">
    <tr><td style="background:${VERDE};border-radius:12px">
      <a href="https://turenta.tax/panel" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">Ver mi declaración</a>
    </td></tr>
  </table>
</td></tr>`;

export function cuerpoTextoCodigo(codigo: string): string {
  return `Tu código de ingreso a TuRenta AI es: ${codigo}

Vence en 10 minutos y solo puede usarse una vez.

Si no solicitaste este código, ignora este correo: nadie puede entrar a tu cuenta sin él.`;
}

export function cuerpoHtmlCodigo(codigo: string): string {
  return `${CABECERA}${BLOQUE_CODIGO(codigo)}${PIE}`;
}

export function cuerpoHtmlAviso(asunto: string, mensaje: string): string {
  return `${CABECERA}${BLOQUE_AVISO(escapar(asunto), escapar(mensaje))}${PIE}`;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
