import { chromium } from 'playwright';

import type {
  ConexionDianPort,
  ContextoOperacionDian,
  CredencialesDian,
  ProgresoConexion,
  ResultadoDescarga,
} from '@turenta/core';

import { anioEnTextos, textosDeAncestros } from './anio-de-fila';
import { clasificarError, detalleDeError, fallo } from './motivos-fallo';


import type { Browser, Download, ElementHandle, Page } from 'playwright';

/**
 * MUISCA portal adapter (Playwright). The ONLY place in the system that sees
 * the user's credentials: received as a parameter, used in the session, never
 * returned, stored or logged (PLAN-DIAN §1).
 *
 * FORBIDDEN here: Playwright tracing, video or HAR. All of them record the DOM
 * and the network — taxpayer data — and with `DEBUG=pw:api`, the password.
 *
 * Structure verified against the live portal on 2026-07-25:
 * research/07-automatizacion-dian-analisis-2026.md §2.1.1 to §2.1.3
 */

const URL_BASE_PRODUCCION = 'https://muisca.dian.gov.co';
const ESPERA_POR_DEFECTO_MS = 45_000;

/** Injectables so the flow can run against a fake MUISCA without long waits. */
export interface AjustesMuisca {
  urlBase?: string;
  esperaMs?: number;
  lanzarNavegador?: () => Promise<Browser>;
}

interface AjustesResueltos {
  urlBase: string;
  esperaMs: number;
  lanzarNavegador: () => Promise<Browser>;
}

function resolver(ajustes: AjustesMuisca): AjustesResueltos {
  return {
    urlBase: ajustes.urlBase ?? URL_BASE_PRODUCCION,
    esperaMs: ajustes.esperaMs ?? ESPERA_POR_DEFECTO_MS,
    lanzarNavegador: ajustes.lanzarNavegador ?? (() => chromium.launch({ headless: true })),
  };
}

/** Dashboard exógena panel (JSF/RichFaces). Ids anchored by suffix: the JSF prefix varies per view. */
const EXOGENA = {
  enlace: /Consultar informaci[oó]n Ex[oó]gena|Informaci[oó]n Reportada por terceros/i,
  aceptarCondiciones: '[id$="btnBuscar"]',
  anio: '[id$="anioSel"]',
  generar: '[id$="btnExogenaGenerar"]',
  descargar: '[id$="lnkDescargarReporteExogena"]',
} as const;

/** Filed returns live in an Angular SPA, not in the JSF dashboard. */
const DECLARACIONES = {
  barraMenu: '#divMenuTd',
  diligenciar: 'Diligenciar / Presentar',
  formulario210: 'Formulario 210',
  presentadas: 'Declaraciones de renta presentadas',
  /** Table header: proof the screen loaded even when there are no rows. */
  encabezadoTabla: 'No. formulario',
  /** Anchored to the icon file, not matTooltip: `ng-reflect-*` only exists in dev mode. */
  iconoDescargar: 'img[src*="descargar"]',
} as const;

export class ConexionMuisca implements ConexionDianPort {
  private readonly ajustes: AjustesResueltos;

  constructor(ajustes: AjustesMuisca = {}) {
    this.ajustes = resolver(ajustes);
  }

  async descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tu información exógena' });
      return descargarReporteExogena(pagina, contexto.anioGravable, this.ajustes, alProgresar);
    });
  }

  async descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tus declaraciones presentadas' });
      return descargarDeclaracionPresentada(pagina, contexto.anioGravable, this.ajustes, alProgresar);
    });
  }

  /** Opens the browser, authenticates, runs the operation and ALWAYS closes. */
  private async enSesion(
    credenciales: CredencialesDian,
    alProgresar: ((p: ProgresoConexion) => void) | undefined,
    operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  ): Promise<ResultadoDescarga> {
    let navegador: Browser | null = null;
    try {
      alProgresar?.({ etapa: 'iniciando', mensaje: 'Abriendo conexión segura' });
      navegador = await this.ajustes.lanzarNavegador();
      return await autenticarYOperar(navegador, credenciales, this.ajustes, operacion, alProgresar);
    } catch (error) {
      // The Secreto redacts itself: no need to reveal it just to clean the text.
      return fallo(clasificarError(error), credenciales.contrasena.redactarEn(detalleDeError(error)));
    } finally {
      await navegador?.close().catch(() => null);
    }
  }
}

/** Authenticates and, on success, runs the requested operation. */
async function autenticarYOperar(
  navegador: Browser,
  credenciales: CredencialesDian,
  ajustes: AjustesResueltos,
  operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const contexto = await navegador.newContext({ acceptDownloads: true });
  const pagina = await contexto.newPage();
  const autenticado = await autenticar(pagina, credenciales, ajustes, alProgresar);
  return autenticado.exito ? operacion(pagina) : autenticado;
}

async function autenticar(
  pagina: Page,
  credenciales: CredencialesDian,
  ajustes: AjustesResueltos,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  alProgresar?.({ etapa: 'autenticando', mensaje: 'Ingresando a tu cuenta' });
  const { urlBase, esperaMs } = ajustes;
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

const CASILLA_DATOS = 'input[name="aceptaTratamientoDatos"]';

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
  `label[for], mat-checkbox`,
];

const ESPERA_CASILLA_MS = 5_000;

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

/** Document type is an Angular Material mat-select, not a native <select>. */
async function seleccionarTipoDocumento(pagina: Page, tipo: string, esperaMs: number): Promise<void> {
  const etiquetas: Record<string, string> = {
    CC: 'Cédula de ciudadanía',
    CE: 'Cédula de extranjería',
    NIT: 'NIT',
    PA: 'Pasaporte',
    TI: 'Tarjeta de identidad',
  };
  await pagina.locator('mat-select').first().click({ timeout: esperaMs });
  await pagina.getByRole('option', { name: etiquetas[tipo] ?? (etiquetas['CC'] as string) }).click();
}

async function verificarIngreso(pagina: Page, esperaMs: number): Promise<ResultadoDescarga> {
  const resultado = await Promise.race([
    // After the STS hop the portal lands on the dashboard. Anchoring on the
    // host or on 'WebArquitectura' would false-positive on the login page itself.
    pagina.waitForURL(/WebDashboard/i, { timeout: esperaMs }).then(() => 'ok' as const),
    pagina
      .locator('text=/credenciales|contraseña incorrecta|usuario no|no coincide/i')
      .first()
      .waitFor({ timeout: esperaMs })
      .then(() => 'credenciales' as const),
    pagina
      .locator('text=/c[oó]digo de verificaci[oó]n|doble factor|captcha|bloquead|intentos fallidos/i')
      .first()
      .waitFor({ timeout: esperaMs })
      .then(() => 'verificacion' as const),
  ]).catch(() => 'tiempo' as const);
  return resultadoDeIngreso(resultado);
}

/** Un 2FA o un captcha no son un timeout: el usuario debe saber qué pasó. */
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

/**
 * Third-party report download. MUISCA's internals change without notice, so any
 * failure here reports 'estructura_cambiada' and the UI offers the manual path.
 */
async function descargarReporteExogena(
  pagina: Page,
  anioGravable: number,
  ajustes: AjustesResueltos,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  alProgresar?.({ etapa: 'descargando', mensaje: 'Descargando el reporte' });
  const descarga = await Promise.all([
    pagina.waitForEvent('download', { timeout: ajustes.esperaMs }),
    irAConsultaExogena(pagina, anioGravable, ajustes.esperaMs),
  ])
    .then(([d]) => d)
    .catch(() => null);
  if (!descarga) {
    return fallo('estructura_cambiada', 'No encontramos la opción de exógena en el portal');
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
async function irAConsultaExogena(pagina: Page, anioGravable: number, esperaMs: number): Promise<void> {
  await pagina.getByRole('link', { name: EXOGENA.enlace }).first().click({ timeout: esperaMs });
  await pagina.locator(EXOGENA.aceptarCondiciones).click({ timeout: esperaMs, force: true });
  await pagina.locator(EXOGENA.anio).selectOption(String(anioGravable), { timeout: esperaMs });
  await pagina.locator(EXOGENA.generar).click({ timeout: esperaMs, force: true });
  await pagina.waitForLoadState('networkidle', { timeout: esperaMs }).catch(() => null);
  await dispararDescarga(pagina);
}

/** The download link is empty and 0x0 px: no coordinate click, only its onclick. */
function dispararDescarga(pagina: Page): Promise<void> {
  return pagina.evaluate(
    (selector) => document.querySelector<HTMLElement>(selector)?.click(),
    EXOGENA.descargar as string,
  );
}

/** Downloads the filed return PDF for the given year, named `<formNumber>.pdf`. */
async function descargarDeclaracionPresentada(
  pagina: Page,
  anioGravable: number,
  ajustes: AjustesResueltos,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const llego = await irADeclaracionesPresentadas(pagina, ajustes.esperaMs);
  if (!llego) {
    return fallo('estructura_cambiada', 'No pudimos abrir tus declaraciones presentadas');
  }
  const icono = await iconoDescargaDelAnio(pagina, anioGravable);
  if (!icono) {
    return fallo('sin_declaracion', `No hay una declaración presentada del año ${String(anioGravable)}`);
  }
  alProgresar?.({ etapa: 'descargando', mensaje: `Descargando tu declaración ${String(anioGravable)}` });
  const descarga = await Promise.all([
    pagina.waitForEvent('download', { timeout: ajustes.esperaMs }),
    icono.click(),
  ])
    .then(([d]) => d)
    .catch(() => null);
  return descarga ? archivoDe(descarga) : fallo('estructura_cambiada', 'No se pudo descargar el PDF');
}

/**
 * MUISCA's side menu only opens on real pointer hover: a synthetic click on its
 * container does nothing (verified against the portal).
 *
 * Returns whether the table actually rendered. That distinction matters: without
 * it, a portal change would be reported to the user as "you have no return for
 * that year", which is a lie.
 */
async function irADeclaracionesPresentadas(pagina: Page, esperaMs: number): Promise<boolean> {
  return pagina
    .locator(DECLARACIONES.barraMenu)
    .hover({ timeout: esperaMs })
    .then(() => pagina.getByRole('link', { name: DECLARACIONES.diligenciar, exact: true }).first().click({ timeout: esperaMs }))
    .then(() => pagina.getByText(DECLARACIONES.formulario210, { exact: true }).first().click({ timeout: esperaMs }))
    .then(() => pagina.getByText(DECLARACIONES.presentadas, { exact: true }).first().click({ timeout: esperaMs }))
    .then(() => pagina.getByText(DECLARACIONES.encabezadoTabla).first().waitFor({ timeout: esperaMs }))
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

/** Reads the download into memory; the caller decides whether to keep it. */
async function archivoDe(descarga: Download): Promise<ResultadoDescarga> {
  const { readFile } = await import('node:fs/promises');
  const ruta = await descarga.path();
  return {
    exito: true,
    contenido: new Uint8Array(await readFile(ruta)),
    nombreArchivo: descarga.suggestedFilename(),
  };
}
