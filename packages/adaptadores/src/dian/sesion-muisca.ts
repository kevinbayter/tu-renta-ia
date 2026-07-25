/**
 * Signing in to the MUISCA portal. This is the only file that handles the
 * user's password, and it never returns, stores or logs it (PLAN-DIAN §1).
 *
 * FORBIDDEN here: Playwright tracing, video or HAR. They record the DOM and the
 * network — taxpayer data — and with `DEBUG=pw:api`, the password itself.
 */

import type { CredencialesDian, ResultadoDescarga } from '@turenta/core';

import { fallo } from './motivos-fallo';

import type { Download, Page } from 'playwright';

const CASILLA_DATOS = 'input[name="aceptaTratamientoDatos"]';
const ESPERA_CASILLA_MS = 5_000;

/** Screens meaning "still not signed in", whatever the portal renamed. */
const URL_IDENTIDAD = /WebIdentidadLogin|DefLogin/i;

const ETIQUETA_POR_DEFECTO = 'Cédula de ciudadanía';

const ETIQUETAS_DOCUMENTO: Record<string, string> = {
  CC: ETIQUETA_POR_DEFECTO,
  CE: 'Cédula de extranjería',
  NIT: 'NIT',
  PA: 'Pasaporte',
  TI: 'Tarjeta de identidad',
};

export async function autenticar(
  pagina: Page,
  credenciales: CredencialesDian,
  urlBase: string,
  esperaMs: number,
): Promise<ResultadoDescarga> {
  await pagina.goto(`${urlBase}/WebArquitectura/DefLogin.faces`, {
    waitUntil: 'domcontentloaded',
    timeout: esperaMs,
  });
  await pagina.getByRole('button', { name: 'A nombre propio' }).click({ timeout: esperaMs });
  await seleccionarTipoDocumento(pagina, credenciales.tipoDocumento, esperaMs);
  await pagina.fill('input[name="numDocumento"]', credenciales.numeroDocumento);
  // Only authorized reveal(): the password enters the portal here.
  await pagina.fill('input[name="password"]', credenciales.contrasena.revelar());
  await aceptarTratamientoDatos(pagina, esperaMs);
  await pagina.getByRole('button', { name: 'Ingresar' }).click();
  return verificarIngreso(pagina, esperaMs);
}

/** Document type is an Angular Material mat-select, not a native <select>. */
async function seleccionarTipoDocumento(pagina: Page, tipo: string, esperaMs: number): Promise<void> {
  await pagina.locator('mat-select').first().click({ timeout: esperaMs });
  const etiqueta = ETIQUETAS_DOCUMENTO[tipo] ?? ETIQUETA_POR_DEFECTO;
  await pagina.getByRole('option', { name: etiqueta }).click();
}

/**
 * The real checkbox sits behind Material's visual, so a forced click lands on
 * something that ignores it and the state never changes. Verified against the
 * live portal: `check({ force: true })` fails with "Clicking the checkbox did
 * not change its state". Clicking its label is what a person actually does.
 */
async function aceptarTratamientoDatos(pagina: Page, esperaMs: number): Promise<void> {
  const casilla = pagina.locator(CASILLA_DATOS);
  await casilla.waitFor({ state: 'attached', timeout: esperaMs });
  await intentarMarcar(pagina, esperaMs);
  if (await casilla.isChecked()) {
    return;
  }
  // Last resort: set it and tell Angular, which listens to these events.
  await casilla.evaluate((el: HTMLInputElement) => {
    el.checked = true;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/** From most specific to most generic; the first one that toggles it wins. */
const OBJETIVOS_CASILLA = [
  `label:has(${CASILLA_DATOS})`,
  `mat-checkbox:has(${CASILLA_DATOS})`,
  'label[for], mat-checkbox',
];

async function intentarMarcar(pagina: Page, esperaMs: number): Promise<void> {
  const espera = Math.min(esperaMs, ESPERA_CASILLA_MS);
  for (const objetivo of OBJETIVOS_CASILLA) {
    await pulsarSiSigueSinMarcar(pagina, objetivo, espera);
  }
}

async function pulsarSiSigueSinMarcar(pagina: Page, objetivo: string, espera: number): Promise<void> {
  const marcada = await pagina.locator(CASILLA_DATOS).isChecked().catch(() => false);
  if (marcada) {
    return;
  }
  await pagina.locator(objetivo).first().click({ timeout: espera }).catch(() => null);
}

async function verificarIngreso(pagina: Page, esperaMs: number): Promise<ResultadoDescarga> {
  const resultado = await Promise.race([
    // After the STS hop the portal lands on the dashboard. Anchoring on the
    // host or on 'WebArquitectura' would false-positive on the login page.
    pagina.waitForURL(/WebDashboard/i, { timeout: esperaMs }).then(() => 'ok' as const),
    pagina
      .locator('text=/credenciales|contraseña incorrecta|usuario no|no coincide/i')
      .or(pagina.locator('mat-error'))
      .or(pagina.locator('mat-snack-bar-container'))
      .first()
      .waitFor({ timeout: esperaMs })
      .then(() => 'credenciales' as const),
    pagina
      .locator('text=/c[oó]digo de verificaci[oó]n|doble factor|captcha|bloquead|intentos fallidos/i')
      .first()
      .waitFor({ timeout: esperaMs })
      .then(() => 'verificacion' as const),
  ]).catch(() => 'tiempo' as const);
  return resultado === 'tiempo' ? desenlacePorUrl(pagina) : resultadoDeIngreso(resultado);
}

/**
 * On bad credentials the portal just re-renders the empty login form, with no
 * message this side can match. Staying on the identity screen is the reliable
 * signal; reporting a timeout there would blame the DIAN for answering.
 */
function desenlacePorUrl(pagina: Page): ResultadoDescarga {
  if (URL_IDENTIDAD.test(pagina.url())) {
    return fallo('credenciales_invalidas', 'La DIAN no aceptó los datos de ingreso');
  }
  return fallo('tiempo_agotado', 'El portal de la DIAN no respondió a tiempo');
}

/** A 2FA or a captcha is not a timeout: the user must know what happened. */
function resultadoDeIngreso(resultado: string): ResultadoDescarga {
  if (resultado === 'ok') {
    return { exito: true };
  }
  if (resultado === 'credenciales') {
    return fallo('credenciales_invalidas', 'La DIAN rechazó los datos de ingreso');
  }
  if (resultado === 'verificacion') {
    return fallo('requiere_verificacion', 'La DIAN pidió una verificación adicional');
  }
  return fallo('tiempo_agotado', 'El portal de la DIAN no respondió a tiempo');
}

/** Reads the download into memory; the caller decides whether to keep it. */
export async function archivoDe(descarga: Download): Promise<ResultadoDescarga> {
  const { readFile } = await import('node:fs/promises');
  const ruta = await descarga.path();
  return {
    exito: true,
    contenido: new Uint8Array(await readFile(ruta)),
    nombreArchivo: descarga.suggestedFilename(),
  };
}
