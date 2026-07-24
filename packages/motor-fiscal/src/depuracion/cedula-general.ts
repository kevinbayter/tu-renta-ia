import { calcularDependientesAdicionales, calcularFacturaElectronica, calcularLimiteGlobal } from './limites';
import { depurarNoLaborales } from './no-laborales';
import { depurarRentasCapital } from './rentas-capital';
import { depurarRentasTrabajo } from './rentas-trabajo';

import type { DepuracionCapital } from './rentas-capital';
import type { DepuracionTrabajo } from './rentas-trabajo';
import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoCedulaGeneral } from '../modelo/resultado';
import type { PerfilFiscal } from '../modelo/tipos';

type DepuracionNoLaborales = ReturnType<typeof depurarNoLaborales>;

export function depurarCedulaGeneral(perfil: PerfilFiscal, c: ConstantesAnio): ResultadoCedulaGeneral {
  const trabajo = depurarRentasTrabajo(perfil.certificadosLaborales, perfil.deducciones, c);
  const capital = depurarRentasCapital(perfil.rentasCapital, c);
  const noLaborales = depurarNoLaborales(perfil.rentasNoLaborales);
  // Base del 40% (art. 336-4): ingresos − INCRNGO − costos y gastos procedentes.
  const limiteGlobal = calcularLimiteGlobal(
    trabajo.ingresosBrutos + capital.ingresosBrutos + noLaborales.ingresosBrutos,
    trabajo.incrngo + capital.incrngoComponenteInflacionario + noLaborales.costosYGastos,
    c,
  );
  const asignaciones = asignarLimite(trabajo, capital, limiteGlobal);
  const fueraDeLimite = calcularFueraDeLimite(perfil, c);
  return consolidar(trabajo, capital, noLaborales, limiteGlobal, asignaciones, fueraDeLimite);
}

interface Asignaciones {
  trabajo: number;
  capital: number;
}

interface FueraDeLimite {
  facturaElectronica: number;
  dependientesAdicionales: number;
}

/** Asignación secuencial del cupo del límite: primero trabajo, remanente a capital. */
function asignarLimite(
  trabajo: DepuracionTrabajo,
  capital: DepuracionCapital,
  limiteGlobal: number,
): Asignaciones {
  const aTrabajo = Math.min(trabajo.solicitadoExentasYDeducciones, limiteGlobal);
  const aCapital = Math.min(capital.solicitadoExentasYDeducciones, limiteGlobal - aTrabajo);
  return { trabajo: aTrabajo, capital: aCapital };
}

function calcularFueraDeLimite(perfil: PerfilFiscal, c: ConstantesAnio): FueraDeLimite {
  return {
    facturaElectronica: calcularFacturaElectronica(perfil.comprasFacturaElectronica, c),
    dependientesAdicionales: calcularDependientesAdicionales(
      perfil.deducciones.dependientesAdicionales336,
      c,
    ),
  };
}

function conLimiteAplicado<T extends { rentaLiquida: number }>(
  subcedula: T,
  asignado: number,
): T & { asignadoLimitado: number; rentaLiquidaOrdinaria: number } {
  return {
    ...subcedula,
    asignadoLimitado: asignado,
    rentaLiquidaOrdinaria: subcedula.rentaLiquida - asignado,
  };
}

function consolidar(
  trabajo: DepuracionTrabajo,
  capital: DepuracionCapital,
  noLaborales: DepuracionNoLaborales,
  limiteGlobal: number,
  asignaciones: Asignaciones,
  fuera: FueraDeLimite,
): ResultadoCedulaGeneral {
  const rentaLiquidaCedula = trabajo.rentaLiquida + capital.rentaLiquida + noLaborales.rentaLiquida;
  const totalConFuera =
    asignaciones.trabajo + asignaciones.capital + fuera.facturaElectronica + fuera.dependientesAdicionales;
  return {
    trabajo: conLimiteAplicado(trabajo, asignaciones.trabajo),
    capital: conLimiteAplicado(capital, asignaciones.capital),
    noLaborales: conLimiteAplicado(noLaborales, 0),
    rentaLiquidaCedula,
    limiteGlobal,
    deduccionFacturaElectronica: fuera.facturaElectronica,
    deduccionDependientesAdicionales: fuera.dependientesAdicionales,
    totalExentasYDeduccionesConFueraDeLimite: totalConFuera,
    rentaLiquidaGravable: Math.max(0, rentaLiquidaCedula - totalConFuera),
  };
}
