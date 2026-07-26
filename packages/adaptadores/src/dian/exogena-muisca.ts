/**
 * Downloading the third-party report (exógena) from the JSF dashboard.
 * Flow verified against the live portal on 2026-07-26:
 * research/07-automatizacion-dian-analisis-2026.md §2.1.2
 */

import type { ProgresoConexion, ResultadoDescarga } from '@turenta/core';

import { fallo } from './motivos-fallo';
import { archivoDe } from './sesion-muisca';

import type { Locator, Page, Response } from 'playwright';

/**
 * Ids anchored by suffix: the JSF prefix varies between portal views. Each one
 * matches a single control —the electronic invoices panel next to it uses
 * `btnBuscarFE` and `anioSelFE`— so there is no `.first()` here: a future
 * collision must fail loudly instead of driving the wrong panel.
 */
const EXOGENA = {
  enlace: /Consultar informaci[oó]n Ex[oó]gena|Informaci[oó]n Reportada por terceros/i,
  aceptarCondiciones: '[id$="btnBuscar"]',
  anio: '[id$="anioSel"]',
  generar: '[id$="btnExogenaGenerar"]',
} as const;

/** Where RichFaces (A4J) posts back; the chosen year is registered there. */
const POSTBACK = /DefDashboard\.faces/i;

/** Own budget: a portal that stops posting back must not eat the whole wait. */
const ESPERA_POSTBACK_MS = 15_000;

/**
 * MUISCA's internals change without notice, so any failure here reports
 * 'estructura_cambiada' and the UI offers the manual path.
 */
export async function descargarReporteExogena(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  alProgresar?.({ etapa: 'descargando', mensaje: 'Descargando el reporte' });
  let pasoFallido = 'iniciar la consulta';
  const descarga = await Promise.all([
    pagina.waitForEvent('download', { timeout: esperaMs }),
    irAConsultaExogena(pagina, anioGravable, esperaMs, (paso) => (pasoFallido = paso)),
  ])
    .then(([d]) => d)
    .catch(() => null);
  if (!descarga) {
    return fallo('estructura_cambiada', `El portal cambió al ${pasoFallido}`);
  }
  return archivoDe(descarga);
}

/**
 * Real portal flow: the dashboard link opens a modal with the terms of use,
 * "btnBuscar" reveals the year selector and the generate button, and generating
 * downloads `reporteExogena<year>.xlsx` on its own. The panel's download link
 * only repeats the same request, so it is deliberately left alone.
 */
async function irAConsultaExogena(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alIniciarPaso: (paso: string) => void,
): Promise<void> {
  alIniciarPaso('abrir la consulta de exógena');
  await pagina.getByRole('link', { name: EXOGENA.enlace }).first().click({ timeout: esperaMs });
  alIniciarPaso('aceptar las condiciones');
  await pulsar(pagina, EXOGENA.aceptarCondiciones, esperaMs);
  alIniciarPaso(`elegir el año ${String(anioGravable)}`);
  await elegirAnio(pagina, anioGravable, esperaMs);
  alIniciarPaso('generar el reporte');
  await pulsar(pagina, EXOGENA.generar, esperaMs);
}

/**
 * The modal opens asynchronously and its controls sit in the DOM, sized 0x0,
 * before it lands. Clicking then fails with "Element is not visible", and
 * `force` does not save it: Playwright still has to scroll the element into
 * view. Waiting for each control is what makes every step reliable.
 */
async function enPantalla(pagina: Page, selector: string, esperaMs: number): Promise<Locator> {
  const control = pagina.locator(selector);
  await control.waitFor({ state: 'visible', timeout: esperaMs });
  return control;
}

async function pulsar(pagina: Page, selector: string, esperaMs: number): Promise<void> {
  const control = await enPantalla(pagina, selector, esperaMs);
  await control.click({ timeout: esperaMs });
}

/**
 * Picking the year fires an A4J postback that registers it server-side.
 * Generating before that round trip lands produces no file at all: no error
 * message, just an empty wait. That is how this failed in production.
 */
async function elegirAnio(pagina: Page, anioGravable: number, esperaMs: number): Promise<void> {
  const control = await enPantalla(pagina, EXOGENA.anio, esperaMs);
  await Promise.all([
    esperarPostback(pagina, esperaMs),
    control.selectOption(String(anioGravable), { timeout: esperaMs }),
  ]);
}

function esperarPostback(pagina: Page, esperaMs: number): Promise<Response | null> {
  const esPostback = (r: Response) => r.request().method() === 'POST' && POSTBACK.test(r.url());
  const espera = Math.min(esperaMs, ESPERA_POSTBACK_MS);
  return pagina.waitForResponse(esPostback, { timeout: espera }).catch(() => null);
}
