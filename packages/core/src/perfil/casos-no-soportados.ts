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

/** Eventos que el motor SÍ liquida, pero solo cuando la entrevista capturó sus datos. */
const PENDIENTES_DE_DATOS: { evento: keyof RespuestasEntrevista; datos: keyof RespuestasEntrevista; etiqueta: string; detalle: string }[] = [
  {
    evento: 'eventoVentaActivos',
    datos: 'ventasActivos',
    etiqueta: 'Venta de activos sin datos completos',
    detalle:
      'Nos contaste que vendiste un activo pero faltan sus datos (fechas, precio, costo): vuelve a la entrevista y regístralos para liquidarla.',
  },
  {
    evento: 'eventoHerenciaODonacion',
    datos: 'herenciasRecibidas',
    etiqueta: 'Herencia o donación sin datos completos',
    detalle:
      'Nos contaste que recibiste una herencia o donación pero faltan sus datos (tipo de bien, valor): vuelve a la entrevista y regístralos.',
  },
  {
    evento: 'eventoPremiosOApuestas',
    datos: 'premiosRecibidos',
    etiqueta: 'Premios sin datos completos',
    detalle:
      'Nos contaste que ganaste premios pero falta su valor y retención: vuelve a la entrevista y regístralos.',
  },
];

const CASOS: CasoNoSoportado[] = [
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
  {
    clave: 'eventoRetirosAfcSinRequisitos',
    etiqueta: 'Retiros de AFC o pensión voluntaria sin cumplir requisitos',
    detalle:
      'Generan pérdida del beneficio y retención contingente (arts. 126-1/126-4 E.T.), tratamiento que aún no liquidamos.',
  },
];

export function detectarCasosNoSoportados(respuestas: RespuestasEntrevista): CasoNoSoportado[] {
  const pendientes = PENDIENTES_DE_DATOS.filter(
    (caso) =>
      respuestas[caso.evento] === 1 &&
      (respuestas[caso.datos] as unknown[] | undefined ?? []).length === 0,
  ).map(({ evento, etiqueta, detalle }) => ({ clave: evento, etiqueta, detalle }));
  return [...pendientes, ...CASOS.filter((caso) => respuestas[caso.clave] === 1)];
}
