/**
 * El código electrónico de la firma llega a "Mis comunicados", la bandeja del
 * propio portal, en la MISMA sesión en la que estamos firmando. Leerlo de ahí
 * le evita al usuario ir a buscarlo a su correo.
 *
 * Es el segundo factor de la firma (Res. 000227 de 2025, art. 1.7.4.2): leerlo
 * solo es legítimo porque el titular autorizó esta presentación. Por eso nunca
 * se adivina: si el aviso nuevo no aparece, se devuelve null y TuRenta se lo
 * pide al usuario, que es el camino de siempre.
 */

import { PAUSA_MS } from './entrada-editor-210';

import type { Page } from 'playwright';

const COMUNICADOS = '/WebComunicaciones/DefComunicados.faces';

/**
 * El panel del mensaje abierto. La bandeja muestra el más nuevo al cargar, así
 * que no hay que pulsar la fila; y acotarse a este panel es lo que evita leer
 * la LISTA, donde un asunto trae la cédula del titular y se colaría como si
 * fuera el código.
 */
const MENSAJE = '[id$="pnlMensajeCorreo"]';
/**
 * La DIAN se toma su tiempo en depositar el aviso, así que se espera por reloj
 * y no por número de recargas. Si se agota no pasa nada malo: se le pide el
 * código al usuario, que es el camino que existía antes.
 */
const ESPERA_AVISO_MS = 60_000;

/**
 * El aviso dice "se entrega la clave dinámica solicitada para realizar el
 * trámite:" y el código va después, a varias palabras de distancia: exigir
 * cercanía no sirve. Lo que sí lo distingue es ser el primer token con un
 * dígito tras el anuncio; las fechas quedan fuera porque sus partes no llegan
 * a cinco caracteres.
 */
const ANUNCIO = /clave din[aá]mica|c[oó]digo/i;
const TOKEN = /\b[A-Za-z0-9]{5,20}\b/g;

export function extraerCodigo(texto: string): string | null {
  const plano = texto.replace(/\s+/g, ' ');
  const anuncio = ANUNCIO.exec(plano);
  if (!anuncio) {
    return null;
  }
  const despues = plano.slice(anuncio.index + anuncio[0].length);
  return (despues.match(TOKEN) ?? []).find((token) => /\d/.test(token)) ?? null;
}

/** Una pestaña aparte: la de la firma tiene el diálogo abierto y no se toca. */
export async function abrirComunicados(editor: Page, esperaMs: number): Promise<Page | null> {
  const bandeja = await editor.context().newPage();
  const url = `${new URL(editor.url()).origin}${COMUNICADOS}`;
  const llego = await bandeja.goto(url, { waitUntil: 'domcontentloaded', timeout: esperaMs }).then(() => true, () => false);
  if (llego) {
    return bandeja;
  }
  await bandeja.close().catch(() => null);
  return null;
}

/** Huella de lo que ya había: contra esto se reconoce el aviso nuevo. */
export async function primerAviso(bandeja: Page): Promise<string> {
  const panel = bandeja.locator(MENSAJE).first();
  const texto = await panel.innerText().catch(() => '');
  return texto.replace(/\s+/g, ' ').trim();
}

export async function codigoTrasNuevoAviso(bandeja: Page, anterior: string, esperaMs: number): Promise<string | null> {
  const nuevo = await esperarAvisoNuevo(bandeja, anterior, esperaMs, Date.now() + ESPERA_AVISO_MS);
  return nuevo ? extraerCodigo(await primerAviso(bandeja)) : null;
}

async function esperarAvisoNuevo(bandeja: Page, anterior: string, esperaMs: number, hasta: number): Promise<boolean> {
  await bandeja.reload({ waitUntil: 'domcontentloaded', timeout: esperaMs }).catch(() => null);
  const ahora = await primerAviso(bandeja);
  if (ahora !== anterior && ahora !== '') {
    return true;
  }
  if (Date.now() >= hasta) {
    return false;
  }
  await bandeja.waitForTimeout(PAUSA_MS * 2);
  return esperarAvisoNuevo(bandeja, anterior, esperaMs, hasta);
}
