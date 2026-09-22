import { describe, expect, it, vi } from 'vitest';

import type { LlmPort } from '@turenta/core';

import { ExtractorCertificados } from '../src/extraccion/certificados/extractor-certificados';


function lectura(gmf: number) {
  return {
    tipoDocumento: 'certificado_bancario',
    entidad: 'BBVA Colombia',
    anioGravable: 2025,
    saldoCuentas: 19_842_608,
    rendimientos: 1_156,
    gmf,
    retencionFuente: 0,
    componenteInflacionarioInformado: 640,
  };
}

function extractorQueLee(...lecturas: unknown[]) {
  const extraer = vi.fn();
  lecturas.forEach((l) => extraer.mockResolvedValueOnce(l));
  const llm: LlmPort = { extraerEstructurado: extraer, conversar: vi.fn() };
  return { extractor: new ExtractorCertificados(llm), extraer };
}

const DOC = { texto: 'CERTIFICADO DE SALDOS E INTERESES BBVA 2025' };

describe('doble lectura con desempate', () => {
  it('si coinciden, no hace una tercera lectura', async () => {
    const { extractor, extraer } = extractorQueLee(lectura(0), lectura(0));
    const r = await extractor.extraerBancario(DOC);
    expect(r.pasadasCoinciden).toBe(true);
    expect(extraer).toHaveBeenCalledTimes(2);
  });

  it('una primera lectura equivocada pierde por mayoría (caso real: rendimientos leídos como GMF)', async () => {
    const { extractor, extraer } = extractorQueLee(lectura(1_156), lectura(0), lectura(0));
    const r = await extractor.extraerBancario(DOC);
    expect(r.datos.gmf).toBe(0);
    expect(r.pasadasCoinciden).toBe(true);
    expect(extraer).toHaveBeenCalledTimes(3);
  });

  it('sin mayoría, la discrepancia sigue marcada para el usuario', async () => {
    const { extractor } = extractorQueLee(lectura(1_156), lectura(0), lectura(500));
    const r = await extractor.extraerBancario(DOC);
    expect(r.pasadasCoinciden).toBe(false);
    expect(r.discrepancias[0]).toContain('gmf');
  });
});
