/**
 * Mapear la pantalla de firma SIN escribir nada: el insumo con el que se
 * implementó la presentación. Se conserva porque diligenciar (que nunca firma)
 * lo devuelve en su resultado: si la DIAN cambia esa pantalla, el mapa lo
 * delata antes de que falle una presentación de verdad.
 */

import { PAUSA_MS, pulsarAccion } from './entrada-editor-210';
import { mapaDeLaPantalla } from './huella-pantalla';

import type { MapaDeControles } from './huella-pantalla';
import type { Page } from 'playwright';

/** La última sección guarda y avanza al paso de firma con este botón. */
const CONTINUAR_A_FIRMA = /^\s*Guardar y continuar\s*$/;

type PasoAFirma = 'Guardar y continuar' | null;

/**
 * Solo hasta la pantalla de firma: en MUISCA firmar ES presentar, así que el
 * botón "Firmar" de esa pantalla no se pulsa aquí nunca.
 */
async function pasarAFirma(editor: Page): Promise<PasoAFirma> {
  return (await pulsarAccion(editor, CONTINUAR_A_FIRMA, PAUSA_MS * 4)) ? 'Guardar y continuar' : null;
}

export async function mapearFirma(editor: Page): Promise<MapaDeControles & { pulso: PasoAFirma }> {
  const ventanaNueva = editor.context().waitForEvent('page', { timeout: PAUSA_MS * 4 }).catch(() => null);
  const pulso = await pasarAFirma(editor);
  const firma = (pulso ? await ventanaNueva : null) ?? editor;
  await firma.waitForLoadState('domcontentloaded').catch(() => null);
  await firma.waitForTimeout(PAUSA_MS * 3);
  return { pulso, ...(await mapaDeLaPantalla(firma)) };
}
