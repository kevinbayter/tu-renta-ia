import { describe, expect, it } from 'vitest';
import { utils, write } from 'xlsx';

import { parsearExogena } from '../src/extraccion/exogena/parser-exogena';

/** Construye en memoria un XLSX con la estructura real del reporte de exógena DIAN. */
function construirExogenaSintetica(): Uint8Array {
  const filas: (string | number)[][] = [
    ['', '', 'Consulta de Información reportada por terceros'],
    ['Año al que se refiere la consulta:', '', 2025],
    ['Identificación:', '', 1234567890],
    ['Persona que reporta', '', 'Información reportada'],
    ['NIT', 'Nombre / Razón Social', 'NIT', 'Nombre', 'Detalle', 'Valor', 'Uso', 'Info'],
    ['', '', '', '', 'Tope 1 - Ingresos', 114456920],
    ['', '', '', '', 'Tope 2 - Patrimonio', 45053000],
    ['', '', '', '', 'Tope 3 - Consumo TC', 42112060],
    ['', '', '', '', 'Tope 4 - Movimiento', 143226272],
    ['', '', '', '', 'Tope 5 - Compras', 44694376],
    [
      '900111222',
      'COMERCIAL ANDINA S.A.S.',
      '1234567890',
      'RAMIREZ ANA',
      'Pagos por salarios (Concepto: 2276)',
      52926000,
      'Tope 1: Ingresos brutos | R32 Ingresos brutos por rentas de trabajo (art. 103 E.T.)',
      '',
    ],
    [
      '1234567890',
      'RAMIREZ ANA',
      '1234567890',
      'RAMIREZ ANA',
      'Total saldo a favor',
      1793000,
      'R131 Saldo a favor del año gravable anterior',
      '',
    ],
    [
      '800197268',
      'U.A.E. DIRECCION DE IMPUESTOS Y ADUANAS NACIONALES',
      '1234567890',
      'RAMIREZ ANA',
      'Monto total de facturación electrónica susceptible de beneficio',
      39680528,
      '',
      '',
    ],
  ];
  const hoja = utils.aoa_to_sheet(filas);
  const libro = utils.book_new();
  utils.book_append_sheet(libro, hoja, 'Reporte');
  return new Uint8Array(write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('parser de exógena (determinista)', () => {
  it('extrae año, topes y filas de terceros', () => {
    const exogena = parsearExogena(construirExogenaSintetica());
    expect(exogena.anioGravable).toBe(2025);
    expect(exogena.topes).toEqual({
      ingresos: 114_456_920,
      patrimonio: 45_053_000,
      consumoTarjetas: 42_112_060,
      movimientos: 143_226_272,
      compras: 44_694_376,
    });
    expect(exogena.filas).toHaveLength(3);
  });

  it('estructura cada fila con detalle, valor y uso sugerido', () => {
    const exogena = parsearExogena(construirExogenaSintetica());
    const salarios = exogena.filas.find((f) => f.detalle.includes('Pagos por salarios'));
    expect(salarios).toMatchObject({
      nitInformante: '900111222',
      valor: 52_926_000,
    });
    expect(salarios?.usoSugerido).toContain('R32');
  });

  it('rechaza archivos sin hojas válidas', () => {
    expect(() => parsearExogena(new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0]))).toThrow();
  });
});
