/**
 * Cómo llegar al editor del 210 (research/09 §1-2). El SPA recibe de tres
 * formas distintas —sugerida, lista de borradores o pantalla de entrada— y
 * suele tapar todo con un aviso, así que con el número del borrador se entra
 * derecho por la URL del editor, que es lo único estable.
 */

import type { ProgresoConexion } from '@turenta/core';

import { abrirAplicacion210, irARuta210 } from './declaraciones-muisca';
import { PAUSA_MS, atravesarModales, cerrarAvisos, enPantalla, hayBoton, marcarResidente, pulsarAccion, pulsarTexto } from './entrada-editor-210';

import type { Locator, Page } from 'playwright';

const EDITOR = {
  editarSugerida: 'Sí, editar',
  /** With a draft already saved, the SPA lists drafts instead of the suggestion. */
  filaBorrador: 'mat-row',
  editarBorrador: 'img[mattooltip="Editar"]',
  /** Entry screen: sometimes the portal lands here instead of on the drafts list. */
  editeSuDeclaracion: 'Edite su declaración de renta',
  rutaBorradores: '#/ingreso/borradores',
  /** Ya firmada: el portal ofrece presentarla o ver la declaración firmada. */
  presentar: /^\s*Presentar\s*$/,
  verFirmada: /declaraci[oó]n firmada/i,
  /** Paso de firma con la declaración aún en borrador. */
  firmar: /^\s*Firmar\s*$/,
  /** Desde el paso de firma, vuelve al formulario para poder verificarlo. */
  editarFormulario: /^\s*Editar formulario\s*$/,
  aplicacion: 'WebFormRenta210v18',
  residente: '#rbSi',
  campos: '[id^="cs_id_"]',
} as const;

type Avisar = (progreso: ProgresoConexion) => void;

export interface OpcionesDiligenciamiento {
  esperaMs: number;
  anioGravable: number;
  avisar?: Avisar;
  /** Borrador conocido: se abre su editor por URL, sin navegar el SPA. */
  numeroFormulario?: string;
}


/** Para el diagnóstico: ¿el portal ofrece presentar aunque no lo hayamos reconocido? */
export function ofrecePresentar(pagina: Page): Promise<boolean> {
  return hayBoton(pagina, EDITOR.presentar);
}

export interface Editor {
  pagina: Page;
  /**
   * 'firmada': ya fue firmada y solo falta presentarla.
   * 'paraFirmar': el borrador está completo y el portal abrió en el paso de firma.
   */
  estado: 'formulario' | 'firmada' | 'paraFirmar';
}

/** Rastro de decisiones: sin él, un fallo aquí obliga a adivinar qué vio el robot. */
export const traza: string[] = [];

export async function abrirEditor(pagina: Page, opciones: OpcionesDiligenciamiento): Promise<Editor | null> {
  traza.length = 0;
  const { esperaMs, anioGravable, avisar } = opciones;
  avisar?.({ etapa: 'navegando', mensaje: 'Entrando al formulario 210 del portal' });
  const { spa, entro } = await abrirAplicacion210(pagina, esperaMs);
  if (!entro) {
    return null;
  }
  avisar?.({ etapa: 'navegando', mensaje: 'Buscando tu declaración en el portal' });
  const directo = await abrirPorUrl(spa, opciones);
  traza.push(`porUrl=${String(directo)}`);
  const edito = directo || (await editarSugeridaOBorrador(spa, anioGravable, esperaMs));
  const listo = edito && (await spa.waitForURL(`**/${EDITOR.aplicacion}/**`, { timeout: esperaMs }).then(() => true, () => false));
  if (!listo) {
    return null;
  }
  avisar?.({ etapa: 'navegando', mensaje: 'Abriendo tu borrador' });
  await spa.waitForLoadState('networkidle', { timeout: PAUSA_MS * 6 }).catch(() => null);
  const pantalla = await esperarPantalla(spa);
  traza.push(`pantalla=${pantalla ?? 'sin reconocer'}`);
  return segunPantalla(spa, pantalla, esperaMs);
}

async function segunPantalla(spa: Page, pantalla: Pantalla, esperaMs: number): Promise<Editor | null> {
  if (pantalla === 'firmada') {
    return { pagina: spa, estado: 'firmada' };
  }
  if (pantalla === 'paraFirmar') {
    return { pagina: spa, estado: 'paraFirmar' };
  }
  await marcarResidente(spa, esperaMs);
  const listo = await atravesarModales(spa);
  traza.push(`modales=${String(listo)}`);
  return listo ? { pagina: spa, estado: 'formulario' } : null;
}

/**
 * El portal abre en el paso de firma cuando el borrador ya está completo. Se
 * vuelve al formulario a propósito: no se firma nada que no se haya verificado
 * en esta misma corrida.
 */
export async function volverAlFormulario(spa: Page): Promise<boolean> {
  const pulso = await pulsarAccion(spa, EDITOR.editarFormulario, PAUSA_MS * 4);
  traza.push(`editarFormulario=${String(pulso)}`);
  return spa
    .locator(EDITOR.residente)
    .or(spa.locator(EDITOR.campos).first())
    .first()
    .waitFor({ state: 'visible', timeout: PAUSA_MS * 10 })
    .then(() => true, () => false);
}

/**
 * Angular pinta el editor después de cargar la URL, así que hay que mirar
 * varias veces. Firmada = sin casillas que llenar y con "Presentar" a la vista;
 * no se busca un rótulo exacto porque el portal los cambia y los adorna.
 */
type Pantalla = 'formulario' | 'firmada' | 'paraFirmar' | null;

async function esperarPantalla(spa: Page, intentos = 20): Promise<Pantalla> {
  const casillas = await spa.locator(EDITOR.campos).filter({ visible: true }).count();
  if (casillas > 0 || (await spa.locator(EDITOR.residente).isVisible().catch(() => false))) {
    return 'formulario';
  }
  if (await estaFirmada(spa)) {
    return 'firmada';
  }
  if (await hayBoton(spa, EDITOR.firmar)) {
    return 'paraFirmar';
  }
  if (intentos === 0) {
    return null;
  }
  await spa.waitForTimeout(PAUSA_MS);
  return esperarPantalla(spa, intentos - 1);
}

/**
 * El editor tiene URL propia y estable (research/09 §2). Con el número del
 * borrador se entra directo, sin depender del menú ni de los avisos del SPA.
 */
async function abrirPorUrl(spa: Page, { esperaMs, anioGravable, numeroFormulario }: OpcionesDiligenciamiento): Promise<boolean> {
  if (!numeroFormulario) {
    return false;
  }
  const { origin } = new URL(spa.url());
  const consulta = `concepto=inicial&anio=${String(anioGravable)}&periodicidad=anual&periodo=1&idedocumento=${numeroFormulario}&modo=experto`;
  return spa
    .goto(`${origin}/${EDITOR.aplicacion}/?${consulta}`, { timeout: esperaMs })
    .then(() => true)
    .catch(() => false);
}

/** Firmada: ya no hay casillas y el portal ofrece presentarla o verla firmada. */
async function estaFirmada(spa: Page): Promise<boolean> {
  return (await hayBoton(spa, EDITOR.presentar)) || hayBoton(spa, EDITOR.verFirmada);
}

/**
 * First time the SPA offers the DIAN's suggestion ("Sí, editar"); once a draft
 * exists it lists drafts instead. Both lead to the same editor.
 */
async function editarSugeridaOBorrador(spa: Page, anioGravable: number, esperaMs: number): Promise<boolean> {
  await cerrarAvisos(spa);
  const sugerida = enPantalla(spa, EDITOR.editarSugerida);
  const borrador = filaDelAnio(spa, anioGravable);
  await sugerida.or(borrador).first().waitFor({ timeout: Math.round(esperaMs / 2) }).catch(() => null);
  if (await sugerida.isVisible().catch(() => false)) {
    return pulsarTexto(spa, EDITOR.editarSugerida, esperaMs);
  }
  await entrarALaLista(spa, borrador, esperaMs);
  return borrador.locator(EDITOR.editarBorrador).first().click({ timeout: esperaMs }).then(() => true, () => false);
}

function filaDelAnio(spa: Page, anioGravable: number): Locator {
  return spa.locator(EDITOR.filaBorrador, { hasText: `${String(anioGravable)} / anual` }).filter({ visible: true }).first();
}

/**
 * Landing on the entry screen. La ruta del SPA es directa y no la tapan los
 * avisos; la tarjeta "Edite su declaración de renta" queda como respaldo.
 */
async function entrarALaLista(spa: Page, borrador: Locator, esperaMs: number): Promise<void> {
  if (await borrador.isVisible().catch(() => false)) {
    return;
  }
  await irARuta210(spa, EDITOR.rutaBorradores, esperaMs);
  await borrador.waitFor({ timeout: PAUSA_MS * 4 }).catch(() => null);
  if (await borrador.isVisible().catch(() => false)) {
    return;
  }
  await cerrarAvisos(spa);
  await pulsarTexto(spa, EDITOR.editeSuDeclaracion, PAUSA_MS * 4);
  await borrador.waitFor({ timeout: PAUSA_MS * 4 }).catch(() => null);
}
