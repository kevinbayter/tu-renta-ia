import { describe, expect, it } from 'vitest';

import { evaluarDeclaracion } from '../src/declaracion/recomendaciones';
import { ingresosNoLaboralesReportados } from '../src/exogena/no-laborales';
import { precargarDesdeExogena } from '../src/exogena/precarga';

import type { ExogenaParseada, FilaExogena } from '../src/exogena/tipos';

function filaMandato(nit: string, nombre: string, valor: number): FilaExogena {
  return {
    nitInformante: nit,
    nombreInformante: nombre,
    detalle: 'Ingresos brutos Mandato (Concepto: 4040)',
    valor,
    usoSugerido: 'Tope 1: Ingresos brutos | R74 Ingresos brutos rentas no laborales',
    infoAdicional: '',
  };
}

// El caso real de la titular: el MISMO arriendo reportado por el pagador y por la inmobiliaria.
const EXOGENA_MANDATO: ExogenaParseada = {
  anioGravable: 2025,
  identificacionConsultante: '23456789',
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [
    filaMandato('900262626', 'GOMEZ TORRES CARLOS', 16_180_000),
    filaMandato('900252525', 'INMOBILIARIA EJEMPLO S.A.S.', 16_180_000),
  ],
};

describe('ingresosNoLaboralesReportados — deduplicación de mandato', () => {
  it('el mismo valor de informantes distintos cuenta UNA vez y queda marcado', () => {
    const r = ingresosNoLaboralesReportados(EXOGENA_MANDATO);
    expect(r.total).toBe(16_180_000);
    expect(r.duplicados).toHaveLength(1);
    expect(r.duplicados[0]?.informantes).toContain('INMOBILIARIA EJEMPLO S.A.S.');
  });

  it('valores distintos SÍ se suman (son ingresos diferentes)', () => {
    const exogena = {
      ...EXOGENA_MANDATO,
      filas: [
        filaMandato('900262626', 'GOMEZ TORRES CARLOS', 16_180_000),
        filaMandato('900252525', 'INMOBILIARIA EJEMPLO S.A.S.', 9_000_000),
      ],
    };
    const r = ingresosNoLaboralesReportados(exogena);
    expect(r.total).toBe(25_180_000);
    expect(r.duplicados).toHaveLength(0);
  });

  it('ignora retenciones y exógenas sin rentas no laborales', () => {
    const sinNoLaborales = { ...EXOGENA_MANDATO, filas: [] };
    expect(ingresosNoLaboralesReportados(sinNoLaborales).total).toBe(0);
  });
});

describe('precarga y recomendaciones de no laborales', () => {
  it('la precarga deja el total deduplicado en las respuestas y lo explica en el resumen', () => {
    const precarga = precargarDesdeExogena(EXOGENA_MANDATO);
    expect(precarga.respuestas.ingresosNoLaborales).toBe(16_180_000);
    expect(precarga.resumen).toContain('NO laborales');
    expect(precarga.resumen).toContain('UNA sola vez');
  });

  it('la exógena reporta no laborales y la declaración va en $0: crítica', () => {
    const estado = {
      declarante: { identificacion: '23456789' },
      documentos: [{ tipo: 'exogena', exogena: EXOGENA_MANDATO }],
      entrevistaCompleta: true,
      resultado: { casillas: {} },
      respuestas: { anticipoLiquidadoAnioAnterior: 0, tieneDependiente387: true, ingresosNoLaborales: 0 },
    };
    const evaluacion = evaluarDeclaracion(estado);
    const critica = evaluacion.recomendaciones.find((r) => r.texto.includes('no laborales'));
    expect(critica?.nivel).toBe('critica');
    expect(critica?.texto).toContain('16.180.000');
  });

  it('con los ingresos confirmados, la crítica desaparece', () => {
    const estado = {
      declarante: { identificacion: '23456789' },
      documentos: [{ tipo: 'exogena', exogena: EXOGENA_MANDATO }],
      entrevistaCompleta: true,
      resultado: { casillas: {} },
      respuestas: { anticipoLiquidadoAnioAnterior: 0, tieneDependiente387: true, ingresosNoLaborales: 16_180_000 },
    };
    const evaluacion = evaluarDeclaracion(estado);
    expect(evaluacion.recomendaciones.some((r) => r.texto.includes('no laborales'))).toBe(false);
  });
});
