import { depurarHonorarios } from './honorarios';
import { calcularDependientesAdicionales, calcularFacturaElectronica, calcularLimiteGlobal } from './limites';
import { depurarNoLaborales } from './no-laborales';
import { depurarRentasCapital } from './rentas-capital';
import { depurarRentasTrabajo } from './rentas-trabajo';

import type { DepuracionHonorarios, ModoHonorarios } from './honorarios';
import type { DepuracionCapital } from './rentas-capital';
import type { DepuracionTrabajo } from './rentas-trabajo';
import type { ConstantesAnio } from '../constantes/tipos';
import type { ResultadoCedulaGeneral } from '../modelo/resultado';
import type { PerfilFiscal } from '../modelo/tipos';

type DepuracionNoLaborales = ReturnType<typeof depurarNoLaborales>;

/**
 * Con honorarios se liquida la cédula COMPLETA en ambos modos del art. 336-4
 * (costos procedentes vs renta exenta del 25%) y gana el de menor renta líquida
 * gravable; en empate gana costos porque no consume el límite del 40%.
 */
export function depurarCedulaGeneral(perfil: PerfilFiscal, c: ConstantesAnio): ResultadoCedulaGeneral {
  const conCostos = depurarModo(perfil, c, 'costos');
  if ((perfil.honorarios?.ingresos ?? 0) <= 0) {
    return conCostos;
  }
  const conExenta = depurarModo(perfil, c, 'renta_exenta_25');
  return conExenta.rentaLiquidaGravable < conCostos.rentaLiquidaGravable ? conExenta : conCostos;
}

function depurarModo(perfil: PerfilFiscal, c: ConstantesAnio, modo: ModoHonorarios): ResultadoCedulaGeneral {
  const trabajo = depurarRentasTrabajo(perfil.certificadosLaborales, perfil.deducciones, c, perfil.aportesVoluntarios);
  const honorarios = depurarHonorarios(perfil.honorarios, modo, trabajo.exenta25, c);
  const capital = depurarRentasCapital(perfil.rentasCapital, c);
  const noLaborales = depurarNoLaborales(perfil.rentasNoLaborales);
  // Base del 40% (art. 336-4): ingresos − INCRNGO − costos y gastos procedentes.
  const limiteGlobal = calcularLimiteGlobal(
    trabajo.ingresosBrutos + honorarios.ingresosBrutos + capital.ingresosBrutos + noLaborales.ingresosBrutos,
    trabajo.incrngo + honorarios.incrngo + honorarios.costos + capital.incrngoComponenteInflacionario + noLaborales.costosYGastos,
    c,
  );
  const asignaciones = asignarLimite(trabajo, honorarios, capital, limiteGlobal);
  const fuera = calcularFueraDeLimite(perfil, c);
  return consolidar({ trabajo, honorarios, capital, noLaborales, limiteGlobal, asignaciones, fuera });
}

interface Asignaciones {
  trabajo: number;
  honorarios: number;
  capital: number;
}

interface FueraDeLimite {
  facturaElectronica: number;
  dependientesAdicionales: number;
}

/** Asignación secuencial del cupo del límite: trabajo → honorarios → capital. */
function asignarLimite(
  trabajo: DepuracionTrabajo,
  honorarios: DepuracionHonorarios,
  capital: DepuracionCapital,
  limiteGlobal: number,
): Asignaciones {
  const aTrabajo = Math.min(trabajo.solicitadoExentasYDeducciones, limiteGlobal);
  const aHonorarios = Math.min(honorarios.solicitadoExentasYDeducciones, limiteGlobal - aTrabajo);
  const aCapital = Math.min(capital.solicitadoExentasYDeducciones, limiteGlobal - aTrabajo - aHonorarios);
  return { trabajo: aTrabajo, honorarios: aHonorarios, capital: aCapital };
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

interface Piezas {
  trabajo: DepuracionTrabajo;
  honorarios: DepuracionHonorarios;
  capital: DepuracionCapital;
  noLaborales: DepuracionNoLaborales;
  limiteGlobal: number;
  asignaciones: Asignaciones;
  fuera: FueraDeLimite;
}

function consolidar(p: Piezas): ResultadoCedulaGeneral {
  const rentaLiquidaCedula =
    p.trabajo.rentaLiquida + p.honorarios.rentaLiquida + p.capital.rentaLiquida + p.noLaborales.rentaLiquida;
  const totalConFuera =
    p.asignaciones.trabajo +
    p.asignaciones.honorarios +
    p.asignaciones.capital +
    p.fuera.facturaElectronica +
    p.fuera.dependientesAdicionales;
  return {
    trabajo: conLimiteAplicado(p.trabajo, p.asignaciones.trabajo),
    honorarios: conLimiteAplicado(p.honorarios, p.asignaciones.honorarios),
    capital: conLimiteAplicado(p.capital, p.asignaciones.capital),
    noLaborales: conLimiteAplicado(p.noLaborales, 0),
    rentaLiquidaCedula,
    limiteGlobal: p.limiteGlobal,
    deduccionFacturaElectronica: p.fuera.facturaElectronica,
    deduccionDependientesAdicionales: p.fuera.dependientesAdicionales,
    totalExentasYDeduccionesConFueraDeLimite: totalConFuera,
    rentaLiquidaGravable: Math.max(0, rentaLiquidaCedula - totalConFuera),
  };
}
