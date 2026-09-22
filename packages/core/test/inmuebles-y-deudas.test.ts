import { describe, expect, it } from 'vitest';

import { deudasReportadas, inmueblesReportados } from '../src/exogena/inmuebles-y-deudas';
import { precargarDesdeExogena } from '../src/exogena/precarga';

import type { ExogenaParseada, FilaExogena } from '../src/exogena/tipos';

function fila(detalle: string, valor: number, infoAdicional = '', nombreInformante = 'BOGOTA DISTRITO CAPITAL'): FilaExogena {
  return { nitInformante: '899999061', nombreInformante, detalle, valor, usoSugerido: '', infoAdicional };
}

const EXOGENA: ExogenaParseada = {
  anioGravable: 2025,
  identificacionConsultante: '23456789',
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [
    fila('Valor base del impuesto predial (Concepto: 1476)', 150_000_008, 'Matricula: 050C0000001 | Número Propietarios: 1'),
    fila('Valor avalúo catastral (Concepto: 1476)', 150_000_008, 'Matricula: 050C0000001 | Número Propietarios: 1'),
    fila('Valor avalúo catastral (Concepto: 1476)', 90_000_000, 'Matricula: 050S0000002 | Número Propietarios: 1'),
    fila('Cuentas por pagar de clientes (Concepto: 1315)', 12_000_000, '', 'BANCO EJEMPLO S.A. -'),
    fila('Saldo cuentas bancarias (Titular Principal)', 5_000_000, '', 'BANCO EJEMPLO S.A.'),
  ],
};

describe('patrimonio que la exógena ya conoce', () => {
  it('un inmueble por matrícula aunque llegue como avalúo y como base del predial', () => {
    expect(inmueblesReportados(EXOGENA).map((i) => [i.matricula, i.valor])).toEqual([
      ['050C0000001', 150_000_008],
      ['050S0000002', 90_000_000],
    ]);
  });

  it('las deudas son las de los acreedores, no los saldos de cuentas', () => {
    expect(deudasReportadas(EXOGENA)).toEqual([{ acreedor: 'BANCO EJEMPLO S.A.', valor: 12_000_000 }]);
  });

  it('la entrevista recibe inmuebles y deudas para ofrecerlos, no para asumirlos', () => {
    const { resumen } = precargarDesdeExogena(EXOGENA);
    expect(resumen).toContain('INMUEBLES SEGÚN LA EXÓGENA');
    expect(resumen).toContain('050S0000002');
    expect(resumen).toContain('DEUDAS SEGÚN LA EXÓGENA');
  });
});
