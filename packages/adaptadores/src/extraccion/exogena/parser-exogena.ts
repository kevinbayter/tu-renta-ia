import { read, utils } from 'xlsx';

import type { ExogenaParseada, FilaExogena, TopesExogena } from '@turenta/core';

import type { WorkSheet } from 'xlsx';

/**
 * Parser DETERMINISTA (sin IA) del Excel "Consulta de información reportada
 * por terceros" de la DIAN. Estructura observada: encabezado con año, filas
 * "Tope 1..5" y luego filas [NIT | Nombre | NIT reportado | Nombre | Detalle | Valor | Uso | Info].
 * SheetJS por tolerancia a XLSX generados por sistemas no estándar (MUISCA).
 */
export function parsearExogena(contenido: Uint8Array): ExogenaParseada {
  const filasCrudas = leerMatriz(contenido).map(aFilaCruda);
  const identificacion = detectarIdentificacion(filasCrudas);
  return {
    anioGravable: detectarAnio(filasCrudas),
    ...(identificacion ? { identificacionConsultante: identificacion } : {}),
    topes: extraerTopes(filasCrudas),
    filas: filasCrudas.filter(esFilaDeTercero).map(aFilaExogena),
  };
}

/** Cédula del consultante en el encabezado ("Identificación: | | 1234567890"). */
function detectarIdentificacion(filas: FilaCruda[]): string | null {
  const fila = filas.find((f) => f.celdas.some((c) => c.startsWith('Identificación')));
  const valor = fila?.celdas.find((c) => /^\d{5,}$/.test(c));
  return valor ?? null;
}

interface FilaCruda {
  celdas: string[];
  valorNumerico: number;
}

function leerMatriz(contenido: Uint8Array): unknown[][] {
  const libro = read(contenido, { type: 'array' });
  const nombreHoja = libro.SheetNames[0];
  const hoja = nombreHoja ? libro.Sheets[nombreHoja] : undefined;
  if (!hoja) {
    throw new Error('Exógena: el archivo no contiene hojas');
  }
  corregirRangoDeclarado(hoja);
  return utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: '' });
}

/**
 * Los XLSX de MUISCA declaran una dimensión (!ref) menor que los datos reales
 * (p. ej. A1:H15 con 76 filas). Se recalcula el rango desde las celdas presentes.
 */
function corregirRangoDeclarado(hoja: WorkSheet): void {
  const direcciones = Object.keys(hoja).filter((clave) => !clave.startsWith('!'));
  if (direcciones.length === 0) {
    return;
  }
  const rango = direcciones.map((dir) => utils.decode_cell(dir)).reduce(
    (acc, celda) => ({
      s: { r: Math.min(acc.s.r, celda.r), c: Math.min(acc.s.c, celda.c) },
      e: { r: Math.max(acc.e.r, celda.r), c: Math.max(acc.e.c, celda.c) },
    }),
    { s: { r: Number.POSITIVE_INFINITY, c: Number.POSITIVE_INFINITY }, e: { r: 0, c: 0 } },
  );
  hoja['!ref'] = utils.encode_range(rango);
}

function aFilaCruda(celdas: unknown[]): FilaCruda {
  const textos = celdas.map(textoDeValor);
  return { celdas: textos, valorNumerico: numeroDeTexto(textos[5] ?? '') };
}

function textoDeValor(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor.trim();
  }
  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  return '';
}

function numeroDeTexto(texto: string): number {
  const limpio = texto.replace(/[^\d-]/g, '');
  const numero = Number(limpio);
  return Number.isFinite(numero) && limpio !== '' ? numero : 0;
}

function detectarAnio(filas: FilaCruda[]): number {
  const filaAnio = filas.find((f) => f.celdas.some((c) => c.includes('Año al que se refiere')));
  const anio = filaAnio?.celdas.map((c) => Number(c)).find((n) => n >= 2014 && n <= 2100);
  return anio ?? 0;
}

function extraerTopes(filas: FilaCruda[]): TopesExogena {
  return {
    ingresos: valorDeTope(filas, 'Tope 1'),
    patrimonio: valorDeTope(filas, 'Tope 2'),
    consumoTarjetas: valorDeTope(filas, 'Tope 3'),
    movimientos: valorDeTope(filas, 'Tope 4'),
    compras: valorDeTope(filas, 'Tope 5'),
  };
}

function valorDeTope(filas: FilaCruda[], etiqueta: string): number {
  const fila = filas.find((f) => (f.celdas[4] ?? '').startsWith(etiqueta));
  return fila?.valorNumerico ?? 0;
}

function esFilaDeTercero(fila: FilaCruda): boolean {
  const nit = fila.celdas[0] ?? '';
  const detalle = fila.celdas[4] ?? '';
  return /^\d{5,}$/.test(nit) && detalle.length > 0;
}

function aFilaExogena(fila: FilaCruda): FilaExogena {
  return {
    nitInformante: fila.celdas[0] ?? '',
    nombreInformante: fila.celdas[1] ?? '',
    detalle: fila.celdas[4] ?? '',
    valor: fila.valorNumerico,
    usoSugerido: fila.celdas[6] ?? '',
    infoAdicional: fila.celdas[7] ?? '',
  };
}
