/** Client side of `server/flujo-ndjson.ts`: progress lines, then `{ fin }`. */

export interface Avance {
  etapa: string;
  mensaje: string;
}

type Linea = { progreso?: Avance; fin?: Record<string, unknown> };

/** The final outcome; a plain JSON answer (an early refusal) counts as the outcome too. */
export async function finDelFlujo(respuesta: Response | null, alAvanzar: (avance: Avance) => void): Promise<Record<string, unknown>> {
  if (!respuesta?.body) {
    return { ok: false };
  }
  if (!(respuesta.headers.get('content-type') ?? '').includes('ndjson')) {
    const cuerpo = ((await respuesta.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    return { ...cuerpo, ok: false };
  }
  let fin: Record<string, unknown> = { ok: false, mensaje: 'Se perdió la conexión con el servidor.' };
  const alLinea = (linea: Linea) => {
    if (linea.progreso) {
      alAvanzar(linea.progreso);
    }
    fin = linea.fin ?? fin;
  };
  await leerLineas(respuesta.body.getReader(), alLinea, new TextDecoder()).catch(() => null);
  return fin;
}

async function leerLineas(
  lector: ReadableStreamDefaultReader<Uint8Array>,
  alLinea: (linea: Linea) => void,
  decodificador: TextDecoder,
  pendiente = '',
): Promise<void> {
  const { done, value } = await lector.read();
  const lineas = (pendiente + (value ? decodificador.decode(value, { stream: true }) : '')).split('\n');
  const resto = done ? '' : (lineas.pop() ?? '');
  lineas.filter((l) => l.trim() !== '').forEach((l) => alLinea(JSON.parse(l) as Linea));
  return done ? undefined : leerLineas(lector, alLinea, decodificador, resto);
}
