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

interface PendienteDeDatos {
  evento: keyof RespuestasEntrevista;
  etiqueta: string;
  detalle: string;
  tieneDatos: (r: RespuestasEntrevista) => boolean;
}

/** Eventos que el motor SÍ liquida, pero solo cuando la entrevista capturó sus datos. */
const PENDIENTES_DE_DATOS: PendienteDeDatos[] = [
  {
    evento: 'eventoVentaActivos',
    etiqueta: 'Venta de activos sin datos completos',
    detalle:
      'Nos contaste que vendiste un activo pero faltan sus datos (fechas, precio, costo): vuelve a la entrevista y regístralos para liquidarla.',
    tieneDatos: (r) => (r.ventasActivos ?? []).length > 0,
  },
  {
    evento: 'eventoHerenciaODonacion',
    etiqueta: 'Herencia o donación sin datos completos',
    detalle:
      'Nos contaste que recibiste una herencia o donación pero faltan sus datos (tipo de bien, valor): vuelve a la entrevista y regístralos.',
    tieneDatos: (r) => (r.herenciasRecibidas ?? []).length > 0,
  },
  {
    evento: 'eventoPremiosOApuestas',
    etiqueta: 'Premios sin datos completos',
    detalle:
      'Nos contaste que ganaste premios pero falta su valor y retención: vuelve a la entrevista y regístralos.',
    tieneDatos: (r) => (r.premiosRecibidos ?? []).length > 0,
  },
  {
    evento: 'eventoDividendos',
    etiqueta: 'Dividendos sin datos completos',
    detalle:
      'Nos contaste que recibiste dividendos pero falta el certificado del emisor (gravados, no gravados y retención): vuelve a la entrevista y regístralos.',
    tieneDatos: (r) => (r.dividendosNoGravados ?? 0) > 0 || (r.dividendosGravados ?? 0) > 0,
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
    clave: 'eventoIngresosExterior',
    etiqueta: 'Ingresos del exterior',
    detalle:
      'Requieren conversión a TRM y análisis de fuente y de impuestos pagados afuera (art. 254 E.T.), que aún no cubrimos.',
  },
  {
    clave: 'eventoRetirosAfcSinRequisitos',
    etiqueta: 'Retiros de AFC o pensión voluntaria sin cumplir requisitos',
    detalle:
      'Generan pérdida del beneficio y retención contingente (arts. 126-1/126-4 E.T.), tratamiento que aún no liquidamos.',
  },
];

export interface AdvertenciaDeclaracion {
  clave: keyof RespuestasEntrevista;
  etiqueta: string;
  detalle: string;
}

/**
 * Avisos que NO bloquean el borrador: la declaración de renta queda completa,
 * pero el usuario tiene otra obligación aparte que debe conocer.
 */
export function detectarAdvertencias(respuestas: RespuestasEntrevista): AdvertenciaDeclaracion[] {
  if (respuestas.eventoActivosExterior !== 1) {
    return [];
  }
  return [
    {
      clave: 'eventoActivosExterior',
      etiqueta: 'Activos en el exterior',
      detalle:
        'Tus cuentas y bienes fuera de Colombia deben estar incluidos en el patrimonio de esta declaración (regístralos en la entrevista como bienes, en pesos). Además, si a 1 de enero superaban 2.000 UVT, debes presentar por aparte la declaración anual de activos en el exterior (formulario 160) en los mismos plazos — TuRenta no la prepara.',
    },
  ];
}

export function detectarCasosNoSoportados(respuestas: RespuestasEntrevista): CasoNoSoportado[] {
  const pendientes = PENDIENTES_DE_DATOS.filter(
    (caso) => respuestas[caso.evento] === 1 && !caso.tieneDatos(respuestas),
  ).map(({ evento, etiqueta, detalle }) => ({ clave: evento, etiqueta, detalle }));
  return [...pendientes, ...CASOS.filter((caso) => respuestas[caso.clave] === 1)];
}
