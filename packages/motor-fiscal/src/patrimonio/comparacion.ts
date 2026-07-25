import { redondearMil } from '../redondeo';

import type { ResultadoComparacionPatrimonial } from '../modelo/resultado';
import type { ComparacionPatrimonialInput } from '../modelo/tipos';

/**
 * Renta por comparación patrimonial (arts. 236-239 E.T.). La plataforma AVISA,
 * nunca agrega renta automáticamente: el art. 239 permite demostrar causas
 * justificativas y esas solo las conoce el contribuyente
 * (normativa/ag2025/06-descuentos-y-comparacion.md).
 */
export function compararPatrimonio(
  entrada: ComparacionPatrimonialInput | undefined,
  patrimonioLiquidoActual: number,
  rentaLiquidaGravable: number,
  rentasExentas: number,
): ResultadoComparacionPatrimonial {
  const anterior = redondearMil(Math.max(0, entrada?.patrimonioLiquidoAnterior ?? 0));
  if (anterior === 0) {
    return sinComparacion();
  }
  const incremento = patrimonioLiquidoActual - anterior;
  const capacidad = capacidadDeJustificacion(entrada, rentaLiquidaGravable, rentasExentas);
  return {
    aplica: true,
    patrimonioLiquidoAnterior: anterior,
    incremento,
    capacidadDeJustificacion: capacidad,
    diferenciaSinJustificar: Math.max(0, incremento - capacidad),
  };
}

/** Art. 237: renta gravable + exentas + GO neta − impuestos pagados + causas justificativas. */
function capacidadDeJustificacion(
  entrada: ComparacionPatrimonialInput | undefined,
  rentaLiquidaGravable: number,
  rentasExentas: number,
): number {
  const positivo = (valor: number | undefined) => redondearMil(Math.max(0, valor ?? 0));
  return (
    rentaLiquidaGravable +
    rentasExentas +
    positivo(entrada?.gananciaOcasionalNeta) -
    positivo(entrada?.impuestosPagadosEnElAnio) +
    positivo(entrada?.justificacionesDeclaradas)
  );
}

function sinComparacion(): ResultadoComparacionPatrimonial {
  return {
    aplica: false,
    patrimonioLiquidoAnterior: 0,
    incremento: 0,
    capacidadDeJustificacion: 0,
    diferenciaSinJustificar: 0,
  };
}
