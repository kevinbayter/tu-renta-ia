/**
 * Downloading already filed returns. Unlike the exógena, these live in an
 * Angular SPA (`WebDilIngresoFormRenta210/#/ingreso/presentados`), not in the
 * JSF dashboard. Verified against the live portal on 2026-07-25:
 * research/07-automatizacion-dian-analisis-2026.md §2.1.3
 */

import type { ProgresoConexion, ResultadoDescarga } from '@turenta/core';

import { anioEnTextos, textosDeAncestros } from './anio-de-fila';
import { fallo } from './motivos-fallo';
import { archivoDe } from './sesion-muisca';

import type { ElementHandle, Locator, Page } from 'playwright';

const DECLARACIONES = {
  barraMenu: '#divMenuTd',
  botonDirecto210: '[id$="btnformulario210"]',
  diligenciar: 'Diligenciar / Presentar',
  formulario210: 'Formulario 210',
  presentadas: 'Declaraciones de renta presentadas',
  /** Table header: proof the screen loaded even when there are no rows. */
  encabezadoTabla: 'No. formulario',
  /** Anchored to the icon file, not matTooltip: `ng-reflect-*` only exists in dev mode. */
  iconoDescargar: 'img[src*="descargar"]',
} as const;

/** Downloads the filed return PDF for the given year, named `<formNumber>.pdf`. */
export async function descargarDeclaracionPresentada(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const pasoFallido = await irADeclaracionesPresentadas(pagina, esperaMs);
  if (pasoFallido !== null) {
    return fallo('estructura_cambiada', `El portal cambió al ${pasoFallido}`);
  }
  const icono = await iconoDescargaDelAnio(pagina, anioGravable);
  if (!icono) {
    return fallo('sin_declaracion', `No hay una declaración presentada del año ${String(anioGravable)}`);
  }
  alProgresar?.({ etapa: 'descargando', mensaje: `Descargando tu declaración ${String(anioGravable)}` });
  const descarga = await Promise.all([
    pagina.waitForEvent('download', { timeout: esperaMs }),
    icono.click(),
  ])
    .then(([d]) => d)
    .catch(() => null);
  return descarga ? archivoDe(descarga) : fallo('estructura_cambiada', 'No se pudo descargar el PDF');
}

/**
 * Returns the step that failed, or null on success: "we could not open it"
 * alone gives operations nothing to work with when a user reports a problem.
 */
async function irADeclaracionesPresentadas(pagina: Page, esperaMs: number): Promise<string | null> {
  const entro = await entrarAlFormulario210(pagina, esperaMs);
  if (!entro) {
    return 'abrir el formulario 210';
  }
  const abrio = await pulsar(pagina.getByText(DECLARACIONES.presentadas, { exact: true }), esperaMs);
  if (!abrio) {
    return 'abrir "Declaraciones de renta presentadas"';
  }
  const pinto = await pagina
    .getByText(DECLARACIONES.encabezadoTabla)
    .first()
    .waitFor({ timeout: esperaMs })
    .then(() => true)
    .catch(() => false);
  return pinto ? null : 'esperar la tabla de declaraciones';
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
async function iconoDescargaDelAnio(
  pagina: Page,
  anioGravable: number,
): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
  const iconos = await pagina.$$(DECLARACIONES.iconoDescargar);
  const anios = await Promise.all(
    iconos.map((icono) => icono.evaluate(textosDeAncestros).then(anioEnTextos)),
  );
  const indice = anios.indexOf(String(anioGravable));
  return indice >= 0 ? (iconos[indice] ?? null) : null;
}
