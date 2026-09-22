/**
 * Encontrar el diálogo de la firma, que el portal no pone donde uno esperaría.
 *
 * Abre varios contenedores a la vez (ayuda, datos del firmante, confirmación),
 * así que el primero no sirve: se elige por contenido. Y mete la firma dentro
 * de un iframe, con los botones de fuera apagados, así que hay que recorrer
 * también los marcos.
 */

import type { Contexto } from './entrada-editor-210';
import type { Locator, Page } from 'playwright';

const DIALOGO = 'mat-dialog-container, [role="dialog"]';

/**
 * Antes de la contraseña hay dos pasos: "Persona que va a firmar… Autorizar" y
 * "¿Desea firmar…? Firmar". Autorizar es reversible ("Desautorizar") mientras
 * la declaración no se presente.
 */
export const PASOS_HASTA_LA_CLAVE = [/^\s*Autorizar\s*$/, /^\s*Firmar\s*$/] as const;

export function tieneClave(dialogo: Locator): Promise<boolean> {
  return dialogo.locator('input[type="password"]').first().isVisible().catch(() => false);
}

/** La firma puede abrirse en otra ventana del portal: se miran todas. */
export function paginasAbiertas(editor: Page): Page[] {
  return [editor, ...editor.context().pages().filter((pagina) => pagina !== editor && !pagina.isClosed())];
}

type Criterio = (dialogo: Locator) => Promise<boolean>;

/**
 * MUISCA encierra la firma en un iframe que se superpone al diálogo: los
 * botones de la página quedan apagados y los de verdad viven dentro del marco.
 * Por eso se recorren también los marcos, y allí el contenedor puede ser el
 * propio `body` (un iframe no necesita `role="dialog"`).
 */
interface Ambito {
  contexto: Contexto;
  /** En la página principal el `body` NO vale: su "Firmar" solo reabre el diálogo. */
  aceptaElCuerpo: boolean;
}

function ambitosAbiertos(editor: Page): Ambito[] {
  return paginasAbiertas(editor).flatMap((pagina) => [
    { contexto: pagina, aceptaElCuerpo: false },
    ...pagina
      .frames()
      .filter((marco) => marco !== pagina.mainFrame())
      .map((marco) => ({ contexto: marco, aceptaElCuerpo: true })),
  ]);
}

export async function buscarDialogo(editor: Page, cumple: Criterio): Promise<Locator | null> {
  const hallados = await Promise.all(ambitosAbiertos(editor).map((ambito) => dialogoDe(ambito, cumple)));
  return hallados.find((dialogo) => dialogo !== null) ?? null;
}

async function dialogoDe(ambito: Ambito, cumple: Criterio): Promise<Locator | null> {
  const dialogos = ambito.contexto.locator(DIALOGO).filter({ visible: true });
  const total = await dialogos.count().catch(() => 0);
  const enDialogo = await primeroQueCumpla(dialogos, total, cumple);
  if (enDialogo ?? !ambito.aceptaElCuerpo) {
    return enDialogo;
  }
  const cuerpo = ambito.contexto.locator('body').first();
  return (await cumple(cuerpo)) ? cuerpo : null;
}

async function primeroQueCumpla(dialogos: Locator, total: number, cumple: Criterio, indice = 0): Promise<Locator | null> {
  if (indice >= total) {
    return null;
  }
  const dialogo = dialogos.nth(indice);
  return (await cumple(dialogo)) ? dialogo : primeroQueCumpla(dialogos, total, cumple, indice + 1);
}

export async function tienePasoHabilitado(dialogo: Locator): Promise<boolean> {
  const habilitados = await Promise.all(PASOS_HASTA_LA_CLAVE.map((paso) => accionHabilitada(dialogo, paso)));
  return habilitados.includes(true);
}

/** Un botón inerte no cuenta como paso disponible; un <span> del portal, sí. */
export async function accionHabilitada(dialogo: Locator, texto: RegExp): Promise<boolean> {
  const boton = dialogo.locator('button', { hasText: texto }).filter({ visible: true }).first();
  const hayBotonReal = await boton.isVisible().catch(() => false);
  if (hayBotonReal) {
    return boton.isEnabled().catch(() => false);
  }
  return dialogo.getByText(texto).filter({ visible: true }).first().isVisible().catch(() => false);
}
