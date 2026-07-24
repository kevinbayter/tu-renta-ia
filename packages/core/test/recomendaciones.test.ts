import { describe, expect, it } from 'vitest';

import { evaluarDeclaracion } from '../src/declaracion/recomendaciones';

import type { ExogenaParseada } from '../src/exogena/tipos';

const EXOGENA: ExogenaParseada = {
  anioGravable: 2025,
  identificacionConsultante: '1234567890',
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [
    {
      nitInformante: '900111222',
      nombreInformante: 'COMERCIAL ANDINA S.A.S.',
      detalle: 'Pagos por salarios (Concepto: 2276)',
      valor: 1000,
      usoSugerido: '',
      infoAdicional: '',
    },
    {
      nitInformante: '1234567890',
      nombreInformante: 'RAMIREZ ANA',
      detalle: 'Total saldo a favor',
      valor: 1_793_000,
      usoSugerido: 'R131',
      infoAdicional: '',
    },
  ],
};

const ESTADO_COMPLETO = {
  declarante: { identificacion: '1234567890' },
  documentos: [
    { tipo: 'exogena', exogena: EXOGENA },
    { tipo: 'certificado_220', pasadasCoinciden: true, datos: { nitRetenedor: '9001112223' } },
  ],
  entrevistaCompleta: true,
  resultado: { casillas: {} },
  respuestas: { anticipoLiquidadoAnioAnterior: 0, tieneDependiente387: true },
};

describe('evaluarDeclaracion', () => {
  it('declaración completa y consistente: 100 sin críticas', () => {
    const evaluacion = evaluarDeclaracion(ESTADO_COMPLETO);
    expect(evaluacion.confiabilidad).toBe(100);
    expect(evaluacion.recomendaciones.filter((r) => r.nivel === 'critica')).toEqual([]);
  });

  it('exógena de otra persona: crítica y confiabilidad desplomada', () => {
    const estado = { ...ESTADO_COMPLETO, declarante: { identificacion: '999999999' } };
    const evaluacion = evaluarDeclaracion(estado);
    expect(evaluacion.confiabilidad).toBe(50);
    expect(evaluacion.recomendaciones[0]?.nivel).toBe('critica');
  });

  it('220 obligatorio faltante según la exógena: mejora con nombre de la entidad', () => {
    const estado = { ...ESTADO_COMPLETO, documentos: [{ tipo: 'exogena', exogena: EXOGENA }] };
    const evaluacion = evaluarDeclaracion(estado);
    const textos = evaluacion.recomendaciones.map((r) => r.texto).join(' ');
    expect(textos).toContain('COMERCIAL ANDINA');
    expect(evaluacion.confiabilidad).toBe(85);
  });

  it('anticipo igual al saldo a favor de la exógena: alerta de doble conteo', () => {
    const estado = {
      ...ESTADO_COMPLETO,
      respuestas: { anticipoLiquidadoAnioAnterior: 1_793_000, tieneDependiente387: true },
    };
    const evaluacion = evaluarDeclaracion(estado);
    expect(evaluacion.recomendaciones.some((r) => r.texto.includes('dos veces'))).toBe(true);
  });

  it('estado vacío: crítica por exógena y confiabilidad mínima honesta', () => {
    const evaluacion = evaluarDeclaracion({});
    expect(evaluacion.confiabilidad).toBe(35);
    expect(evaluacion.recomendaciones[0]?.nivel).toBe('critica');
  });
});
