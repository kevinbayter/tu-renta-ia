import { obtenerConstantes } from './constantes/registro';
import { depurarCedulaGeneral } from './depuracion/cedula-general';
import { depurarPensiones } from './depuracion/pensiones';
import { mapearCasillas } from './formulario210/casillas';
import { liquidar } from './liquidacion/liquidar';
import { compararPatrimonio } from './patrimonio/comparacion';
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
  // Art. 331 E.T. (Ley 2277/2022): la tarifa del 241 se aplica a la SUMA de cédulas.
  const rentaLiquidaGravable = cedulaGeneral.rentaLiquidaGravable + cedulaPensiones.rentaLiquidaGravable;
  const liquidacion = liquidar(rentaLiquidaGravable, calcularRetenciones(perfil), perfil.historial, c, perfil.descuentos);
  const patrimonio = calcularPatrimonio(perfil);
  return {
    anioGravable: perfil.anioGravable,
    ...patrimonio,
    cedulaGeneral,
    cedulaPensiones,
    comparacionPatrimonial: compararPatrimonio(
      perfil.comparacionPatrimonial,
      patrimonio.patrimonioLiquido,
      rentaLiquidaGravable,
      // Art. 237: las rentas exentas suman a la capacidad de justificación.
      cedulaGeneral.totalExentasYDeduccionesConFueraDeLimite + cedulaPensiones.rentaExenta,
    ),
    liquidacion,
    casillas: construirCasillas(perfil, cedulaGeneral, cedulaPensiones, liquidacion, patrimonio),
  };
}

function calcularPatrimonio(perfil: PerfilFiscal): {
  patrimonioBruto: number;
  deudas: number;
  patrimonioLiquido: number;
} {
  const patrimonioBruto = redondearMil(sumarActivos(perfil));
  const deudas = redondearMil(perfil.patrimonio.deudas);
  return { patrimonioBruto, deudas, patrimonioLiquido: Math.max(0, patrimonioBruto - deudas) };
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
  patrimonio: { patrimonioBruto: number; deudas: number; patrimonioLiquido: number },
): Record<string, number> {
  return mapearCasillas({
    facturaElectronica: cedula.deduccionFacturaElectronica,
    ...patrimonio,
    cedula,
    pensiones,
    liquidacion,
    cantidadDependientes: perfil.deducciones.dependientesAdicionales336,
  });
}
