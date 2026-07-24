import { calcularDependientesAdicionales, calcularFacturaElectronica, calcularLimiteGlobal } from './limites';
import { depurarRentasCapital } from './rentas-capital';
import { depurarRentasTrabajo } from './rentas-trabajo';

import type { DepuracionCapital } from './rentas-capital';
import type { DepuracionTrabajo } from './rentas-trabajo';
import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoCedulaGeneral } from '../modelo/resultado';
import type { PerfilFiscal } from '../modelo/tipos';

export function depurarCedulaGeneral(perfil: PerfilFiscal, c: ConstantesAnio): ResultadoCedulaGeneral {
  const trabajo = depurarRentasTrabajo(perfil.certificadosLaborales, perfil.deducciones, c);
  const capital = depurarRentasCapital(perfil.rentasCapital, c);
  const limiteGlobal = calcularLimiteGlobal(
    trabajo.ingresosBrutos + capital.ingresosBrutos,
    trabajo.incrngo + capital.incrngoComponenteInflacionario,
    c,
  );
  const asignaciones = asignarLimite(trabajo, capital, limiteGlobal);
  const fueraDeLimite = calcularFueraDeLimite(perfil, c);
  return consolidar(trabajo, capital, limiteGlobal, asignaciones, fueraDeLimite);
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
  limiteGlobal: number,
  asignaciones: Asignaciones,
  fuera: FueraDeLimite,
): ResultadoCedulaGeneral {
  const rentaLiquidaCedula = trabajo.rentaLiquida + capital.rentaLiquida;
  const totalConFuera =
    asignaciones.trabajo + asignaciones.capital + fuera.facturaElectronica + fuera.dependientesAdicionales;
  return {
    trabajo: conLimiteAplicado(trabajo, asignaciones.trabajo),
    capital: conLimiteAplicado(capital, asignaciones.capital),
    rentaLiquidaCedula,
    limiteGlobal,
    deduccionFacturaElectronica: fuera.facturaElectronica,
    deduccionDependientesAdicionales: fuera.dependientesAdicionales,
    totalExentasYDeduccionesConFueraDeLimite: totalConFuera,
    rentaLiquidaGravable: Math.max(0, rentaLiquidaCedula - totalConFuera),
  };
}
