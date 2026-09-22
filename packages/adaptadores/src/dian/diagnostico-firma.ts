/**
 * Por qué no avanzó la firma, en una línea y sin datos personales.
 *
 * Cuando el clic no prospera hay tres causas posibles y se parecen desde fuera:
 * el botón no existe, existe pero está inerte, o está tapado por otra capa del
 * portal. Distinguirlas a ojo cuesta una corrida entera contra la cuenta real,
 * así que el adaptador lo pregunta y lo deja escrito.
 */

import type { Frame, Page } from 'playwright';

const ACCIONES = ['Autorizar', 'Firmar', 'Desautorizar'];

/**
 * Corre dentro del navegador, serializada por Playwright: no puede referenciar
 * NADA de este módulo, ni siquiera una constante. El selector va escrito aquí.
 */
export function estadoDeLosDialogos(etiquetas: string[]): string {
  const DIALOGOS = 'mat-dialog-container, [role="dialog"], .modal';
  const visible = (e: Element) => e.getClientRects().length > 0;
  const texto = (e: Element) => (e.textContent ?? '').replace(/\s+/g, ' ').trim();
  const estadoDe = (dialogo: Element, etiqueta: string): string => {
    const controles = Array.from(dialogo.querySelectorAll('button, [role="button"], a')).filter(visible);
    const control = controles.find((c) => texto(c) === etiqueta);
    if (!control) {
      return `${etiqueta}=ausente`;
    }
    const inerte = (control as HTMLButtonElement).disabled || control.getAttribute('aria-disabled') === 'true';
    const caja = control.getBoundingClientRect();
    const encima = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2);
    const tapado = encima && encima !== control && !control.contains(encima);
    const quien = tapado && encima ? `/tapado:${encima.tagName.toLowerCase()}` : '';
    return `${etiqueta}=${inerte ? 'inerte' : 'activo'}${quien}`;
  };
  const dialogos = Array.from(document.querySelectorAll(DIALOGOS)).filter(visible);
  return dialogos
    .map((d, i) => {
      const clave = d.querySelector('input[type="password"]') ? ',clave' : '';
      return `d${String(i)}:${etiquetas.map((e) => estadoDe(d, e)).join(',')}${clave}`;
    })
    .join(' | ');
}

/** Si el diagnóstico falla, el motivo ES el diagnóstico: callarlo deja a ciegas. */
function enUnMarco(marco: Frame, indice: number): Promise<string> {
  return marco
    .evaluate(estadoDeLosDialogos, ACCIONES)
    .then((estado) => (estado === '' ? '' : `f${String(indice)}[${estado}]`))
    .catch((error: unknown) => `f${String(indice)}[falló: ${error instanceof Error ? error.message : 'motivo desconocido'}]`);
}

/** El portal reparte la firma entre la página y sus iframes: se miran todos. */
export async function diagnosticoDeFirma(pagina: Page): Promise<string> {
  const porMarco = await Promise.all(pagina.frames().map(enUnMarco));
  const conAlgo = porMarco.filter((linea) => linea !== '');
  return conAlgo.length === 0 ? 'ningún diálogo a la vista' : conAlgo.join(' ');
}
