/**
 * Redaction for anything that may reach a log, an HTTP response or the audit
 * trail. Counterpart of [[Secreto]]: that one prevents building unsafe strings,
 * this one cleans strings that were already built.
 */

import { MARCA_REDACTADO } from './secreto';

const CLAVES_SECRETAS =
  /^(contrasena|contraseña|password|pass|clave|secret|token|authorization|cookie|otp|codigo)$/i;
const LARGO_DETALLE = 200;
const LARGO_MINIMO_REDACTABLE = 3;

export function esClaveSecreta(clave: string): boolean {
  return CLAVES_SECRETAS.test(clave.trim());
}

/** Literal replacement, no regex: nothing to escape. */
export function redactarValores(texto: string, secretos: string[]): string {
  return secretos
    .filter((s) => s.length >= LARGO_MINIMO_REDACTABLE)
    .reduce((acc, s) => acc.split(s).join(MARCA_REDACTADO), texto);
}

/**
 * Detail safe to show and store. Playwright puts the reason on the first line
 * and the page dump below it; that part is dropped entirely rather than
 * filtered, since it can carry the taxpayer's whole DOM.
 */
export function detalleSeguro(nombre: string, mensaje: string, secretos: string[]): string {
  const primeraLinea = mensaje.split('\n')[0] ?? '';
  return redactarValores(`${nombre}: ${primeraLinea}`.slice(0, LARGO_DETALLE), secretos);
}

/** Redacts recursively, both by key name and by literal value. */
export function redactar(valor: unknown, secretos: string[] = []): unknown {
  if (typeof valor === 'string') {
    return redactarValores(valor, secretos);
  }
  if (Array.isArray(valor)) {
    return valor.map((v) => redactar(v, secretos));
  }
  if (valor instanceof Error) {
    return { nombre: valor.name, mensaje: detalleSeguro(valor.name, valor.message, secretos) };
  }
  if (valor !== null && typeof valor === 'object') {
    return redactarEntradas(valor as Record<string, unknown>, secretos);
  }
  return valor;
}

function redactarEntradas(objeto: Record<string, unknown>, secretos: string[]): Record<string, unknown> {
  const entradas = Object.entries(objeto).map(([clave, v]) =>
    esClaveSecreta(clave) ? ([clave, MARCA_REDACTADO] as const) : ([clave, redactar(v, secretos)] as const),
  );
  return Object.fromEntries(entradas);
}
