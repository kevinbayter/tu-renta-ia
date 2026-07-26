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
  usuarioId: string;
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

function actualizar(id: string, cambio: Partial<Tarea>, ahora: number): void {
  const previa = tareas.get(id);
  if (!previa) {
    return;
  }
  tareas.set(id, { ...previa, ...cambio, expiraEn: ahora + VIDA_MS });
}

export function crearTarea(usuarioId: string, ahora = Date.now()): string {
  limpiarCaducadas(ahora);
  const id = crypto.randomUUID();
  tareas.set(id, { usuarioId, estado: 'en_curso', expiraEn: ahora + VIDA_MS });
  return id;
}

export function completarTarea(id: string, resultado: unknown, ahora = Date.now()): void {
  actualizar(id, { estado: 'listo', resultado }, ahora);
}

export function fallarTarea(id: string, error: string, ahora = Date.now()): void {
  actualizar(id, { estado: 'error', error }, ahora);
}

/** Only the owner may read a task: the UUID alone must not grant access to
 * someone else's extracted tax data if it ever leaks. */
export function consultarTarea(id: string, usuarioId: string, ahora = Date.now()): Tarea | null {
  const tarea = tareas.get(id);
  if (!tarea || tarea.expiraEn < ahora || tarea.usuarioId !== usuarioId) {
    return null;
  }
  return tarea;
}
