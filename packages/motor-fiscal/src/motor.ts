import { obtenerConstantes } from './constantes/registro';
import { depurarCedulaGeneral } from './depuracion/cedula-general';
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
  const retenciones = calcularRetenciones(perfil);
  const liquidacion = liquidar(cedulaGeneral.rentaLiquidaGravable, retenciones, perfil.historial, c);
  const patrimonioBruto = redondearMil(sumarActivos(perfil));
  const deudas = redondearMil(perfil.patrimonio.deudas);
  const patrimonioLiquido = Math.max(0, patrimonioBruto - deudas);
  return {
    anioGravable: perfil.anioGravable,
    patrimonioBruto,
    deudas,
    patrimonioLiquido,
    cedulaGeneral,
    liquidacion,
    casillas: construirCasillas(perfil, cedulaGeneral, liquidacion, patrimonioBruto, deudas),
  };
}

function calcularRetenciones(perfil: PerfilFiscal): number {
  const laborales = perfil.certificadosLaborales.reduce((acc, x) => acc + x.retencionFuente, 0);
  return redondearMil(laborales + perfil.rentasCapital.retencionFuente);
}

function sumarActivos(perfil: PerfilFiscal): number {
  return perfil.patrimonio.activos.reduce((acc, activo) => acc + activo.valor, 0);
}

function construirCasillas(
  perfil: PerfilFiscal,
  cedula: ResultadoDeclaracion['cedulaGeneral'],
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
    liquidacion,
    cantidadDependientes: perfil.deducciones.dependientesAdicionales336,
  });
}
