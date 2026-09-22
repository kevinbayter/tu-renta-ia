import { describe, expect, it } from 'vitest';

import type { CertificadoBancarioExtraido } from '@turenta/shared';

import { coincideEntidad } from '../src/exogena/bancos-sin-certificado';
import { consolidarPorEntidad } from '../src/perfil/consolidar-bancarios';


function certificado(entidad: string, cambios: Partial<CertificadoBancarioExtraido> = {}): CertificadoBancarioExtraido {
  return {
    tipoDocumento: 'certificado_bancario',
    entidad,
    anioGravable: 2025,
    saldoCuentas: 0,
    rendimientos: 0,
    gmf: 0,
    retencionFuente: 0,
    componenteInflacionarioInformado: 0,
    ...cambios,
  };
}

describe('varios certificados del mismo banco', () => {
  it('el de retención repite los rendimientos del de saldos: cuentan una sola vez', () => {
    const saldos = certificado('BBVA Colombia', { saldoCuentas: 19_842_608, rendimientos: 1_156 });
    const retencion = certificado('BANCO BILBAO VIZCAYA ARGENTARIA COLOMBIA S.A', { rendimientos: 1_156 });
    const [unico, ...resto] = consolidarPorEntidad([saldos, retencion]);
    expect(resto).toHaveLength(0);
    expect(unico).toMatchObject({ saldoCuentas: 19_842_608, rendimientos: 1_156, retencionFuente: 0 });
  });

  it('bancos distintos se conservan por separado', () => {
    const consolidados = consolidarPorEntidad([
      certificado('Bancolombia', { rendimientos: 10_000 }),
      certificado('Davivienda', { rendimientos: 20_000 }),
    ]);
    expect(consolidados.map((c) => c.rendimientos)).toEqual([10_000, 20_000]);
  });

  it('la sigla BBVA identifica al banco aunque el certificado use la razón social', () => {
    expect(coincideEntidad('BBVA Colombia', 'BANCO BILBAO VIZCAYA ARGENTARIA COLOMBIA S.A')).toBe(true);
    expect(coincideEntidad('BBVA Colombia', 'BANCO CAJA SOCIAL S.A.')).toBe(false);
  });
});
