import type { LlmPort } from '@turenta/core';

export interface LlmProviderConfig {
  /** Base URL del endpoint compatible OpenAI (sin /chat/completions). */
  baseUrl: string;
  apiKey: string;
  modelo: string;
  /** Headers extra que algún proveedor exija (p. ej. OpenRouter: HTTP-Referer). */
  headersExtra?: Record<string, string>;
}

type ContenidoMensaje = string | { type: string; [clave: string]: unknown }[];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: ContenidoMensaje;
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

/**
 * Adaptador LlmPort para CUALQUIER proveedor con API compatible OpenAI
 * (OpenCode Go/Zen, OpenRouter, Moonshot directo, Groq, Gemini, OpenAI...).
 * El proveedor es 100% configuración (LlmProviderConfig) — nunca código.
 * Proveedores con protocolo propio se soportan creando otra clase que
 * implemente LlmPort, sin tocar core ni la UI.
 */
export class OpenAiCompatibleLlmAdapter implements LlmPort {
  constructor(private readonly config: LlmProviderConfig) {}

  async extraerEstructurado(input: {
    system: string;
    user: string;
    imagenesBase64?: string[];
    jsonSchema: Record<string, unknown>;
  }): Promise<unknown> {
    const contenido = construirContenidoUsuario(input.user, input.imagenesBase64);
    const mensajes: ChatMessage[] = [
      { role: 'system', content: input.system },
      { role: 'user', content: contenido },
    ];
    const respuesta = await this.completar(mensajes, input.jsonSchema);
    return JSON.parse(respuesta) as unknown;
  }

  async conversar(input: {
    system: string;
    mensajes: { rol: 'user' | 'assistant'; contenido: string }[];
  }): Promise<string> {
    const historial: ChatMessage[] = input.mensajes.map((m) => ({ role: m.rol, content: m.contenido }));
    return this.completar([{ role: 'system', content: input.system }, ...historial]);
  }

  private async completar(messages: ChatMessage[], jsonSchema?: Record<string, unknown>): Promise<string> {
    const body: Record<string, unknown> = { model: this.config.modelo, messages };
    if (jsonSchema) {
      body['response_format'] = {
        type: 'json_schema',
        json_schema: { name: 'extraccion', schema: jsonSchema, strict: true },
      };
    }
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.headersExtra,
      },
      body: JSON.stringify(body),
    });
    return extraerContenido(res);
  }
}

function construirContenidoUsuario(texto: string, imagenesBase64?: string[]): ContenidoMensaje {
  if (!imagenesBase64 || imagenesBase64.length === 0) {
    return texto;
  }
  const imagenes = imagenesBase64.map((b64) => ({
    type: 'image_url',
    image_url: { url: `data:image/png;base64,${b64}` },
  }));
  return [{ type: 'text', text: texto }, ...imagenes];
}

async function extraerContenido(res: Response): Promise<string> {
  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`LLM error ${String(res.status)}: ${detalle}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  const contenido = data.choices[0]?.message.content;
  if (contenido === undefined) {
    throw new Error('LLM: respuesta sin contenido');
  }
  return contenido;
}
