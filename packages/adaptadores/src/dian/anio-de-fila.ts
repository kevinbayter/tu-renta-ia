/**
 * Reads the tax year from a row of "filed returns".
 *
 * Split in two on purpose: `textosDeAncestros` runs INSIDE the browser
 * (Playwright serializes it with toString, so it cannot reference the module)
 * and only collects text; `anioEnTextos` is pure and testable without a browser.
 */

/** DIAN form number: 13 digits. Tells a row apart from the whole table. */
const PATRON_ANIO_FILA = /(20\d\d) \/ anual/;
const PATRON_FORMULARIO = /\d{13}/;

/** Runs in the browser: ancestor texts, nearest first, so the row wins over the table. */
export function textosDeAncestros(elemento: Element): string[] {
  const textos: string[] = [];
  let nodo = elemento.parentElement;
  while (nodo && textos.length < 6) {
    textos.push((nodo.textContent ?? '').replace(/\s+/g, ' '));
    nodo = nodo.parentElement;
  }
  return textos;
}

/** First ancestor that is a row (form number AND year) wins; the table matches too, but later. */
export function anioEnTextos(textos: string[]): string | null {
  const fila = textos.find((t) => PATRON_FORMULARIO.test(t) && PATRON_ANIO_FILA.test(t));
  return (PATRON_ANIO_FILA.exec(fila ?? '') ?? [])[1] ?? null;
}
