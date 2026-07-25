import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { liquidarDeclaracion } from '@turenta/motor-fiscal';
import type { PerfilFiscal } from '@turenta/motor-fiscal';

import { generarBorradorCompleto } from '../src/generacion/borrador-completo';
import { calcularDigitoVerificacion } from '../src/generacion/formulario210/generar-formulario-210';


const PLANTILLA = new Uint8Array(
  readFileSync(join(import.meta.dirname, '../plantillas/formulario-210-ag2025.pdf')),
);

const PERFIL: PerfilFiscal = {
  anioGravable: 2025,
  certificadosLaborales: [
    {
      nitEmpleador: '900111222',
      pagosLaborales: 84_050_000,
      cesantiasPagadas: 5_535_000,
      cesantiasConsignadas: 6_156_000,
      aportesSalud: 2_126_000,
      aportesPension: 2_638_000,
      retencionFuente: 386_000,
      ingresoPromedioSeisMeses: 6_403_000,
    },
    {
      nitEmpleador: '900333444',
      pagosLaborales: 17_493_000,
      cesantiasPagadas: 0,
      cesantiasConsignadas: 0,
      aportesSalud: 631_000,
      aportesPension: 789_000,
      retencionFuente: 396_000,
      ingresoPromedioSeisMeses: 7_885_000,
    },
  ],
  rentasCapital: {
    rendimientosConComponente: 792_376,
    rendimientosSinComponente: 382_694,
    gmfPagado: 34_913,
    retencionFuente: 42_541,
  },
  deducciones: {
    mesesConRelacionLaboral: 11,
    tieneDependiente387: true,
    dependientesAdicionales336: 1,
    pagosMedicinaPrepagada: 3_199_749,
    interesesVivienda: 0,
    interesesIcetex: 0,
  },
  comprasFacturaElectronica: 39_680_528,
  patrimonio: {
    activos: [
      { descripcion: 'Bienes personales', valor: 24_500_000 },
      { descripcion: 'Ejemplo Dos', valor: 6_909 },
      { descripcion: 'Nu', valor: 20_902_486 },
      { descripcion: 'FIC Ejemplo Dos', valor: 15_205 },
      { descripcion: 'Fondo Uno', valor: 1_467_428 },
      { descripcion: 'Comisionista', valor: 682_355 },
      { descripcion: 'CxC APT', valor: 20_900_000 },
      { descripcion: 'CxC saldo DIAN', valor: 1_401_000 },
    ],
    deudas: 0,
  },
  historial: {
    declaracionesPrevias: 2,
    impuestoNetoAnioAnterior: 0,
    saldoFavorAnioAnterior: 1_793_000,
    anticipoLiquidadoAnioAnterior: 0,
  },
};

describe('formulario 210 fiel (plantilla oficial DIAN)', () => {
  it('genera el borrador completo: formulario oficial + resumen', async () => {
    const resultado = liquidarDeclaracion(PERFIL);
    const pdf = await generarBorradorCompleto(
      PLANTILLA,
      { nombres: 'Ana', apellidos: 'Ramírez', identificacion: '1234567890', fechaVencimiento: '2026-09-24' },
      resultado,
    );
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(100_000);
    // Artefacto para calibración visual manual
    writeFileSync('/tmp/borrador-fiel.pdf', pdf);
  });

  it('calcula el dígito de verificación DIAN', () => {
    expect(calcularDigitoVerificacion('1234567890')).toBe('2');
    expect(calcularDigitoVerificacion('900111222')).toBe('1');
    expect(calcularDigitoVerificacion('900333444')).toBe('0');
  });
});
