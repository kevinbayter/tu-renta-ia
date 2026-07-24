import { redondearMil } from '../redondeo';

import type { ConstantesAnio } from '../constantes/tipos';

/**
 * Límite global de rentas exentas y deducciones imputables (art. 336 E.T.):
 * min(40% × (ingresos − INCRNGO), 1.340 UVT). Base según Res. DIAN 000120/2024.
 */
export function calcularLimiteGlobal(
  ingresosTotales: number,
  incrngoTotales: number,
  c: ConstantesAnio,
): number {
  const base = (ingresosTotales - incrngoTotales) * c.limiteGlobal.porcentaje;
  const tope = c.limiteGlobal.topeUvt * c.uvt;
  return redondearMil(Math.min(base, tope));
}

/** Deducción del 1% de compras con factura electrónica (art. 336-5) — fuera del límite. */
export function calcularFacturaElectronica(compras: number, c: ConstantesAnio): number {
  const beneficio = compras * c.facturaElectronica.porcentaje;
  const tope = c.facturaElectronica.topeAnualUvt * c.uvt;
  return redondearMil(Math.min(beneficio, tope));
}

/** Deducción de 72 UVT por dependiente, máx. 4 (art. 336-3) — fuera del límite. */
export function calcularDependientesAdicionales(cantidad: number, c: ConstantesAnio): number {
  const efectivos = Math.min(cantidad, c.dependienteAdicional336.maximoDependientes);
  return redondearMil(efectivos * c.dependienteAdicional336.uvtPorDependiente * c.uvt);
}
