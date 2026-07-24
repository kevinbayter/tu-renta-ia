import { obtenerConstantes } from './constantes/registro';
import { depurarCedulaGeneral } from './depuracion/cedula-general';
import { depurarPensiones } from './depuracion/pensiones';
import { mapearCasillas } from './formulario210/casillas';
import { liquidar } from './liquidacion/liquidar';
import { redondearMil } from './redondeo';

import type { ResultadoDeclaracion } from './modelo/resultado';
import type { PerfilFiscal } from './modelo/tipos';

/**
 * Punto de entrada del motor fiscal: liquida la declaración de renta (formulario 210)
 * de una persona natural residente. Función pura y determinista.
 */
export function liquidarDeclaracion(perfil: PerfilFiscal): ResultadoDeclaracion {
  const c = obtenerConstantes(perfil.anioGravable);
  const cedulaGeneral = depurarCedulaGeneral(perfil, c);
  const cedulaPensiones = depurarPensiones(perfil.rentasPensiones, c);
  const retenciones = calcularRetenciones(perfil);
  // Art. 331 E.T. (Ley 2277/2022): la tarifa del 241 se aplica a la SUMA de cédulas.
  const rentaLiquidaGravableTotal = cedulaGeneral.rentaLiquidaGravable + cedulaPensiones.rentaLiquidaGravable;
  const liquidacion = liquidar(rentaLiquidaGravableTotal, retenciones, perfil.historial, c);
  const patrimonioBruto = redondearMil(sumarActivos(perfil));
  const deudas = redondearMil(perfil.patrimonio.deudas);
  const patrimonioLiquido = Math.max(0, patrimonioBruto - deudas);
  return {
    anioGravable: perfil.anioGravable,
    patrimonioBruto,
    deudas,
    patrimonioLiquido,
    cedulaGeneral,
    cedulaPensiones,
    liquidacion,
    casillas: construirCasillas(perfil, cedulaGeneral, cedulaPensiones, liquidacion, patrimonioBruto, deudas),
  };
}

function calcularRetenciones(perfil: PerfilFiscal): number {
  const laborales = perfil.certificadosLaborales.reduce((acc, x) => acc + x.retencionFuente, 0);
  const pensionales = perfil.rentasPensiones?.retencionFuente ?? 0;
  const noLaborales = perfil.rentasNoLaborales?.retencionFuente ?? 0;
  return redondearMil(laborales + perfil.rentasCapital.retencionFuente + pensionales + noLaborales);
}

function sumarActivos(perfil: PerfilFiscal): number {
  return perfil.patrimonio.activos.reduce((acc, activo) => acc + activo.valor, 0);
}

function construirCasillas(
  perfil: PerfilFiscal,
  cedula: ResultadoDeclaracion['cedulaGeneral'],
  pensiones: ResultadoDeclaracion['cedulaPensiones'],
  liquidacion: ResultadoDeclaracion['liquidacion'],
  patrimonioBruto: number,
  deudas: number,
): Record<string, number> {
  return mapearCasillas({
    facturaElectronica: cedula.deduccionFacturaElectronica,
    patrimonioBruto,
    deudas,
    patrimonioLiquido: Math.max(0, patrimonioBruto - deudas),
    cedula,
    pensiones,
    liquidacion,
    cantidadDependientes: perfil.deducciones.dependientesAdicionales336,
  });
}
