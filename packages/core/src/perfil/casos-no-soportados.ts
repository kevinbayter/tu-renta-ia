import type { RespuestasEntrevista } from './respuestas';

/**
 * Casos que el motor todavía no liquida. Detectarlos y decirlo es obligatorio:
 * entregar un borrador que los omita en silencio produciría una declaración
 * inexacta (sanción del art. 647 E.T. para el usuario).
 */

export interface CasoNoSoportado {
  clave: keyof RespuestasEntrevista;
  etiqueta: string;
  detalle: string;
}

const CASOS: CasoNoSoportado[] = [
  {
    clave: 'eventoVentaActivos',
    etiqueta: 'Venta de inmueble, vehículo u otro activo',
    detalle:
      'La utilidad tributa como ganancia ocasional (≥2 años de posesión) o renta ordinaria (<2 años), y aún no la liquidamos.',
  },
  {
    clave: 'eventoHerenciaODonacion',
    etiqueta: 'Herencia, legado o donación recibida',
    detalle:
      'Es ganancia ocasional gravada con exenciones propias (art. 307 E.T.) que aún no liquidamos; no basta con justificar el patrimonio.',
  },
  {
    clave: 'eventoPremiosOApuestas',
    etiqueta: 'Premios de loterías, rifas o apuestas',
    detalle: 'Tributan como ganancia ocasional al 20% (art. 317 E.T.) y aún no la liquidamos.',
  },
  {
    clave: 'eventoCripto',
    etiqueta: 'Criptomonedas',
    detalle:
      'Deben declararse en el patrimonio a costo fiscal y sus ventas generan renta o ganancia ocasional; aún no cubrimos su tratamiento.',
  },
  {
    clave: 'eventoActivosExterior',
    etiqueta: 'Cuentas o activos en el exterior',
    detalle:
      'Pueden exigir la declaración anual de activos en el exterior (formulario 160), que no preparamos.',
  },
  {
    clave: 'eventoIngresosExterior',
    etiqueta: 'Ingresos del exterior',
    detalle:
      'Requieren conversión a TRM y análisis de fuente y de impuestos pagados afuera (art. 254 E.T.), que aún no cubrimos.',
  },
  {
    clave: 'eventoDividendos',
    etiqueta: 'Dividendos recibidos',
    detalle: 'Tienen cédula y descuento propios (arts. 242 y 254-1 E.T.) que aún no liquidamos.',
  },
];

export function detectarCasosNoSoportados(respuestas: RespuestasEntrevista): CasoNoSoportado[] {
  return CASOS.filter((caso) => respuestas[caso.clave] === 1);
}
