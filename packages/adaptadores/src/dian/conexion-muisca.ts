import { chromium } from 'playwright';

import type {
  ConexionDianPort,
  ContextoOperacionDian,
  CredencialesDian,
  ProgresoConexion,
  ResultadoDescarga,
} from '@turenta/core';

import { descargarDeclaracionPresentada } from './declaraciones-muisca';
import { descargarReporteExogena } from './exogena-muisca';
import { clasificarError, detalleDeError, fallo } from './motivos-fallo';
import { autenticar } from './sesion-muisca';

import type { Browser, Page } from 'playwright';

/**
 * MUISCA portal adapter (Playwright). Orchestrates the session: opens a
 * browser, signs in, runs one operation and always closes.
 *
 * It is the only part of the system that sees the user's credentials, and they
 * are never returned, stored or logged (PLAN-DIAN §1).
 */

const URL_BASE_PRODUCCION = 'https://muisca.dian.gov.co';
const ESPERA_POR_DEFECTO_MS = 45_000;

/** Injectables so the flow can run against a fake MUISCA without long waits. */
export interface AjustesMuisca {
  urlBase?: string;
  esperaMs?: number;
  lanzarNavegador?: () => Promise<Browser>;
}

interface AjustesResueltos {
  urlBase: string;
  esperaMs: number;
  lanzarNavegador: () => Promise<Browser>;
}

function resolver(ajustes: AjustesMuisca): AjustesResueltos {
  return {
    urlBase: ajustes.urlBase ?? URL_BASE_PRODUCCION,
    esperaMs: ajustes.esperaMs ?? ESPERA_POR_DEFECTO_MS,
    lanzarNavegador: ajustes.lanzarNavegador ?? (() => chromium.launch({ headless: true })),
  };
}

export class ConexionMuisca implements ConexionDianPort {
  private readonly ajustes: AjustesResueltos;

  constructor(ajustes: AjustesMuisca = {}) {
    this.ajustes = resolver(ajustes);
  }

  async descargarExogena(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tu información exógena' });
      return descargarReporteExogena(pagina, contexto.anioGravable, this.ajustes.esperaMs, alProgresar);
    });
  }

  async descargarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDescarga> {
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      alProgresar?.({ etapa: 'navegando', mensaje: 'Buscando tus declaraciones presentadas' });
      return descargarDeclaracionPresentada(
        pagina,
        contexto.anioGravable,
        this.ajustes.esperaMs,
        alProgresar,
      );
    });
  }

  /** Opens the browser, authenticates, runs the operation and ALWAYS closes. */
  private async enSesion(
    credenciales: CredencialesDian,
    alProgresar: ((p: ProgresoConexion) => void) | undefined,
    operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  ): Promise<ResultadoDescarga> {
    let navegador: Browser | null = null;
    try {
      alProgresar?.({ etapa: 'iniciando', mensaje: 'Abriendo conexión segura' });
      navegador = await this.ajustes.lanzarNavegador();
      return await autenticarYOperar(navegador, credenciales, this.ajustes, operacion, alProgresar);
    } catch (error) {
      // The Secreto redacts itself: no need to reveal it just to clean the text.
      return fallo(clasificarError(error), credenciales.contrasena.redactarEn(detalleDeError(error)));
    } finally {
      await navegador?.close().catch(() => null);
    }
  }
}

/** Authenticates and, on success, runs the requested operation. */
async function autenticarYOperar(
  navegador: Browser,
  credenciales: CredencialesDian,
  ajustes: AjustesResueltos,
  operacion: (pagina: Page) => Promise<ResultadoDescarga>,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoDescarga> {
  const contexto = await navegador.newContext({ acceptDownloads: true });
  const pagina = await contexto.newPage();
  alProgresar?.({ etapa: 'autenticando', mensaje: 'Ingresando a tu cuenta' });
  const autenticado = await autenticar(pagina, credenciales, ajustes.urlBase, ajustes.esperaMs);
  return autenticado.exito ? operacion(pagina) : autenticado;
}
