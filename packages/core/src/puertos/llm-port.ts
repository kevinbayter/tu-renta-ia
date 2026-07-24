/**
 * Puerto hacia el proveedor LLM (OpenCode Go / Kimi K3).
 * Los adaptadores implementan esto; core y motor-fiscal jamás llaman al LLM directamente.
 */
export interface LlmPort {
  /** Extracción con salida estructurada validada contra un JSON Schema. */
  extraerEstructurado(input: {
    system: string;
    user: string;
    imagenesBase64?: string[];
    jsonSchema: Record<string, unknown>;
  }): Promise<unknown>;

  /** Turno conversacional de la entrevista (streaming se maneja en el adaptador web). */
  conversar(input: {
    system: string;
    mensajes: { rol: 'user' | 'assistant'; contenido: string }[];
  }): Promise<string>;
}
