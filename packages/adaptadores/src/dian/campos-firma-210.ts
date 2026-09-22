/**
 * Los campos de la ventana de firma: la contraseña y el código electrónico.
 *
 * Se llenan y se COMPRUEBA que quedaron llenos. Un campo que no recibe su valor
 * deja al portal rechazando la firma en silencio —no dice nada, simplemente no
 * avanza— y desde fuera eso se confunde con "el botón no funciona".
 */

import type { Secreto } from '@turenta/core';

import { tieneClave } from './dialogo-firma-210';

import type { Locator } from 'playwright';

export interface DatosFirma {
  /** Envuelta hasta el último momento: se revela solo al escribirla en el campo. */
  contrasena: Secreto;
  codigo?: string;
}

export type Escritura = 'listo' | 'falta_codigo' | 'sin_campo';

const ETIQUETA_CODIGO = /c[oó]digo/i;

/**
 * El campo del código se reconoce por lo que dice, no por ser el primer texto
 * del diálogo: dentro del iframe del portal hay otros campos, y confundir uno
 * con el código hace que TuRenta pida al usuario un correo que nadie solicitó.
 *
 * `#txtOTP` es el id real de la ventana de firma (mapeada el 20-sep-2026). Va
 * el último, como red: si el portal lo renombra, las reglas por etiqueta siguen
 * funcionando.
 */
export function campoDeCodigo(dialogo: Locator): Locator {
  return dialogo
    .getByLabel(ETIQUETA_CODIGO)
    .or(dialogo.getByPlaceholder(ETIQUETA_CODIGO))
    .or(dialogo.locator('input[id*="odigo" i], input[name*="odigo" i], input#txtOTP'))
    .filter({ visible: true })
    .first();
}

/** The password goes in; the code only if the portal asks for it and we have it. */
export async function escribirFirma(dialogo: Locator, datos: DatosFirma): Promise<Escritura> {
  if (!(await tieneClave(dialogo))) {
    return 'sin_campo';
  }
  await escribirEn(dialogo.locator('input[type="password"]').first(), datos.contrasena.revelar());
  const codigo = campoDeCodigo(dialogo);
  if (!(await codigo.isVisible().catch(() => false))) {
    return 'listo';
  }
  if (!datos.codigo) {
    return 'falta_codigo';
  }
  return (await escribirEn(codigo, datos.codigo)) ? 'listo' : 'sin_campo';
}

/**
 * Escribir y comprobar que quedó escrito. Un campo que no recibe el valor deja
 * al portal rechazando la firma en silencio: no dice nada, simplemente no pasa
 * nada, y desde fuera se confunde con "el botón no funcionó".
 */
async function escribirEn(campo: Locator, valor: string): Promise<boolean> {
  const escribio = await campo.fill(valor).then(() => true, () => false);
  return escribio && (await campo.inputValue().catch(() => '')) === valor;
}
