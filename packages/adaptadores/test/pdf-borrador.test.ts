import { describe, expect, it } from 'vitest';

import { liquidarDeclaracion } from '@turenta/motor-fiscal';
import type { PerfilFiscal } from '@turenta/motor-fiscal';

import { generarPdfBorrador210 } from '../src/generacion/pdf-borrador-210';


const PERFIL_MINIMO: PerfilFiscal = {
  anioGravable: 2025,
  certificadosLaborales: [
    {
      nitEmpleador: '900000000',
      pagosLaborales: 100_000_000,
      cesantiasPagadas: 0,
      cesantiasConsignadas: 0,
      aportesSalud: 4_000_000,
      aportesPension: 4_000_000,
      retencionFuente: 2_000_000,
      ingresoPromedioSeisMeses: 8_000_000,
    },
  ],
  rentasCapital: { rendimientosConComponente: 0, rendimientosSinComponente: 0, gmfPagado: 0, retencionFuente: 0 },
  deducciones: {
    mesesConRelacionLaboral: 12,
    tieneDependiente387: false,
    dependientesAdicionales336: 0,
    pagosMedicinaPrepagada: 0,
    interesesVivienda: 0,
    interesesIcetex: 0,
  },
  comprasFacturaElectronica: 0,
  patrimonio: { activos: [{ descripcion: 'Cuenta', valor: 10_000_000 }], deudas: 0 },
  historial: {
    declaracionesPrevias: 0,
    impuestoNetoAnioAnterior: 0,
    saldoFavorAnioAnterior: 0,
    anticipoLiquidadoAnioAnterior: 0,
  },
};

describe('generador PDF borrador 210', () => {
  it('genera un PDF válido con múltiples páginas de casillas', async () => {
    const resultado = liquidarDeclaracion(PERFIL_MINIMO);
    const pdf = await generarPdfBorrador210(
      {
        nombres: 'María José',
        apellidos: 'Pérez Ñáñez',
        identificacion: '1234567890',
        fechaVencimiento: '2026-10-19',
      },
      resultado,
    );
    expect(pdf.length).toBeGreaterThan(2_000);
    const cabecera = String.fromCharCode(...pdf.slice(0, 5));
    expect(cabecera).toBe('%PDF-');
  });
});
