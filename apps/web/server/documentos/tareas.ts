/**
 * Documents are processed in the background and the result is polled.
 *
 * Reading a PDF goes through the model and can take minutes, while the proxy in
 * front of us closes any request at 100 s. Answering immediately and letting
 * the client ask for the result removes that ceiling instead of fighting it.
 */

const VIDA_MS = 15 * 60_000;

export type EstadoTarea = 'en_curso' | 'listo' | 'error';

export interface Tarea {
  estado: EstadoTarea;
  resultado?: unknown;
  error?: string;
  expiraEn: number;
}

const tareas = new Map<string, Tarea>();

function limpiarCaducadas(ahora: number): void {
  const caducadas = [...tareas.entries()].filter(([, t]) => t.expiraEn < ahora);
  caducadas.forEach(([id]) => tareas.delete(id));
}

export function crearTarea(ahora = Date.now()): string {
  limpiarCaducadas(ahora);
  const id = crypto.randomUUID();
  tareas.set(id, { estado: 'en_curso', expiraEn: ahora + VIDA_MS });
  return id;
}

export function completarTarea(id: string, resultado: unknown, ahora = Date.now()): void {
  tareas.set(id, { estado: 'listo', resultado, expiraEn: ahora + VIDA_MS });
}

export function fallarTarea(id: string, error: string, ahora = Date.now()): void {
  tareas.set(id, { estado: 'error', error, expiraEn: ahora + VIDA_MS });
}

export function consultarTarea(id: string, ahora = Date.now()): Tarea | null {
  const tarea = tareas.get(id);
  if (!tarea || tarea.expiraEn < ahora) {
    return null;
  }
  return tarea;
}
