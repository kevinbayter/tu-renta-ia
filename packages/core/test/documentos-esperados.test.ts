import { describe, expect, it } from 'vitest';

import {
  rendimientosBancariosSinCertificado,
  saldosBancariosSinCertificado,
} from '../src/exogena/bancos-sin-certificado';
import { documentosEsperados } from '../src/exogena/documentos-esperados';
import { mesesTrabajadosSegunCertificados } from '../src/perfil/meses-trabajados';

import type { ExogenaParseada, FilaExogena } from '../src/exogena/tipos';

function fila(nit: string, nombre: string, detalle: string): FilaExogena {
  return { nitInformante: nit, nombreInformante: nombre, detalle, valor: 1000, usoSugerido: '', infoAdicional: '' };
}

const EXOGENA: ExogenaParseada = {
  anioGravable: 2025,
  identificacionConsultante: '1234567890',
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [
    fila('900111222', 'COMERCIAL ANDINA S.A.S.', 'Pagos por salarios (Concepto: 2276)'),
    fila('900555666', 'BANCO EJEMPLO COMPAÑIA DE FINANCIAMIENTO S.A.', 'Saldo cuentas bancarias (Titular Principal)'),
    fila('900121212', 'FIDUCIARIA EJEMPLO UNO S.A.', 'Cartera Colectiva Rendimientos Pagados (Titular Principal) (Concepto: 6)'),
    fila('900191919', 'BANCO EJEMPLO CUATRO S.A.', 'Valor total de los movimientos en cuentas corrientes y de ahorros  (Titular Principal)'),
    fila('900202020', 'BANCO EJEMPLO CINCO S.A.', 'Total consumos o gastos con tarjeta Crédito o Débito (Concepto: 1023)'),
    fila('900222222', 'FONDO DE CESANTIAS EJEMPLO', 'Valor de los intereses o rendimientos causados en el periodo (Formato del fondo de cesantías). Empleado'),
    fila('800197268', 'U.A.E. DIRECCION DE IMPUESTOS Y ADUANAS NACIONALES', 'Monto total de facturación electrónica susceptible de beneficio'),
    fila('1234567890', 'RAMIREZ ANA', 'Total saldo a favor'),
  ],
};

describe('documentosEsperados', () => {
  const esperados = documentosEsperados(EXOGENA);

  it('deriva 220 del empleador y certificados opcionales de las entidades financieras', () => {
    expect(esperados.map((e) => [e.nit, e.tipo, e.opcional])).toEqual([
      ['900111222', 'certificado_220', false],
      ['900555666', 'certificado_bancario', true],
      ['900121212', 'certificado_bancario', true],
      ['900191919', 'certificado_bancario', true],
    ]);
  });

  it('excluye a la DIAN, al propio declarante, consumos de tarjeta y fondos de cesantías', () => {
    const nits = esperados.map((e) => e.nit);
    expect(nits).not.toContain('800197268');
    expect(nits).not.toContain('1234567890');
    expect(nits).not.toContain('900202020');
    expect(nits).not.toContain('900222222');
  });
});

describe('bancos sin certificado (fallback desde exógena)', () => {
  const filas = [
    fila('900555666', 'BANCO EJEMPLO COMPAÑIA DE FINANCIAMIENTO S.A.', 'Saldo cuentas bancarias (Titular Principal)'),
    fila('900555666', 'BANCO EJEMPLO COMPAÑIA DE FINANCIAMIENTO S.A.', 'Intereses y rendimientos financieros pagados (Concepto: 5063)'),
    fila('900555666', 'BANCO EJEMPLO COMPAÑIA DE FINANCIAMIENTO S.A.', 'Retención Intereses y rendimientos financieros pagados (Concepto: 5063)'),
    fila('900777888', 'PAGOS DIGITALES SA  COMPAÑIA DE FINANCIAMIENTO', 'Saldo cuentas bancarias (Titular Principal)'),
  ];
  const exogena = { ...EXOGENA, filas };

  it('toma de la exógena solo las entidades sin certificado (sin contar retenciones)', () => {
    expect(saldosBancariosSinCertificado(exogena, ['Banco Ejemplo Compañía de Financiamiento SA'])).toEqual([
      {
        descripcion: 'PAGOS DIGITALES SA COMPAÑIA (saldo según exógena)',
        valor: 1000,
        entidad: 'PAGOS DIGITALES SA  COMPAÑIA DE FINANCIAMIENTO',
      },
    ]);
    expect(rendimientosBancariosSinCertificado(exogena, ['Banco Ejemplo Compañía de Financiamiento SA'])).toBe(0);
    expect(rendimientosBancariosSinCertificado(exogena, [])).toBe(1000);
  });
});

describe('mesesTrabajadosSegunCertificados', () => {
  it('une los períodos de varios empleadores sin contar meses dos veces', () => {
    const meses = mesesTrabajadosSegunCertificados(
      [
        { periodoInicio: '2025-01-01', periodoFin: '2025-01-31' },
        { periodoInicio: '2025-03-01', periodoFin: '2025-12-31' },
      ],
      2025,
    );
    expect(meses).toBe(11);
  });

  it('recorta períodos que desbordan el año gravable', () => {
    expect(mesesTrabajadosSegunCertificados([{ periodoInicio: '2024-06-01', periodoFin: '2026-01-15' }], 2025)).toBe(12);
  });

  it('devuelve null sin períodos válidos y los ignora si están malformados', () => {
    expect(mesesTrabajadosSegunCertificados([], 2025)).toBeNull();
    expect(mesesTrabajadosSegunCertificados([{ periodoInicio: '', periodoFin: '' }], 2025)).toBeNull();
    expect(mesesTrabajadosSegunCertificados([{ periodoInicio: 'enero', periodoFin: '2025-13-01' }], 2025)).toBeNull();
    expect(mesesTrabajadosSegunCertificados([{ periodoInicio: '2026-01-01', periodoFin: '2025-03-01' }], 2025)).toBeNull();
  });
});
