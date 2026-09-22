/**
 * Piezas compartidas por las pruebas de navegador contra el MUISCA falso.
 *
 * LÍMITE IMPORTANTE: estos fixtures congelan lo que NOSOTROS creemos del
 * portal, no lo que el portal es. Si la DIAN renombra un control, estas pruebas
 * siguen en verde y producción se rompe igual: son pruebas de regresión de
 * nuestro código, no un contrato con la DIAN.
 *
 * Van repartidas en un archivo por área para poder correr solo la que se tocó:
 * levantar Chromium y recorrer el portal cuesta minutos, no segundos.
 */

import { Secreto } from '@turenta/core';
import type { ContextoOperacionDian, CredencialesDian } from '@turenta/core';

import { TITULAR_FICTICIO } from './fixtures/datos-ficticios';

export const ESPERA_TEST_MS = 15_000;
/** Para los casos que DEBEN agotar el tiempo: si no, cada uno cuesta 15 s. */
export const ESPERA_FALLO_MS = 2_000;

export function credenciales(contrasena: string = TITULAR_FICTICIO.contrasena): CredencialesDian {
  return {
    tipoDocumento: 'CC',
    numeroDocumento: TITULAR_FICTICIO.documento,
    contrasena: new Secreto(contrasena),
  };
}

export function contexto(anioGravable: number): ContextoOperacionDian {
  return {
    titularIdentificacion: TITULAR_FICTICIO.documento,
    operadorUsuarioId: 'usuario-de-prueba',
    anioGravable,
  };
}

/** Cifras inventadas, coherentes con las que calcula el fixture del editor. */
export const DATOS_210 = {
  genero: '1',
  actividadEconomica: '0020',
  casillas: {
    '297': 8_000_000,
    '28': 80_000,
    '29': 200_000_000,
    '30': 50_000_000,
    '31': 150_000_000,
    '58': 12_000_000,
    '59': 1_000,
    '60': 2_000_000,
    '61': 9_999_000,
    '91': 9_999_000,
    '111': 9_919_000,
  },
} as const;
