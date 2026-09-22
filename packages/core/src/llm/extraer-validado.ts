import type { LlmPort } from '../puertos/llm-port';

type EntradaExtraccion = Parameters<LlmPort['extraerEstructurado']>[0];

interface ProblemaValidacion {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** Lo mínimo de un esquema Zod (`safeParse`), sin atar core a la librería. */
export interface Validador<T> {
  safeParse(
    valor: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: readonly ProblemaValidacion[] } };
}

const MAXIMO_PROBLEMAS = 5;

/**
 * Sin structured output estricto (json_object) el modelo a veces se sale del
 * esquema, p. ej. inventa un nombre de campo. Se le devuelven los errores
 * exactos UNA vez en lugar de tumbar la operación completa.
 */
export async function extraerValidado<T>(llm: LlmPort, entrada: EntradaExtraccion, validador: Validador<T>): Promise<T> {
  const primera = validador.safeParse(await llm.extraerEstructurado(entrada));
  if (primera.success) {
    return primera.data;
  }
  const correccion = `${entrada.system}\n\nTU RESPUESTA ANTERIOR NO CUMPLIÓ EL ESQUEMA (${describir(primera.error.issues)}). Responde de nuevo usando SOLO los campos y valores permitidos por el esquema.`;
  const segunda = validador.safeParse(await llm.extraerEstructurado({ ...entrada, system: correccion }));
  if (segunda.success) {
    return segunda.data;
  }
  throw new Error('La IA respondió en un formato que no pudimos validar. Intenta de nuevo.');
}

function describir(problemas: readonly ProblemaValidacion[]): string {
  return problemas
    .slice(0, MAXIMO_PROBLEMAS)
    .map((p) => `${p.path.map(String).join('.') || 'raíz'}: ${p.message.slice(0, 300)}`)
    .join('; ');
}
