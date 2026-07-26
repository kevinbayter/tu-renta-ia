/**
 * Downloading the third-party report (exógena) from the JSF dashboard.
 * Structure verified against the live portal on 2026-07-25:
 * research/07-automatizacion-dian-analisis-2026.md §2.1.2
 */

import type { ProgresoConexion, ResultadoDescarga } from '@turenta/core';

import { fallo } from './motivos-fallo';
import { archivoDe } from './sesion-muisca';

import type { Page } from 'playwright';

/**
 * Ids anchored by suffix: the JSF prefix varies between portal views.
 *
 * Everything is scoped to the exógena modal. The dashboard holds other panels
 * —electronic invoices among them— whose controls end with the same suffixes,
 * and an unscoped selector matched several at once: Playwright then fails
 * instantly with a strict mode violation instead of clicking anything.
 */
const EXOGENA = {
  enlace: /Consultar informaci[oó]n Ex[oó]gena|Informaci[oó]n Reportada por terceros/i,
  panel: '[id$="aniosPanelContentDiv"]',
  aceptarCondiciones: '[id$="btnBuscar"]',
  anio: '[id$="anioSel"]',
  generar: '[id$="btnExogenaGenerar"]',
  descargar: '[id$="lnkDescargarReporteExogena"]',
} as const;

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
 * Real portal flow: the dashboard link opens a modal with the terms of use;
 * "btnBuscar" accepts them and reveals the year selector, the generate button
 * and the download link. The file arrives as `reporteExogena<year>.xlsx`.
 *
 * Buttons are `input[type=image]`, hence the forced click. Do NOT force the
 * year `selectOption`: requiring visibility is the only net that catches
 * someone removing the accept-terms step.
 */
async function irAConsultaExogena(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alIniciarPaso: (paso: string) => void,
): Promise<void> {
  alIniciarPaso('abrir la consulta de exógena');
  await pagina.getByRole('link', { name: EXOGENA.enlace }).first().click({ timeout: esperaMs });
  const panel = pagina.locator(EXOGENA.panel).first();
  alIniciarPaso('aceptar las condiciones');
  await panel.locator(EXOGENA.aceptarCondiciones).first().click({ timeout: esperaMs, force: true });
  alIniciarPaso(`elegir el año ${String(anioGravable)}`);
  await panel.locator(EXOGENA.anio).first().selectOption(String(anioGravable), { timeout: esperaMs });
  alIniciarPaso('generar el reporte');
  await panel.locator(EXOGENA.generar).first().click({ timeout: esperaMs, force: true });
  await pagina.waitForLoadState('networkidle', { timeout: esperaMs }).catch(() => null);
  alIniciarPaso('descargar el archivo');
  await dispararDescarga(pagina);
}

/** The download link is empty and 0x0 px: no coordinate click, only its onclick. */
function dispararDescarga(pagina: Page): Promise<void> {
  return pagina.evaluate(
    (selector) => document.querySelector<HTMLElement>(selector)?.click(),
    EXOGENA.descargar as string,
  );
}
