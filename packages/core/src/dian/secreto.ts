/**
 * A secret that cannot be printed by accident: `toString`, `toJSON` and Node's
 * inspection all return the redaction marker (PLAN-DIAN §4).
 *
 * This turns "the password never reaches a log" from a convention into a
 * guarantee of the type. `revelar()` is the only way to the real value.
 */

export const MARCA_REDACTADO = '[REDACTADO]';

const INSPECCION_NODE = Symbol.for('nodejs.util.inspect.custom');

/** Below this length, redacting by value would mangle any text. */
const LARGO_MINIMO_REDACTABLE = 3;

export class Secreto {
  /** Real private field: TypeScript's `private` vanishes at runtime. */
  #valor: string;

  constructor(valor: string) {
    this.#valor = valor;
  }

  /** Only exit point for the real value. Any other use is a defect. */
  revelar(): string {
    return this.#valor;
  }

  olvidar(): void {
    this.#valor = '';
  }

  get longitud(): number {
    return this.#valor.length;
  }

  /** Strips this secret from a text without exposing it to the caller. */
  redactarEn(texto: string): string {
    if (this.#valor.length < LARGO_MINIMO_REDACTABLE) {
      return texto;
    }
    return texto.split(this.#valor).join(MARCA_REDACTADO);
  }

  toString(): string {
    return MARCA_REDACTADO;
  }

  toJSON(): string {
    return MARCA_REDACTADO;
  }

  [INSPECCION_NODE](): string {
    return MARCA_REDACTADO;
  }
}
