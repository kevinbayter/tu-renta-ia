/**
 * Structural fingerprint of the portal screen when a navigation step fails:
 * how many tabs, which route, whether a dialog is open and which controls are
 * visible. Never field values: digits are masked and name-like labels dropped,
 * because this ends up in the audit trail (PLAN-DIAN §4, no DOM dumps).
 *
 * Split like `anio-de-fila`: `controlesVisibles` runs INSIDE the browser and
 * `formatearHuella` is pure and testable.
 */

import type { Frame, Page } from 'playwright';

export interface ControlesVisibles {
  dialogos: number;
  etiquetas: string[];
}

/** Runs in the browser (serialized by Playwright): cannot reference the module. */
export function controlesVisibles(): ControlesVisibles {
  const visible = (e: Element) => e.getClientRects().length > 0;
  const etiquetas = Array.from(document.querySelectorAll('button, a, [role="tab"], [role="menuitem"]'))
    .filter(visible)
    .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim());
  const dialogos = Array.from(document.querySelectorAll('[role="dialog"], mat-dialog-container, .modal.show')).filter(visible);
  return { dialogos: dialogos.length, etiquetas };
}

const MAXIMO_ETIQUETAS = 10;
const LARGO_ETIQUETA = 24;
/** "JUANA PEREZ" and the like: a person's name, not a control. */
const PARECE_NOMBRE = /^[A-ZÁÉÍÓÚÑ]{2,}(\s+[A-ZÁÉÍÓÚÑ]{2,})+$/;

export function formatearHuella(datos: ControlesVisibles & { paginas: number; url: string }): string {
  const etiquetas = datos.etiquetas
    .filter((t) => t.length > 1 && !PARECE_NOMBRE.test(t))
    .map((t) => t.replace(/\d/g, '#').slice(0, LARGO_ETIQUETA));
  const unicas = [...new Set(etiquetas)].slice(0, MAXIMO_ETIQUETAS);
  return `pestanas=${String(datos.paginas)} ruta=${rutaDe(datos.url)} dialogos=${String(datos.dialogos)} controles=${unicas.join('|')}`;
}

function rutaDe(url: string): string {
  if (!URL.canParse(url)) {
    return '?';
  }
  const { pathname, hash } = new URL(url);
  return `${pathname}${hash.split('?')[0] ?? ''}`.replace(/\d{5,}/g, '#');
}

export async function huellaDePantalla(pagina: Page): Promise<string> {
  const controles = await pagina.evaluate(controlesVisibles).catch(() => ({ dialogos: -1, etiquetas: [] }));
  return formatearHuella({ ...controles, paginas: pagina.context().pages().length, url: pagina.url() });
}

export interface MapaDeControles {
  ruta: string;
  campos: { tipo: string; id: string; nombre: string; etiqueta: string }[];
  botones: string[];
  enlaces: { texto: string; destino: string }[];
  /** Text of open dialogs and headings: what the portal is telling the user. */
  avisos: string[];
}

/**
 * Runs in the browser: the controls of a screen we have not mapped yet (inputs
 * with their labels, buttons, links), never the values typed into them.
 */
export function controlesDeLaPantalla(): Omit<MapaDeControles, 'ruta'> {
  const visible = (e: Element) => e.getClientRects().length > 0;
  const texto = (e: Element | null | undefined) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const etiquetaDe = (campo: HTMLInputElement) =>
    texto(campo.id ? document.querySelector(`label[for="${campo.id}"]`) : null) || texto(campo.closest('label')) || campo.placeholder || campo.getAttribute('aria-label') || '';
  const campos = Array.from(document.querySelectorAll('input, select, textarea'))
    .filter(visible)
    .map((e) => {
      const campo = e as HTMLInputElement;
      return { tipo: campo.type || campo.tagName.toLowerCase(), id: campo.id, nombre: campo.name, etiqueta: etiquetaDe(campo) };
    });
  const botones = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]')).filter(visible).map((b) => texto(b) || (b as HTMLInputElement).value || '');
  const enlaces = Array.from(document.querySelectorAll('a')).filter(visible).map((a) => ({ texto: texto(a), destino: (a.getAttribute('href') ?? '').split('?')[0] ?? '' }));
  const avisos = Array.from(document.querySelectorAll('mat-dialog-container, [role="dialog"], simple-snack-bar, h1, h2, h3, h4'))
    .filter(visible)
    .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 240));
  return { campos, botones: botones.filter(Boolean), enlaces: enlaces.filter((e) => e.texto), avisos: [...new Set(avisos)].filter(Boolean).slice(0, 20) };
}

/**
 * Structural map for the audit/debug trail: digits masked, no values. Acepta un
 * marco además de la página: el portal mete pantallas enteras en iframes y sin
 * mirarlas dentro el diagnóstico solo ve la cáscara.
 */
export async function mapaDeLaPantalla(pagina: Page | Frame): Promise<MapaDeControles> {
  const controles = await pagina.evaluate(controlesDeLaPantalla).catch(() => ({ campos: [], botones: [], enlaces: [], avisos: [] }));
  const enmascarar = (t: string) => t.replace(/\d{3,}/g, '#');
  return {
    ruta: rutaDe(pagina.url()),
    campos: controles.campos.map((c) => ({ ...c, etiqueta: enmascarar(c.etiqueta) })),
    botones: controles.botones.map(enmascarar),
    enlaces: controles.enlaces.map((e) => ({ texto: enmascarar(e.texto), destino: enmascarar(e.destino) })),
    avisos: controles.avisos.map(enmascarar),
  };
}
