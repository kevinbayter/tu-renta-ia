import { chromium } from 'playwright';

import type {
  ConexionDianPort,
  ContextoOperacionDian,
  CredencialesDian,
  MotivoFalloDian,
  ProgresoConexion,
  ResultadoDescarga,
} from '@turenta/core';

import type { Browser, Page } from 'playwright';

/**
 * Adaptador del portal MUISCA (Playwright). Es el ÚNICO punto del sistema que
 * ve las credenciales del usuario: las recibe por parámetro, las usa en la
 * sesión y nunca las devuelve, guarda ni registra (PLAN-DIAN.md §1).
 *
 * Estructura del login verificada el 25-jul-2026 (Angular Material, no JSF):
 * research/07-automatizacion-dian-analisis-2026.md §2.1.1
 */

const URL_LOGIN = 'https://muisca.dian.gov.co/WebArquitectura/DefLogin.faces';
const ESPERA_MS = 45_000;

/**
 * Panel de exógena del dashboard, verificado contra el portal real el
 * 25-jul-2026 con mapeo asistido (el titular autenticó en pantalla; no se
 * guardó ninguna credencial). Los ids son de JSF —`vistaDashboard:frmDashboard:*`—
 * y se anclan por sufijo porque el prefijo del árbol de componentes cambia
 * entre vistas del MUISCA.
 */
const EXOGENA = {
  enlace: /Consultar informaci[oó]n Ex[oó]gena|Informaci[oó]n Reportada por terceros/i,
  aceptarCondiciones: '[id$="btnBuscar"]',
  anio: '[id$="anioSel"]',
  generar: '[id$="btnExogenaGenerar"]',
  descargar: '[id$="lnkDescargarReporteExogena"]',
} as const;

export class ConexionMuisca implements ConexionDianPort {
  async descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tu información exógena' });
      return descargarReporteExogena(pagina, contexto.anioGravable, alProgresar);
    });
  }

  async descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tus declaraciones presentadas' });
      return descargarDeclaracionPresentada(pagina, contexto.anioGravable, alProgresar);
    });
  }

  /** Abre navegador, autentica, ejecuta la operación y SIEMPRE cierra y limpia. */
  private async enSesion(
    credenciales: CredencialesDian,
    alProgresar: ((p: ProgresoConexion) => void) | undefined,
    operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  ): Promise<ResultadoDescarga> {
    let navegador: Browser | null = null;
    try {
      alProgresar?.({ etapa: 'iniciando', mensaje: 'Abriendo conexión segura' });
      navegador = await chromium.launch({ headless: true });
      return await autenticarYOperar(navegador, credenciales, operacion, alProgresar);
    } catch (error) {
      return fallo(clasificarError(error), mensajeDe(error));
    } finally {
      await navegador?.close().catch(() => null);
    }
  }
}

/** Autentica y, si el ingreso fue exitoso, ejecuta la operación pedida. */
async function autenticarYOperar(
  navegador: Browser,
  credenciales: CredencialesDian,
  operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const contexto = await navegador.newContext({ acceptDownloads: true });
  const pagina = await contexto.newPage();
  const autenticado = await autenticar(pagina, credenciales, alProgresar);
  return autenticado.exito ? operacion(pagina) : autenticado;
}

async function autenticar(
  pagina: Page,
  credenciales: CredencialesDian,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  alProgresar?.({ etapa: 'autenticando', mensaje: 'Ingresando a tu cuenta' });
  await pagina.goto(URL_LOGIN, { waitUntil: 'domcontentloaded', timeout: ESPERA_MS });
  await pagina.getByRole('button', { name: 'A nombre propio' }).click({ timeout: ESPERA_MS });
  await seleccionarTipoDocumento(pagina, credenciales.tipoDocumento);
  await pagina.fill('input[name="numDocumento"]', credenciales.numeroDocumento);
  await pagina.fill('input[name="password"]', credenciales.contrasena);
  await pagina.check('input[name="aceptaTratamientoDatos"]', { force: true });
  await pagina.getByRole('button', { name: 'Ingresar' }).click();
  return verificarIngreso(pagina);
}

/** El tipo de documento es un mat-select de Angular Material, no un <select>. */
async function seleccionarTipoDocumento(pagina: Page, tipo: string): Promise<void> {
  const etiquetas: Record<string, string> = {
    CC: 'Cédula de ciudadanía',
    CE: 'Cédula de extranjería',
    NIT: 'NIT',
    PA: 'Pasaporte',
    TI: 'Tarjeta de identidad',
  };
  await pagina.locator('mat-select').first().click({ timeout: ESPERA_MS });
  await pagina.getByRole('option', { name: etiquetas[tipo] ?? etiquetas['CC'] as string }).click();
}

async function verificarIngreso(pagina: Page): Promise<ResultadoDescarga> {
  const resultado = await Promise.race([
    // Tras autenticar (con su salto por el STS) el portal aterriza en el
    // dashboard. Anclar en el host o en 'WebArquitectura' daría un falso
    // positivo: la propia pantalla de login los cumple.
    pagina.waitForURL(/WebDashboard/i, { timeout: ESPERA_MS }).then(() => 'ok' as const),
    pagina
      .locator('text=/credenciales|contraseña incorrecta|usuario no|no coincide/i')
      .first()
      .waitFor({ timeout: ESPERA_MS })
      .then(() => 'credenciales' as const),
  ]).catch(() => 'tiempo' as const);
  if (resultado === 'ok') {
    return { exito: true };
  }
  return resultado === 'credenciales'
    ? fallo('credenciales_invalidas', 'La DIAN rechazó los datos de ingreso')
    : fallo('tiempo_agotado', 'El portal de la DIAN no respondió a tiempo');
}

/**
 * Descarga del reporte de terceros. Las rutas internas del MUISCA cambian sin
 * aviso: por eso cualquier fallo aquí devuelve 'estructura_cambiada' y la UI
 * ofrece la vía manual en lugar de dejar al usuario bloqueado.
 */
async function descargarReporteExogena(
  pagina: Page,
  anioGravable: number,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  alProgresar?.({ etapa: 'descargando', mensaje: 'Descargando el reporte' });
  const descarga = await Promise.all([
    pagina.waitForEvent('download', { timeout: ESPERA_MS }),
    irAConsultaExogena(pagina, anioGravable),
  ])
    .then(([d]) => d)
    .catch(() => null);
  if (!descarga) {
    return fallo('estructura_cambiada', 'No encontramos la opción de exógena en el portal');
  }
  const ruta = await descarga.path();
  const { readFile } = await import('node:fs/promises');
  return {
    exito: true,
    contenido: new Uint8Array(await readFile(ruta)),
    nombreArchivo: descarga.suggestedFilename(),
  };
}

/**
 * Flujo real del portal: el enlace del dashboard abre un panel modal con las
 * condiciones de uso de la información reportada por terceros; "btnBuscar" las
 * acepta y revela el selector de año, el botón de generar y el enlace de
 * descarga. El archivo llega como `reporteExogena<año>.xlsx`.
 *
 * Los botones son `input[type=image]`, por eso el clic va con `force`.
 */
async function irAConsultaExogena(pagina: Page, anioGravable: number): Promise<void> {
  await pagina.getByRole('link', { name: EXOGENA.enlace }).first().click({ timeout: ESPERA_MS });
  await pagina.locator(EXOGENA.aceptarCondiciones).click({ timeout: ESPERA_MS, force: true });
  await pagina.locator(EXOGENA.anio).selectOption(String(anioGravable), { timeout: ESPERA_MS });
  await pagina.locator(EXOGENA.generar).click({ timeout: ESPERA_MS, force: true });
  await pagina.waitForLoadState('networkidle', { timeout: ESPERA_MS }).catch(() => null);
  await dispararDescarga(pagina);
}

/**
 * El enlace de descarga no tiene contenido (mide 0×0 px): Playwright no puede
 * hacer clic por coordenadas. Su `onclick` arma el submit JSF que devuelve el
 * archivo, así que se invoca el clic directamente sobre el elemento.
 */
function dispararDescarga(pagina: Page): Promise<void> {
  return pagina.evaluate(
    (selector) => document.querySelector<HTMLElement>(selector)?.click(),
    EXOGENA.descargar as string,
  );
}

/** TODO Fase 2. */
function descargarDeclaracionPresentada(
  _pagina: Page,
  _anioGravable: number,
  _alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  return Promise.resolve(fallo('desconocido', 'Descarga de declaraciones: pendiente de la Fase 2'));
}

function fallo(motivo: MotivoFalloDian, detalle: string): ResultadoDescarga {
  return { exito: false, motivoFallo: motivo, detalle };
}

function clasificarError(error: unknown): MotivoFalloDian {
  const mensaje = mensajeDe(error).toLowerCase();
  if (mensaje.includes('timeout')) {
    return 'tiempo_agotado';
  }
  if (mensaje.includes('net::') || mensaje.includes('econnrefused')) {
    return 'portal_no_disponible';
  }
  return 'desconocido';
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}
