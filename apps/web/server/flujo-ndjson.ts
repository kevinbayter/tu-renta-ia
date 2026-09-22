/**
 * Long operations (the robot takes minutes in MUISCA) answer as NDJSON: one
 * `{ progreso }` line per step and, always last, `{ fin }` with the outcome.
 */

export type Emitir = (linea: unknown) => void;

const FALLO_INESPERADO = { ok: false, mensaje: 'Ocurrió un error inesperado. No se guardó nada en tu cuenta.' };

export function responderEnFlujo(trabajo: (emitir: Emitir) => Promise<unknown>, alTerminar: () => void): Response {
  const codificador = new TextEncoder();
  const flujo = new ReadableStream<Uint8Array>({
    async start(control) {
      const emitir: Emitir = (linea) => control.enqueue(codificador.encode(`${JSON.stringify(linea)}\n`));
      try {
        emitir({ fin: await trabajo(emitir) });
      } catch {
        emitir({ fin: FALLO_INESPERADO });
      } finally {
        alTerminar();
        control.close();
      }
    },
  });
  return new Response(flujo, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
