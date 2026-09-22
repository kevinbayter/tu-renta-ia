/**
 * Signing and filing the 210 in MUISCA (research/09 §5).
 *
 * The signature password is the account password (DIAN, since Sep-2023). The
 * dynamic code is only asked for in some cases: when the portal asks for it
 * and we do not have it, nothing is signed and the user is asked for it.
 *
 * The acuse de recibo is the only proof of filing: Resolución 000227 de 2025
 * (art. 1.7.4.2 num. 7) considers a document signed "en el momento en que el
 * sistema genera el acuse de recibo". Without it, this reports `presentada: false`.
 */

import type { ProgresoConexion, ResultadoPresentacion } from '@turenta/core';

import { campoDeCodigo, escribirFirma } from './campos-firma-210';
import { abrirComunicados, codigoTrasNuevoAviso, primerAviso } from './codigo-firma-muisca';
import { diagnosticoDeFirma } from './diagnostico-firma';
import { PASOS_HASTA_LA_CLAVE, accionHabilitada, buscarDialogo, paginasAbiertas, tieneClave, tienePasoHabilitado } from './dialogo-firma-210';
import { PAUSA_MS, cerrarAvisos, hayBoton, pulsarAccion } from './entrada-editor-210';
import { mapaDeLaPantalla } from './huella-pantalla';

import type { DatosFirma } from './campos-firma-210';
import type { Locator, Page } from 'playwright';

const FIRMA = {
  dialogo: 'mat-dialog-container, [role="dialog"]',
  /** Exact text: "Firmar y presentar" of the suggested return is never pressed. */
  firmar: /^\s*Firmar\s*$/,
  presentar: /^\s*Presentar\s*$/,
  /**
   * El control para pedir el código es el "aquí" de "solicítela aquí": el
   * botón lleva SOLO esa palabra, la frase queda fuera. Mapeado en la ventana
   * real (/firmaelectronica/firma.html) el 20-sep-2026.
   */
  solicitarCodigo: /solic[ií]t|^\s*aqu[ií]\s*$/i,
  cerrar: /^\s*(close|Cancelar|Cerrar)\s*$/,
  /** MUISCA asks WHO signs, then confirms, and only then asks for the password. */
  autorizar: /^\s*Autorizar\s*$/,
  /** Buttons that only confirm what the user already authorized. */
  confirmar: /^\s*(Sí|Si|Aceptar|Continuar|Confirmar)\s*$/,
  acuse: /acuse|presentad/i,
  /** The last section's way forward: saves and moves on to the signing step. */
  continuarAFirma: /^\s*Guardar y continuar\s*$/,
  /** Lleva del paso "Firmar" al paso "Presentar". Trae ligadura de icono. */
  siguiente: /^\s*Siguiente/,
  /** Vuelve al paso anterior. Trae la ligadura del icono delante del texto. */
  anterior: /Anterior\s*$/,
  /** La prueba de que el documento ya lleva firma. */
  verFirmada: /declaraci[oó]n firmada|documento firmado/i,
  descargarAcuse: /^\s*(picture_as_pdf|Descargar)\s*$/,
} as const;

type Avisar = (progreso: ProgresoConexion) => void;

/** Ya firmada en un intento anterior: solo falta presentar y traer el acuse. */
export function presentarFirmada(editor: Page, esperaMs: number, avisar: Avisar): Promise<ResultadoPresentacion> {
  avisar({ etapa: 'presentando', mensaje: 'Ya estaba firmada: presentando ante la DIAN' });
  return presentar(editor, esperaMs, avisar);
}

export async function firmarYPresentar(
  editor: Page,
  datos: DatosFirma,
  esperaMs: number,
  avisar: Avisar,
): Promise<ResultadoPresentacion> {
  if (await yaFirmadaEnElPortal(editor)) {
    avisar({ etapa: 'presentando', mensaje: 'Ya estaba firmada: presentando ante la DIAN' });
    return presentar(editor, esperaMs, avisar);
  }
  avisar({ etapa: 'firmando', mensaje: 'Abriendo la firma electrónica' });
  const dialogo = await abrirDialogoFirma(editor, esperaMs);
  if (!dialogo) {
    return sinDialogo(editor, esperaMs, avisar);
  }
  const listo = await escribirFirma(dialogo, datos);
  if (listo === 'falta_codigo') {
    return conElCodigo(editor, dialogo, esperaMs, avisar);
  }
  if (listo === 'sin_campo') {
    return { exito: false, motivoFallo: 'estructura_cambiada', detalle: `La ventana de firma cambió · firma=${await diagnosticoDeFirma(editor)} · ${await mapaDeTodo(editor)}` };
  }
  return firmar(editor, dialogo, esperaMs, avisar);
}

/**
 * El paso "Firmar" NO dice si el documento ya lleva firma: al recargar vuelve a
 * rotular "Ver borrador" aunque esté firmado, y volver a firmar solo abre un
 * diálogo que ya únicamente ofrece "Desautorizar". La prueba está un paso más
 * allá, en "Presentar", donde el portal sí muestra "Ver declaración firmada".
 * Avanzar de paso es reversible; firmar dos veces, no.
 */
async function yaFirmadaEnElPortal(editor: Page): Promise<boolean> {
  if (await esperarFirmada(editor)) {
    return true;
  }
  if (!(await pulsarAccion(editor, FIRMA.siguiente, PAUSA_MS * 4))) {
    return false;
  }
  if (await esperarFirmada(editor)) {
    return true;
  }
  // No estaba firmada: hay que deshacer el paso o el robot se queda sin "Firmar".
  await pulsarAccion(editor, FIRMA.anterior, PAUSA_MS * 4);
  await editor.waitForTimeout(PAUSA_MS * 2);
  return false;
}

/**
 * Si el portal firmó sin pedir contraseña, la ventana desaparece y queda el
 * paso "Presentar": seguir es lo correcto, decir que no se firmó sería falso.
 *
 * Solo cuenta un botón de verdad: el stepper del portal trae siempre el texto
 * "Presentar", y tomarlo por el botón daría por firmada una declaración que no
 * lo está.
 */
async function sinDialogo(editor: Page, esperaMs: number, avisar: Avisar): Promise<ResultadoPresentacion> {
  const hayPresentar = await hayBoton(editor, FIRMA.presentar);
  if (!hayPresentar) {
    return { exito: false, motivoFallo: 'estructura_cambiada', detalle: `No se abrió la ventana de firma · firma=${await diagnosticoDeFirma(editor)} · ${await mapaDeTodo(editor)}` };
  }
  avisar({ etapa: 'presentando', mensaje: 'Firmada: presentando ante la DIAN' });
  return presentar(editor, esperaMs, avisar);
}

async function abrirDialogoFirma(editor: Page, esperaMs: number): Promise<Locator | null> {
  await cerrarAvisos(editor);
  if (!(await pulsarAccion(editor, FIRMA.firmar, esperaMs))) {
    return null;
  }
  await editor.waitForTimeout(PAUSA_MS * 2);
  return dialogoConClave(editor, Date.now() + ESPERA_FIRMA_MS);
}

/** El portal consulta el certificado antes de habilitar sus botones. */
const ESPERA_FIRMA_MS = 75_000;

/**
 * Dos trampas del portal aquí. Abre varios contenedores a la vez (ayuda, datos
 * del firmante, confirmación), así que el primero no es el que sirve: se elige
 * por contenido. Y mientras dice "Consultando información" deja los botones
 * puestos pero inertes, así que rendirse al primer intento fallido es rendirse
 * antes de tiempo.
 */
async function dialogoConClave(editor: Page, hasta: number): Promise<Locator | null> {
  const conClave = await buscarDialogo(editor, tieneClave);
  if (conClave) {
    return conClave;
  }
  const paso = await buscarDialogo(editor, tienePasoHabilitado);
  await (paso ? pulsarPrimerPaso(paso) : editor.waitForTimeout(PAUSA_MS));
  await editor.waitForTimeout(PAUSA_MS * 2);
  return Date.now() < hasta ? dialogoConClave(editor, hasta) : null;
}

async function pulsarPrimerPaso(dialogo: Locator, indice = 0): Promise<boolean> {
  const paso = PASOS_HASTA_LA_CLAVE[indice];
  if (!paso) {
    return false;
  }
  const pulso = (await accionHabilitada(dialogo, paso)) && (await pulsarEnDialogo(dialogo, paso));
  return pulso || pulsarPrimerPaso(dialogo, indice + 1);
}


/**
 * El código lo manda la DIAN a la bandeja del propio portal, en esta misma
 * sesión: se lee de ahí. Si no aparece, se le pide al usuario, que es el
 * camino de siempre y el que nunca inventa nada.
 */
interface IntentoCodigo {
  codigo: string | null;
  pedido: boolean;
  /** Qué se vio en la bandeja: sin esto, "no lo encontró" no dice nada. */
  bandeja: string;
}

async function conElCodigo(editor: Page, dialogo: Locator, esperaMs: number, avisar: Avisar): Promise<ResultadoPresentacion> {
  avisar({ etapa: 'firmando', mensaje: 'El portal pidió un código: buscándolo en tus comunicados de la DIAN' });
  const intento = await codigoDeLaBandeja(editor, dialogo, esperaMs);
  if (intento.codigo === null) {
    return codigoPendiente(editor, dialogo, intento);
  }
  await campoDeCodigo(dialogo).fill(intento.codigo);
  return firmar(editor, dialogo, esperaMs, avisar);
}

/**
 * El código se pide UNA vez. Pedirlo de nuevo tras fallar la lectura invalida
 * el que la DIAN acaba de mandar y deja al usuario con un código muerto.
 */
async function codigoDeLaBandeja(editor: Page, dialogo: Locator, esperaMs: number): Promise<IntentoCodigo> {
  const bandeja = await abrirComunicados(editor, esperaMs);
  if (!bandeja) {
    return { codigo: null, pedido: await pulsarSolicitud(dialogo), bandeja: 'no abrió' };
  }
  try {
    const antes = await primerAviso(bandeja);
    const pedido = await pulsarSolicitud(dialogo);
    const codigo = pedido ? await codigoTrasNuevoAviso(bandeja, antes, esperaMs) : null;
    return { codigo, pedido, bandeja: `antes="${antes.slice(0, 70)}" despues="${(await primerAviso(bandeja)).slice(0, 70)}"` };
  } finally {
    await bandeja.close().catch(() => null);
  }
}

async function codigoPendiente(editor: Page, dialogo: Locator, intento: IntentoCodigo): Promise<ResultadoPresentacion> {
  await pulsarEnDialogo(dialogo, FIRMA.cerrar);
  return {
    exito: true,
    firmada: false,
    presentada: false,
    requiereCodigo: true,
    detalle: `El portal pidió el código · solicitado=${String(intento.pedido)} · bandeja: ${intento.bandeja} · ${await mapaDeTodo(editor)}`,
  };
}

/**
 * Pide el código al portal. Solo vale un control de verdad: buscarlo por texto
 * suelto pulsa el párrafo "si no realizaste esta solicitud…", que acepta el
 * clic y no pide nada, y el usuario espera un correo que nunca salió.
 */
function pulsarSolicitud(dialogo: Locator): Promise<boolean> {
  const enlace = dialogo
    .locator('button, a, [role="button"]')
    .filter({ hasText: FIRMA.solicitarCodigo })
    .filter({ visible: true })
    .first();
  return pulsarAunqueEsteTapado(enlace, PAUSA_MS * 2);
}

async function firmar(editor: Page, dialogo: Locator, esperaMs: number, avisar: Avisar): Promise<ResultadoPresentacion> {
  if (!(await pulsarEnDialogo(dialogo, FIRMA.firmar, esperaMs))) {
    return { exito: false, motivoFallo: 'estructura_cambiada', detalle: `No se pudo firmar · ${await mapaDeTodo(editor)}` };
  }
  if (!(await cerroLaVentana(dialogo, editor))) {
    return { exito: false, motivoFallo: 'estructura_cambiada', detalle: `Se pulsó firmar y el portal no avanzó · ${await mapaDeTodo(editor)}` };
  }
  avisar({ etapa: 'presentando', mensaje: 'Firmada: presentando ante la DIAN' });
  return presentar(editor, esperaMs, avisar);
}

/**
 * Pulsar no es firmar. El clic directo que sortea las capas del portal devuelve
 * éxito aunque el portal lo ignore, así que hay que comprobar que la ventana de
 * firma se fue: decir "firmada" sin ver eso es mentirle al usuario sobre el
 * estado de una declaración, que es lo más grave que puede hacer TuRenta.
 */
async function cerroLaVentana(dialogo: Locator, editor: Page, hasta = Date.now() + ESPERA_FIRMA_MS): Promise<boolean> {
  await editor.waitForTimeout(PAUSA_MS * 2);
  if (!(await tieneClave(dialogo))) {
    return true;
  }
  return Date.now() < hasta ? cerroLaVentana(dialogo, editor, hasta) : false;
}

/**
 * Filing is a separate step from signing: without it there is no acuse and,
 * for the DIAN, no filed return.
 */
async function presentar(editor: Page, esperaMs: number, avisar: Avisar): Promise<ResultadoPresentacion> {
  const firmada = { exito: true, firmada: true, presentada: false } as const;
  if (!(await pulsarPresentar(editor, esperaMs))) {
    return { ...firmada, detalle: `Firmada, pero no se encontró "Presentar" · ${await mapaDeTodo(editor)}` };
  }
  await confirmarPresentacion(editor);
  const acuse = await descargarAcuse(editor, avisar);
  const pantalla = await mapa(editor);
  if (!acuse) {
    return { ...firmada, presentada: FIRMA.acuse.test(pantalla), detalle: pantalla };
  }
  return { exito: true, firmada: true, presentada: true, acuse, presentadaEn: new Date().toISOString(), detalle: pantalla };
}

/** Cuánto se le da al portal para pintar el paso siguiente. */
const ESPERA_PASO_MS = 12_000;

/**
 * El editor abre pintando "Firmar formulario" y solo después salta al paso en
 * el que de verdad está la declaración. Preguntar de inmediato lee la pantalla
 * vieja y lleva a intentar firmar algo que ya está firmado.
 */
function esperarFirmada(editor: Page): Promise<boolean> {
  return editor
    .locator('button, [role="button"]', { hasText: FIRMA.verFirmada })
    .filter({ visible: true })
    .first()
    .waitFor({ state: 'visible', timeout: ESPERA_PASO_MS })
    .then(() => true, () => false);
}

/**
 * Firmar NO lleva solo al paso de presentar: el portal se queda en "Firmar
 * formulario" y hay que pulsar "Siguiente" (mapeado en la cuenta real el
 * 20-sep-2026). Solo entonces aparece "Ahora solo queda presentar su
 * declaración ante la DIAN" con su botón.
 */
async function pulsarPresentar(editor: Page, esperaMs: number): Promise<boolean> {
  if (await esperarPresentar(editor)) {
    return pulsarAunqueEsteTapado(controlPresentar(editor), esperaMs);
  }
  await pulsarAccion(editor, FIRMA.siguiente, PAUSA_MS * 4);
  if (!(await esperarPresentar(editor))) {
    return false;
  }
  return pulsarAunqueEsteTapado(controlPresentar(editor), esperaMs);
}

/** El stepper trae SIEMPRE el rótulo "Presentar": solo vale un control real. */
function controlPresentar(editor: Page): Locator {
  return editor.locator('button, [role="button"]', { hasText: FIRMA.presentar }).filter({ visible: true }).first();
}

function esperarPresentar(editor: Page): Promise<boolean> {
  return controlPresentar(editor)
    .waitFor({ state: 'visible', timeout: ESPERA_PASO_MS })
    .then(() => true, () => false);
}

/** Only buttons that confirm the filing the user already authorized. */
async function confirmarPresentacion(editor: Page): Promise<void> {
  await editor.waitForTimeout(PAUSA_MS * 2);
  await pulsarAccion(editor, FIRMA.confirmar, PAUSA_MS * 4);
  await editor.waitForTimeout(PAUSA_MS * 3);
}

async function descargarAcuse(editor: Page, avisar: Avisar): Promise<ResultadoPresentacion['acuse']> {
  avisar({ etapa: 'descargando', mensaje: 'Descargando el acuse de recibo' });
  const descarga = editor.waitForEvent('download', { timeout: PAUSA_MS * 8 }).catch(() => null);
  await pulsarAccion(editor, FIRMA.descargarAcuse, PAUSA_MS * 4);
  const archivo = await descarga;
  if (!archivo) {
    return undefined;
  }
  const ruta = await archivo.path();
  const contenido = ruta ? await leerArchivo(ruta) : '';
  return contenido === '' ? undefined : { nombreArchivo: archivo.suggestedFilename(), contenidoBase64: contenido };
}

async function leerArchivo(ruta: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  return readFile(ruta)
    .then((datos) => datos.toString('base64'))
    .catch(() => '');
}

function mapa(pagina: Page): Promise<string> {
  return mapaDeLaPantalla(pagina).then((m) => JSON.stringify(m).slice(0, 1_500));
}

/**
 * Cuando falla, el diagnóstico tiene que incluir la ventana donde sí estaba, y
 * eso incluye los marcos: la firma vive dentro de uno.
 */
async function mapaDeTodo(editor: Page): Promise<string> {
  const marcos = paginasAbiertas(editor).flatMap((pagina) => pagina.frames());
  const mapas = await Promise.all(marcos.map((marco) => mapaDeLaPantalla(marco).catch(() => null)));
  return JSON.stringify(mapas.filter(Boolean)).slice(0, 2_500);
}

/** Dentro del diálogo vale lo mismo: la acción puede no ser un <button>. */
async function pulsarEnDialogo(dialogo: Locator, texto: RegExp, esperaMs = PAUSA_MS * 2): Promise<boolean> {
  const boton = dialogo.locator('button', { hasText: texto }).filter({ visible: true }).first();
  const hayBotonReal = await boton.isVisible().catch(() => false);
  const control = hayBotonReal ? boton : dialogo.getByText(texto).filter({ visible: true }).first();
  return pulsarAunqueEsteTapado(control, esperaMs);
}

/**
 * El portal superpone paneles (la ayuda queda encima del marco de firma) y la
 * capa de arriba se come el clic. El evento directo sí llega al control, pero
 * solo si está habilitado: nunca despierta un botón que el portal apagó.
 */
async function pulsarAunqueEsteTapado(control: Locator, esperaMs: number): Promise<boolean> {
  const normal = await control.click({ timeout: esperaMs }).then(() => true, () => false);
  if (normal) {
    return true;
  }
  const activo = await control.isEnabled().catch(() => false);
  return activo ? control.dispatchEvent('click').then(() => true, () => false) : false;
}

