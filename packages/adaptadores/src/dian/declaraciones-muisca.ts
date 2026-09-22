/**
 * Downloading already filed returns. Unlike the exógena, these live in an
 * Angular SPA (`WebDilIngresoFormRenta210/#/ingreso/presentados`), not in the
 * JSF dashboard. Verified against the live portal on 2026-07-25:
 * research/07-automatizacion-dian-analisis-2026.md §2.1.3
 */

import type { ProgresoConexion, ResultadoDescarga } from '@turenta/core';

import { anioEnTextos, textosDeAncestros } from './anio-de-fila';
import { huellaDePantalla } from './huella-pantalla';
import { fallo } from './motivos-fallo';
import { archivoDe } from './sesion-muisca';

import type { ElementHandle, Locator, Page } from 'playwright';

const DECLARACIONES = {
  barraMenu: '#divMenuTd',
  botonDirecto210: '[id$="btnformulario210"]',
  diligenciar: 'Diligenciar / Presentar',
  formulario210: 'Formulario 210',
  presentadas: /declaraciones\s+(de\s+renta\s+)?presentadas/i,
  /** Read-only route of the history inside the 210 SPA. */
  aplicacion210: 'WebDilIngresoFormRenta210',
  rutaPresentados: '#/ingreso/presentados',
  /** Table header: proof the screen loaded even when there are no rows. */
  encabezadoTabla: 'No. formulario',
  /** Anchored to the icon file, not matTooltip: `ng-reflect-*` only exists in dev mode. */
  iconoDescargar: 'img[src*="descargar"]',
} as const;

/** The 210 may open in a new tab: it opens with the click, so a short grace after entering is enough. */
const GRACIA_PESTANA_MS = 1_500;

function pausa(ms: number): Promise<null> {
  return new Promise((resolver) => setTimeout(() => resolver(null), ms));
}

export interface Presentada {
  numeroFormulario: string;
  /** Tal como la muestra el portal: dd/mm/aaaa. */
  fecha: string;
  /** El PDF de la declaración: es el comprobante que el usuario se lleva. */
  archivo: ResultadoDescarga | null;
}

/**
 * ¿Ya hay una declaración presentada de ese año? Es la pregunta que evita
 * presentar dos veces, que no es un error recuperable: la DIAN recibiría una
 * segunda declaración y habría que corregir.
 */
export async function declaracionPresentadaDelAnio(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
): Promise<Presentada | null> {
  const { spa, pasoFallido } = await irADeclaracionesPresentadas(pagina, esperaMs);
  if (pasoFallido !== null) {
    return null;
  }
  const icono = await iconoDescargaDelAnio(spa, anioGravable);
  if (!icono) {
    return null;
  }
  const datos = datosDeLaFila(await icono.evaluate(textosDeAncestros));
  // En una sola pasada: volver a entrar arrancaría desde dentro de la SPA, que
  // ya no tiene el menú por el que se llega aquí.
  return datos ? { ...datos, archivo: await bajarCon(spa, icono, esperaMs) } : null;
}

/** Una declaración de corrección añade un sufijo al número: "…-3". */
const FORMULARIO = /\b(\d{10,15}(?:-\d+)?)\b/;
const FECHA = /\b(\d{2}\/\d{2}\/\d{4})\b/;

/**
 * De los textos de los ancestros vale el de la FILA, no todos juntos: entre
 * ellos está el de la tabla entera, con las demás declaraciones. Unirlos
 * funciona solo mientras la fila venga antes, que es una casualidad del orden.
 */
function datosDeLaFila(textos: string[]): Omit<Presentada, 'archivo'> | null {
  const fila = textos.find((texto) => FORMULARIO.test(texto) && FECHA.test(texto)) ?? '';
  const numeroFormulario = FORMULARIO.exec(fila)?.[1];
  const fecha = FECHA.exec(fila)?.[1];
  return numeroFormulario && fecha ? { numeroFormulario, fecha } : null;
}

async function bajarCon(
  spa: Page,
  icono: ElementHandle<SVGElement | HTMLElement>,
  esperaMs: number,
): Promise<ResultadoDescarga | null> {
  const descarga = await Promise.all([spa.waitForEvent('download', { timeout: esperaMs }), icono.click()])
    .then(([d]) => d)
    .catch(() => null);
  return descarga ? archivoDe(descarga) : null;
}

/** Downloads the filed return PDF for the given year, named `<formNumber>.pdf`. */
export async function descargarDeclaracionPresentada(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const { spa, pasoFallido } = await irADeclaracionesPresentadas(pagina, esperaMs);
  if (pasoFallido !== null) {
    return fallo('estructura_cambiada', `Falló ${pasoFallido} · ${await huellaDePantalla(spa)}`);
  }
  const icono = await iconoDescargaDelAnio(spa, anioGravable);
  if (!icono) {
    return fallo('sin_declaracion', `No hay una declaración presentada del año ${String(anioGravable)}`);
  }
  alProgresar?.({ etapa: 'descargando', mensaje: `Descargando tu declaración ${String(anioGravable)}` });
  return (await bajarCon(spa, icono, esperaMs)) ?? fallo('estructura_cambiada', 'No se pudo descargar el PDF');
}

/**
 * Returns the step that failed, or null on success: "we could not open it"
 * alone gives operations nothing to work with when a user reports a problem.
 */
async function irADeclaracionesPresentadas(
  pagina: Page,
  esperaMs: number,
): Promise<{ spa: Page; pasoFallido: string | null }> {
  const { spa, entro } = await abrirAplicacion210(pagina, esperaMs);
  if (!entro) {
    return { spa, pasoFallido: 'abrir el formulario 210' };
  }
  // Escape only: an Accept/Continue inside the 210 may create a real draft in the account.
  await spa.keyboard.press('Escape').catch(() => null);
  const abrio =
    (await pulsar(spa.getByText(DECLARACIONES.presentadas), Math.round(esperaMs / 2))) ||
    (await irPorRuta(spa, esperaMs));
  if (!abrio) {
    return { spa, pasoFallido: 'abrir "Declaraciones de renta presentadas"' };
  }
  const pinto = await tablaVisible(spa, esperaMs);
  return { spa, pasoFallido: pinto ? null : 'esperar la tabla de declaraciones' };
}

/** Opens the 210 app from the dashboard; it may land in a new tab, which is then the one returned. */
export async function abrirAplicacion210(pagina: Page, esperaMs: number): Promise<{ spa: Page; entro: boolean }> {
  const pestanaNueva = pagina.context().waitForEvent('page', { timeout: esperaMs }).catch(() => null);
  const entro = await entrarAlFormulario210(pagina, esperaMs);
  const spa = (await Promise.race([pestanaNueva, pausa(GRACIA_PESTANA_MS)])) ?? pagina;
  await spa.waitForLoadState('domcontentloaded', { timeout: esperaMs }).catch(() => null);
  return { spa, entro };
}

function tablaVisible(spa: Page, esperaMs: number): Promise<boolean> {
  return spa
    .getByText(DECLARACIONES.encabezadoTabla)
    .first()
    .waitFor({ timeout: esperaMs })
    .then(() => true)
    .catch(() => false);
}

function irPorRuta(spa: Page, esperaMs: number): Promise<boolean> {
  return irARuta210(spa, DECLARACIONES.rutaPresentados, esperaMs);
}

/**
 * Inside the 210 SPA each screen has its own hash route: ir por la ruta evita
 * depender de tarjetas y de avisos que tapan la pantalla. El `idRequest` que
 * viaja en el hash es estado del portal: sin él, el SPA devuelve a la entrada.
 */
export async function irARuta210(spa: Page, ruta: string, esperaMs: number): Promise<boolean> {
  const url = spa.url();
  if (!url.includes(DECLARACIONES.aplicacion210)) {
    return false;
  }
  const [base = url, hash = ''] = url.split('#');
  const consulta = hash.includes('?') ? `?${hash.split('?')[1] ?? ''}` : '';
  return spa
    .goto(`${base}#${ruta.replace(/^#/, '')}${consulta}`, { timeout: esperaMs })
    .then(() => true)
    .catch(() => false);
}

/** Direct dashboard button first; the JSF side menu is the fallback. */
async function entrarAlFormulario210(pagina: Page, esperaMs: number): Promise<boolean> {
  const espera = Math.round(esperaMs / 3);
  const directo = await pulsar(pagina.locator(DECLARACIONES.botonDirecto210), espera);
  const enSelector =
    directo && (await pulsar(pagina.getByText(DECLARACIONES.formulario210, { exact: true }), espera));
  if (enSelector) {
    return true;
  }
  return porElMenuLateral(pagina, esperaMs);
}

/**
 * The side menu only opens on real pointer hover: a synthetic click on its
 * container does nothing (verified against the portal).
 */
async function porElMenuLateral(pagina: Page, esperaMs: number): Promise<boolean> {
  await pagina.locator(DECLARACIONES.barraMenu).hover({ timeout: esperaMs }).catch(() => null);
  const enMenu = await pulsar(
    pagina.getByRole('link', { name: DECLARACIONES.diligenciar, exact: true }),
    esperaMs,
  );
  if (!enMenu) {
    return false;
  }
  return pulsar(pagina.getByText(DECLARACIONES.formulario210, { exact: true }), esperaMs);
}

/** Clicks if present; never throws, so each step can be reported by name. */
function pulsar(objetivo: Locator, esperaMs: number): Promise<boolean> {
  return objetivo
    .first()
    .click({ timeout: esperaMs })
    .then(() => true)
    .catch(() => false);
}

/** Matches each download icon with its row's year and returns the right one. */
/**
 * Only what is on screen: the SPA keeps other screens (the drafts list, with
 * its own download icons and years) in the DOM, hidden.
 */
async function iconoDescargaDelAnio(
  pagina: Page,
  anioGravable: number,
): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
  const iconos = await visibles(await pagina.$$(DECLARACIONES.iconoDescargar));
  const anios = await Promise.all(
    iconos.map((icono) => icono.evaluate(textosDeAncestros).then(anioEnTextos)),
  );
  const indice = anios.indexOf(String(anioGravable));
  return indice >= 0 ? (iconos[indice] ?? null) : null;
}

async function visibles<T extends ElementHandle<SVGElement | HTMLElement>>(elementos: T[]): Promise<T[]> {
  const estados = await Promise.all(elementos.map((e) => e.isVisible().catch(() => false)));
  return elementos.filter((_, i) => estados[i] === true);
}
