/**
 * Between opening the editor and its first section (research/09 §2): the
 * permanence question and the modals after it. Only buttons that move forward
 * through notices are pressed here.
 */

import type { Frame, Locator, Page } from 'playwright';

/**
 * El portal mete parte de la firma en un iframe: lo que se busca "en pantalla"
 * puede estar en la página o en cualquiera de sus marcos, y la API es la misma.
 */
export type Contexto = Page | Frame;

export const PAUSA_MS = 1_500;

const RESIDENTE = {
  /** "Más de 183 días en Colombia": residente, formulario 210. */
  radio: '#rbSi',
  etiqueta: 'label[for="rbSi"]',
} as const;

const CAMPOS = '[id^="cs_id_"]';

/**
 * El portal arma sus avisos de varias formas; lo que importa es que tapan la
 * pantalla, así que lo que se pulse "en un aviso" se busca dentro de ellos.
 */
const AVISOS = 'mat-dialog-container, [role="dialog"], .modal.show, .modal';

/**
 * Modal buttons between "Sí, editar" and the form. Modal-specific ones first:
 * behind the last modal the form's own "Siguiente" is already visible.
 */
const BOTONES_MODALES = ['Entendido', 'Si', 'Sí, consultar', 'Siguiente'] as const;
const MAXIMO_MODALES = 8;

/** The permanence question: more than 183 days makes the filer a resident (form 210). */
export async function marcarResidente(editor: Page, esperaMs: number): Promise<void> {
  await editor.locator(RESIDENTE.radio).waitFor({ state: 'visible', timeout: esperaMs }).catch(() => null);
  await editor.waitForLoadState('networkidle', { timeout: PAUSA_MS * 4 }).catch(() => null);
  await pulsarResidente(editor);
}

/**
 * A lost click leaves the radio checked natively, and clicking a checked radio
 * fires no `change`: it is unchecked first so the retry reaches Angular.
 */
async function pulsarResidente(editor: Page): Promise<void> {
  await editor
    .locator(RESIDENTE.radio)
    .evaluate((e) => {
      const radio = e as HTMLInputElement;
      radio.checked = radio.checked && !radio.classList.contains('ng-pristine');
    })
    .catch(() => null);
  const porEtiqueta = await editor.locator(RESIDENTE.etiqueta).click({ timeout: PAUSA_MS * 2 }).then(() => true, () => false);
  if (!porEtiqueta) {
    await editor.locator(RESIDENTE.radio).check({ force: true, timeout: PAUSA_MS * 2 }).catch(() => null);
  }
}

/**
 * A click that lands before Angular binds its handlers is lost: the input stays
 * unchecked or `ng-pristine` and no modal opens, so it has to be pressed again.
 */
function residentePendiente(editor: Page): Promise<boolean> {
  return editor
    .locator(RESIDENTE.radio)
    .filter({ visible: true })
    .evaluate((e) => !(e as HTMLInputElement).checked || e.classList.contains('ng-pristine'), null, { timeout: PAUSA_MS / 3 })
    .catch(() => false);
}

async function reintentarResidente(editor: Page): Promise<void> {
  if (await residentePendiente(editor)) {
    await pulsarResidente(editor);
  }
}

/** Presses the known modal buttons until the form fields show up. */
export async function atravesarModales(editor: Page, restantes: number = MAXIMO_MODALES): Promise<boolean> {
  if (await hayFormulario(editor)) {
    return true;
  }
  if (restantes === 0) {
    return false;
  }
  await pulsarPrimerModal(editor);
  return atravesarModales(editor, restantes - 1);
}

/**
 * Solo se pulsa DENTRO del aviso abierto. Buscar esos textos en toda la página
 * es peligroso: "Siguiente" también existe en la pantalla de firma, y pulsarlo
 * ahí abre el diálogo de firma en vez de avanzar el formulario.
 */
async function pulsarPrimerModal(editor: Page): Promise<void> {
  const aviso = avisoAbierto(editor);
  const visibles = await Promise.all(BOTONES_MODALES.map((texto) => enAviso(aviso, texto).isVisible().catch(() => false)));
  const texto = BOTONES_MODALES[visibles.indexOf(true)];
  await (texto ? enAviso(aviso, texto).click({ timeout: PAUSA_MS * 4 }).catch(() => null) : reintentarResidente(editor));
  await editor.waitForTimeout(PAUSA_MS);
}

function avisoAbierto(editor: Page): Locator {
  return editor.locator(AVISOS).filter({ visible: true }).first();
}

function enAviso(aviso: Locator, texto: string): Locator {
  return aviso.getByText(texto, { exact: true }).filter({ visible: true }).first();
}

/** Formulario listo: casillas a la vista y ningún aviso pidiendo una respuesta. */
async function hayFormulario(editor: Page): Promise<boolean> {
  const campos = await editor.locator(CAMPOS).filter({ visible: true }).count();
  if (campos === 0) {
    return false;
  }
  const aviso = avisoAbierto(editor);
  const pendientes = BOTONES_MODALES.filter((texto) => texto !== 'Siguiente');
  const bloqueando = await Promise.all(pendientes.map((texto) => enAviso(aviso, texto).isVisible().catch(() => false)));
  return !bloqueando.includes(true);
}

/** Closed modals stay in the DOM with the same texts: only what is on screen counts. */
export function enPantalla(pagina: Page, texto: string) {
  return pagina.getByText(texto, { exact: true }).filter({ visible: true }).first();
}

export function visible(pagina: Page, texto: string): Promise<boolean> {
  return enPantalla(pagina, texto).isVisible().catch(() => false);
}

export function pulsarTexto(pagina: Page, texto: string, esperaMs: number): Promise<boolean> {
  return enPantalla(pagina, texto)
    .click({ timeout: esperaMs })
    .then(() => true, () => false);
}

/**
 * Notices cover the screen and swallow the next click. The portal builds them
 * in several flavours (mat-dialog, role=dialog, .modal) and its close control
 * is not always a <button>: what is constant is the `close` icon ligature.
 */
export async function cerrarAvisos(pagina: Page, restantes = 3): Promise<void> {
  const cerrado = await pagina
    .getByText(/^\s*close\s*$/)
    .filter({ visible: true })
    .first()
    .click({ timeout: PAUSA_MS * 2 })
    .then(() => true, () => false);
  if (!cerrado) {
    await pagina.keyboard.press('Escape').catch(() => null);
    return;
  }
  await pagina.waitForTimeout(PAUSA_MS);
  return restantes === 0 ? undefined : cerrarAvisos(pagina, restantes - 1);
}

/**
 * El portal mezcla <button>, <a> y <div role="button"> para la misma acción:
 * buscar por texto visible, sin atarse a la etiqueta, es lo único que aguanta.
 */
export function controlPorTexto(pagina: Contexto, texto: RegExp) {
  return pagina.getByText(texto).filter({ visible: true }).first();
}

/**
 * Pulsa una acción del portal sin atarse a su etiqueta: MUISCA usa <button>,
 * <a>, <span> y <div role="button"> para lo mismo, y cambia de una pantalla a
 * otra. Se intenta el botón y, si no está, el texto visible.
 */
export async function pulsarAccion(pagina: Contexto, texto: RegExp, esperaMs: number): Promise<boolean> {
  const boton = pagina.locator('button', { hasText: texto }).filter({ visible: true }).first();
  const porBoton = await boton.click({ timeout: esperaMs }).then(() => true, () => false);
  return porBoton || controlPorTexto(pagina, texto).click({ timeout: esperaMs }).then(() => true, () => false);
}

/** ¿Está esa acción a la vista, sea cual sea su etiqueta? */
export async function hayAccion(pagina: Contexto, texto: RegExp): Promise<boolean> {
  const boton = await pagina.locator('button', { hasText: texto }).filter({ visible: true }).first().isVisible().catch(() => false);
  return boton || controlPorTexto(pagina, texto).isVisible().catch(() => false);
}

/**
 * Para DECIDIR qué pantalla es, solo valen controles de verdad: el stepper del
 * portal trae `<span>Presentar</span>` siempre, y confundirlo con el botón
 * llevaría a creer firmada una declaración que aún es borrador.
 */
export function hayBoton(pagina: Contexto, texto: RegExp): Promise<boolean> {
  return pagina
    .locator('button, [role="button"]', { hasText: texto })
    .filter({ visible: true })
    .first()
    .isVisible()
    .catch(() => false);
}
