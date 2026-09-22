import { describe, expect, it, vi } from 'vitest';

import { extraerValidado } from '../src/llm/extraer-validado';

import type { Validador } from '../src/llm/extraer-validado';
import type { LlmPort } from '../src/puertos/llm-port';

const SOLO_CAMPO_VALIDO: Validador<{ campo: 'deudas' }> = {
  safeParse: (valor) =>
    (valor as { campo?: string }).campo === 'deudas'
      ? { success: true, data: { campo: 'deudas' } }
      : { success: false, error: { issues: [{ path: ['campo'], message: 'Invalid option: expected "deudas"' }] } },
};

function llmQueResponde(...respuestas: unknown[]): { llm: LlmPort; extraer: ReturnType<typeof vi.fn> } {
  const extraer = vi.fn();
  respuestas.forEach((r) => extraer.mockResolvedValueOnce(r));
  return { llm: { extraerEstructurado: extraer, conversar: vi.fn() }, extraer };
}

const ENTRADA = { system: 'Extrae', user: 'texto', jsonSchema: {} };

describe('extracción validada contra el esquema', () => {
  it('si la primera respuesta es válida no vuelve a llamar al modelo', async () => {
    const { llm, extraer } = llmQueResponde({ campo: 'deudas' });
    await expect(extraerValidado(llm, ENTRADA, SOLO_CAMPO_VALIDO)).resolves.toEqual({ campo: 'deudas' });
    expect(extraer).toHaveBeenCalledTimes(1);
  });

  it('si el modelo inventa un campo, le devuelve el error exacto y acepta la corrección', async () => {
    const { llm, extraer } = llmQueResponde({ campo: 'eventoInventado' }, { campo: 'deudas' });
    await expect(extraerValidado(llm, ENTRADA, SOLO_CAMPO_VALIDO)).resolves.toEqual({ campo: 'deudas' });
    const segunda = extraer.mock.calls[1]?.[0] as { system: string };
    expect(segunda.system).toContain('campo: Invalid option');
  });

  it('si tampoco corrige, falla con un mensaje apto para el usuario (sin volcado técnico)', async () => {
    const { llm } = llmQueResponde({ campo: 'x' }, { campo: 'y' });
    await expect(extraerValidado(llm, ENTRADA, SOLO_CAMPO_VALIDO)).rejects.toThrow('Intenta de nuevo');
  });
});
