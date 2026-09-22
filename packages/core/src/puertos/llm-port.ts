/**
 * Puerto hacia el proveedor LLM (hoy DeepSeek V4.1 Flash; cualquier API compatible OpenAI).
 * Los adaptadores implementan esto; core y motor-fiscal jamás llaman al LLM directamente.
 */
export interface LlmPort {
  /** Extracción con salida estructurada validada contra un JSON Schema. */
  extraerEstructurado(input: {
    system: string;
    user: string;
    imagenesBase64?: string[];
    jsonSchema: Record<string, unknown>;
    /** Esfuerzo de razonamiento: 'low' para tareas mecánicas, 'high' para montos críticos. */
    esfuerzo?: 'low' | 'medium' | 'high';
  }): Promise<unknown>;

  /** Turno conversacional de la entrevista (streaming se maneja en el adaptador web). */
  conversar(input: {
    system: string;
    mensajes: { rol: 'user' | 'assistant'; contenido: string }[];
  }): Promise<string>;
}
