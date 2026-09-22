import { chromium } from 'playwright';

import type {
  ConexionDianPort,
  ContextoOperacionDian,
  CredencialesDian,
  DatosDiligenciamiento,
  DatosPresentacion,
  MotivoFalloDian,
  ProgresoConexion,
  ResultadoDescarga,
  ResultadoDiligenciamiento,
  ResultadoPresentacion,
} from '@turenta/core';

import { declaracionPresentadaDelAnio, descargarDeclaracionPresentada } from './declaraciones-muisca';
import { diligenciarBorrador210, llegarAFirma210 } from './diligenciar-210-muisca';
import { descargarReporteExogena } from './exogena-muisca';
import { firmarYPresentar, presentarFirmada } from './firmar-210-muisca';
import { clasificarError, detalleDeError, fallo } from './motivos-fallo';
import { autenticar } from './sesion-muisca';

import type { Presentada } from './declaraciones-muisca';
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

  async diligenciarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosDiligenciamiento,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoDiligenciamiento> {
    const opciones = this.opcionesPara(contexto, alProgresar);
    return this.enSesion(credenciales, alProgresar, (pagina) => diligenciarBorrador210(pagina, datos, opciones));
  }

  /**
   * Signing and filing in the same session: the browser must stay open from the
   * draft to the acuse, so it is one operation and not two calls.
   */
  async presentarDeclaracion(
    credenciales: CredencialesDian,
    contexto: ContextoOperacionDian,
    datos: DatosPresentacion,
    alProgresar?: (p: ProgresoConexion) => void,
  ): Promise<ResultadoPresentacion> {
    const opciones = this.opcionesPara(contexto, alProgresar);
    return this.enSesion(credenciales, alProgresar, async (pagina) => {
      const yaEsta = await yaPresentada(pagina, contexto.anioGravable, this.ajustes.esperaMs, alProgresar);
      if (yaEsta) {
        return yaEsta;
      }
      return this.desdeElBorrador(pagina, credenciales, datos, opciones);
    });
  }

  private async desdeElBorrador(
    pagina: Page,
    credenciales: CredencialesDian,
    datos: DatosPresentacion,
    opciones: ReturnType<ConexionMuisca['opcionesPara']>,
  ): Promise<ResultadoPresentacion> {
    const { editor, resultado, estado } = await llegarAFirma210(pagina, datos, opciones);
    if (!editor) {
      return resultado;
    }
    const avisar = opciones.avisar ?? (() => undefined);
    if (resultado.firmada === true && estado !== 'paraFirmar') {
      return { ...resultado, ...(await presentarFirmada(editor, this.ajustes.esperaMs, avisar)) };
    }
    const firma = { contrasena: credenciales.contrasena, ...(datos.codigoFirma ? { codigo: datos.codigoFirma } : {}) };
    return { ...resultado, ...(await firmarYPresentar(editor, firma, this.ajustes.esperaMs, avisar)) };
  }

  private opcionesPara(contexto: ContextoOperacionDian, alProgresar?: (p: ProgresoConexion) => void) {
    return { esperaMs: this.ajustes.esperaMs, anioGravable: contexto.anioGravable, ...(alProgresar ? { avisar: alProgresar } : {}) };
  }

  /** Opens the browser, authenticates, runs the operation and ALWAYS closes. */
  private async enSesion<T extends ResultadoOperacion>(
    credenciales: CredencialesDian,
    alProgresar: ((p: ProgresoConexion) => void) | undefined,
    operacion: (pagina: Page) => Promise<T>,
  ): Promise<T | ResultadoOperacion> {
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

/** What every operation shares: the failure fields the UI turns into messages. */
interface ResultadoOperacion {
  exito: boolean;
  motivoFallo?: MotivoFalloDian;
  detalle?: string;
}

/** Authenticates and, on success, runs the requested operation. */
async function autenticarYOperar<T extends ResultadoOperacion>(
  navegador: Browser,
  credenciales: CredencialesDian,
  ajustes: AjustesResueltos,
  operacion: (pagina: Page) => Promise<T>,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<T | ResultadoOperacion> {
  const contexto = await navegador.newContext({ acceptDownloads: true });
  const pagina = await contexto.newPage();
  alProgresar?.({ etapa: 'autenticando', mensaje: 'Ingresando a tu cuenta' });
  const autenticado = await autenticar(pagina, credenciales, ajustes.urlBase, ajustes.esperaMs);
  return autenticado.exito ? operacion(pagina) : autenticado;
}

/**
 * Presentar dos veces no es un error que se deshaga: la DIAN recibiría una
 * segunda declaración y tocaría corregir. Antes de tocar el borrador se mira la
 * lista de presentadas, que es la única fuente que manda sobre si ya está hecha.
 */
async function yaPresentada(
  pagina: Page,
  anioGravable: number,
  esperaMs: number,
  alProgresar?: (p: ProgresoConexion) => void,
): Promise<ResultadoPresentacion | null> {
  alProgresar?.({ etapa: 'verificando', mensaje: 'Revisando si ya está presentada en la DIAN' });
  const inicio = pagina.url();
  const presentada = await declaracionPresentadaDelAnio(pagina, anioGravable, esperaMs).catch(() => null);
  if (!presentada) {
    await devolverAlInicio(pagina, inicio, esperaMs);
    return null;
  }
  await devolverAlInicio(pagina, inicio, esperaMs);
  return conAcuse(presentada, presentada.archivo);
}

function conAcuse(presentada: Presentada, pdf: ResultadoDescarga | null): ResultadoPresentacion {
  return {
    exito: true,
    firmada: true,
    presentada: true,
    numeroFormulario: presentada.numeroFormulario,
    presentadaEn: presentada.fecha,
    ...acuseDe(pdf, presentada.numeroFormulario),
    detalle: 'Ya estaba presentada en el portal de la DIAN',
  };
}

/**
 * La declaración presentada ES el comprobante que el usuario quiere bajar. Sin
 * ella la tarjeta dice "ya presentaste" y no deja llevarse nada, que es la
 * mitad de la respuesta.
 */
function acuseDe(pdf: ResultadoDescarga | null, numeroFormulario: string): Pick<ResultadoPresentacion, 'acuse'> {
  if (!pdf?.exito || !pdf.contenido) {
    return {};
  }
  return {
    acuse: {
      nombreArchivo: pdf.nombreArchivo ?? `${numeroFormulario}.pdf`,
      contenidoBase64: Buffer.from(pdf.contenido).toString('base64'),
    },
  };
}

/**
 * Consultar las presentadas navega el portal y puede abrir la SPA en otra
 * pestaña. Si no se deshace, el diligenciamiento arranca desde una pantalla que
 * no es la suya y falla por una razón que no tiene nada que ver.
 */
async function devolverAlInicio(pagina: Page, url: string, esperaMs: number): Promise<void> {
  const otras = pagina.context().pages().filter((abierta) => abierta !== pagina);
  await Promise.all(otras.map((abierta) => abierta.close().catch(() => null)));
  await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: esperaMs }).catch(() => null);
}
