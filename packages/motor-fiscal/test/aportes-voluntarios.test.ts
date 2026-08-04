import { describe, expect, it } from 'vitest';

import { AG2025 } from '../src/constantes/ag2025';
import { depurarRentasTrabajo } from '../src/depuracion/rentas-trabajo';

import type { CertificadoLaboral, DeduccionesInput } from '../src/modelo/tipos';

/**
 * Respaldo: normativa/ag2025/08-afc-pension-voluntaria-salud.md
 * — art. 55 (INCRNGO 25% / 2.500 UVT), arts. 126-1/126-4 (exenta 30% / 3.800 UVT).
 * Cifras calculadas a mano con UVT 2025 = $49.799.
 */

const SIN_DEDUCCIONES: DeduccionesInput = {
  mesesConRelacionLaboral: 12,
  tieneDependiente387: false,
  dependientesAdicionales336: 0,
  pagosMedicinaPrepagada: 0,
  interesesVivienda: 0,
  interesesIcetex: 0,
};

function certificado(pagos: number): CertificadoLaboral {
  return {
    nitEmpleador: '900000000',
    pagosLaborales: pagos,
    cesantiasPagadas: 0,
    cesantiasConsignadas: 0,
    aportesSalud: 0,
    aportesPension: 0,
    retencionFuente: 0,
    ingresoPromedioSeisMeses: pagos / 12,
  };
}

describe('aporte voluntario al RAIS (art. 55, INCRNGO)', () => {
  it('reconoce el aporte completo cuando cabe en el 25% del ingreso', () => {
    // Ingreso 120.000.000 → 25% = 30.000.000; aporte 20.000.000 pasa completo.
    const d = depurarRentasTrabajo([certificado(120_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 0,
      voluntarioPensionObligatoria: 20_000_000,
    });
    expect(d.incrngoAporteVoluntarioRais).toBe(20_000_000);
    expect(d.incrngo).toBe(20_000_000);
    expect(d.rentaLiquida).toBe(100_000_000);
  });

  it('limita al 25% del ingreso bruto', () => {
    // Ingreso 120.000.000 → tope 30.000.000 aunque aportó 40.000.000.
    const d = depurarRentasTrabajo([certificado(120_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 0,
      voluntarioPensionObligatoria: 40_000_000,
    });
    expect(d.incrngoAporteVoluntarioRais).toBe(30_000_000);
  });

  it('limita a 2.500 UVT anuales', () => {
    // 2.500 × 49.799 = 124.497.500 → redondeado a miles: 124.498.000... el tope se
    // compara sin redondear y el resultado se redondea: min(150M, 25%×600M=150M, 124.497.500).
    const d = depurarRentasTrabajo([certificado(600_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 0,
      voluntarioPensionObligatoria: 150_000_000,
    });
    expect(d.incrngoAporteVoluntarioRais).toBe(124_498_000);
  });

  it('ignora aportes negativos', () => {
    const d = depurarRentasTrabajo([certificado(50_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 0,
      voluntarioPensionObligatoria: -5_000_000,
    });
    expect(d.incrngoAporteVoluntarioRais).toBe(0);
  });
});

describe('AFC y pensión voluntaria (arts. 126-1/126-4, renta exenta)', () => {
  it('reconoce el aporte completo cuando cabe en el 30% del ingreso', () => {
    // Ingreso 120.000.000 → 30% = 36.000.000; aporte 30.000.000 pasa completo.
    const d = depurarRentasTrabajo([certificado(120_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 30_000_000,
      voluntarioPensionObligatoria: 0,
    });
    expect(d.afcExenta).toBe(30_000_000);
  });

  it('limita al 30% del ingreso y a 3.800 UVT', () => {
    const treintaPorCiento = depurarRentasTrabajo([certificado(120_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 50_000_000,
      voluntarioPensionObligatoria: 0,
    });
    expect(treintaPorCiento.afcExenta).toBe(36_000_000);
    // 3.800 × 49.799 = 189.236.200 → min(250M, 30%×900M=270M, 189.236.200) redondeado.
    const topeUvt = depurarRentasTrabajo([certificado(900_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 250_000_000,
      voluntarioPensionObligatoria: 0,
    });
    expect(topeUvt.afcExenta).toBe(189_236_000);
  });

  it('la exenta del 25% se calcula DESPUÉS de restar la AFC (orden del 206-10)', () => {
    // Ingreso 100.000.000, AFC 20.000.000:
    // base 25% = 100.000.000 − 20.000.000 = 80.000.000 → 25% = 20.000.000.
    const d = depurarRentasTrabajo([certificado(100_000_000)], SIN_DEDUCCIONES, AG2025, {
      afcYPensionVoluntaria: 20_000_000,
      voluntarioPensionObligatoria: 0,
    });
    expect(d.exenta25).toBe(20_000_000);
    expect(d.totalRentasExentas).toBe(40_000_000);
    // Sin AFC, el 25% habría sido 25.000.000: la AFC no se cuenta doble.
    const sinAfc = depurarRentasTrabajo([certificado(100_000_000)], SIN_DEDUCCIONES, AG2025);
    expect(sinAfc.exenta25).toBe(25_000_000);
  });

  it('sin aportes todo queda en cero y nada cambia frente al comportamiento previo', () => {
    const d = depurarRentasTrabajo([certificado(80_000_000)], SIN_DEDUCCIONES, AG2025);
    expect(d.afcExenta).toBe(0);
    expect(d.incrngoAporteVoluntarioRais).toBe(0);
  });
});
