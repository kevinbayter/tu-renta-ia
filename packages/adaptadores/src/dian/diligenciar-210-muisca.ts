/**
 * Filling the 210 in MUISCA as a DRAFT (research/09). The portal opens on the
 * DIAN's suggested return; this edits it, types the engine's figures into the
 * input boxes only, reads back what the portal calculated and saves only when
 * both agree.
 *
 * NEVER signs nor files: "Firmar y presentar" files the suggested return as-is,
 * so it is not in any list of buttons this module may press. In the drafts list
 * only the "Editar" icon is pressed: its neighbour "Anular" voids the return.
 */

import {
  anclasSinLeer,
  diferenciasConPortal,
  montoDelPortal,
  nombreDeSeccion210,
  valoresDeEntrada210,
} from '@turenta/core';
import type {
  DatosDiligenciamiento,
  MotivoFalloDian,
  ProgresoConexion,
  ResultadoDiligenciamiento,
  ResultadoPresentacion,
} from '@turenta/core';

import { abrirEditor, ofrecePresentar, traza, volverAlFormulario } from './abrir-editor-210';
import { PAUSA_MS, hayAccion, pulsarAccion } from './entrada-editor-210';
import { huellaDePantalla, mapaDeLaPantalla } from './huella-pantalla';
import { mapearFirma } from './mapa-firma-210';
import { verificarBorradorEnPdf } from './verificar-borrador-210';

import type { OpcionesDiligenciamiento } from './abrir-editor-210';
import type { Page } from 'playwright';

export type { OpcionesDiligenciamiento } from './abrir-editor-210';

const EDITOR = {
  aplicacion: 'WebFormRenta210v18',
  campos: '[id^="cs_id_"]',
  /** The form's own button carries an icon ligature: its text is "Siguientechevron_right". */
  siguienteFormulario: /^\s*Siguiente/,
  cerrarAviso: /^\s*close\s*$/,
} as const;

const MAXIMO_SECCIONES = 20;

interface CampoPortal {
  casilla: string;
  editable: boolean;
  valor: string;
}

type Avisar = (progreso: ProgresoConexion) => void;

/** What every section needs: the figures to type and where to report progress. */
interface Plan {
  valores: Record<string, number>;
  datos: DatosDiligenciamiento;
  avisar: Avisar;
}


/** Fills the draft and stops: nothing is signed or filed here. */
export async function diligenciarBorrador210(
  pagina: Page,
  datos: DatosDiligenciamiento,
  opciones: OpcionesDiligenciamiento,
): Promise<ResultadoDiligenciamiento> {
  return (await llegarAFirma210(pagina, datos, opciones)).resultado;
}

/**
 * Same run, but it hands back the editor standing on "Firmar formulario" when
 * the draft was saved: what signing needs. An unexpected screen must say where
 * the robot was, so the last announced step travels with the error.
 */
export async function llegarAFirma210(
  pagina: Page,
  datos: DatosDiligenciamiento,
  opciones: OpcionesDiligenciamiento,
): Promise<Recorrida> {
  let ultimoPaso = '';
  const avisar: Avisar = (progreso) => {
    ultimoPaso = progreso.mensaje;
    opciones.avisar?.(progreso);
  };
  try {
    return await diligenciar(pagina, datos, { ...opciones, avisar });
  } catch (error) {
    const detalle = `${ultimoPaso} · ${describirError(error)} · ${await huellaDelContexto(pagina)}`;
    return { editor: null, resultado: fallido('desconocido', detalle) };
  }
}

/** First line only (Playwright appends a call log that can echo typed figures) and where it broke. */
function describirError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'error desconocido';
  }
  const donde = (error.stack ?? '').split('\n').slice(1, 4).map((l) => /at (\S+)/.exec(l)?.[1] ?? '').filter(Boolean);
  return `${error.name}: ${error.message.split('\n')[0] ?? ''} [${donde.join(' < ')}]`;
}

function huellaDelContexto(pagina: Page): Promise<string> {
  return huellaDePantalla(pagina.context().pages().at(-1) ?? pagina);
}

type Recorrida = { editor: Page | null; resultado: ResultadoPresentacion; estado?: 'paraFirmar' };

/**
 * El borrador ya está completo en el portal: se compara contra su PDF, que es
 * lo que se va a firmar. Si no coincide o no se puede leer, se vuelve al
 * formulario y se recorre entero antes de firmar nada.
 */
async function borradorVerificado(
  editor: Page,
  datos: DatosDiligenciamiento,
  opciones: OpcionesDiligenciamiento & { avisar: Avisar },
): Promise<boolean> {
  opciones.avisar({ etapa: 'verificando', mensaje: 'Revisando el borrador que ya está en la DIAN' });
  const veredicto = await verificarBorradorEnPdf(editor, datos.casillas, opciones.esperaMs);
  traza.push(`pdf=${veredicto}`);
  if (veredicto === 'coincide') {
    return true;
  }
  traza.push(`volvioAlFormulario=${String(await volverAlFormulario(editor))}`);
  return false;
}

async function diligenciar(
  pagina: Page,
  datos: DatosDiligenciamiento,
  opciones: OpcionesDiligenciamiento & { avisar: Avisar },
): Promise<Recorrida> {
  const { avisar } = opciones;
  avisar({ etapa: 'navegando', mensaje: 'Abriendo tu declaración en el formulario 210' });
  const abierto = await abrirEditor(pagina, { ...opciones, ...(datos.numeroFormulario ? { numeroFormulario: datos.numeroFormulario } : {}) });
  if (!abierto) {
    return sinEditor(await fallaAlAbrir(pagina));
  }
  const editor = abierto.pagina;
  if (abierto.estado === 'firmada') {
    return yaFirmada(editor);
  }
  if (abierto.estado === 'paraFirmar' && (await borradorVerificado(editor, datos, opciones))) {
    return { editor, resultado: { exito: true, numeroFormulario: numeroDe(editor.url()), guardado: true }, estado: 'paraFirmar' };
  }
  const recorrido = await recorrerSecciones(editor, { valores: valoresDeEntrada210(datos.casillas), datos, avisar });
  const problema = problemaDelRecorrido(recorrido);
  if (problema) {
    return sinEditor(fallido('estructura_cambiada', `${problema} · ${await huellaDePantalla(editor)}`));
  }
  return verificarYGuardar(editor, datos, recorrido, opciones);
}

/** Solo se guarda cuando cada casilla que calcula el portal coincide con el motor. */
async function verificarYGuardar(
  editor: Page,
  datos: DatosDiligenciamiento,
  recorrido: Recorrido,
  opciones: OpcionesDiligenciamiento & { avisar: Avisar },
): Promise<Recorrida> {
  opciones.avisar({ etapa: 'verificando', mensaje: 'Comparando lo que calculó la DIAN con TuRenta' });
  const numeroFormulario = numeroDe(editor.url());
  const diferencias = diferenciasConPortal(datos.casillas, recorrido.leidas);
  if (diferencias.length > 0) {
    return sinEditor({ exito: true, numeroFormulario, diferencias, guardado: false });
  }
  opciones.avisar({ etapa: 'guardando', mensaje: 'Todo cuadra: guardando el borrador en MUISCA' });
  return guardarYConfirmar(editor, numeroFormulario, opciones);
}

/** El portal avisa en un diálogo cuando la cuenta no tiene firma electrónica vigente. */
const SIN_FIRMA = /requiere de firma electr[óo]nica|no posee.{0,40}firma electr[óo]nica|firma electr[óo]nica.{0,40}no posee/i;

async function fallaAlAbrir(pagina: Page): Promise<ResultadoDiligenciamiento> {
  const pantalla = pagina.context().pages().at(-1) ?? pagina;
  const mapa = await mapaDeLaPantalla(pantalla);
  const motivo = SIN_FIRMA.test(mapa.avisos.join(' | ')) ? 'sin_firma_electronica' : 'estructura_cambiada';
  const presentar = await ofrecePresentar(pantalla);
  const detalle = `No se abrió el editor del 210 · ${traza.join(' → ')} · presentarVisible=${String(presentar)} · ${await huellaDePantalla(pantalla)} · ${JSON.stringify(mapa).slice(0, 900)}`;
  return fallido(motivo, detalle);
}

/** Firmada en un intento anterior: no se rehace nada, solo queda presentarla. */
function yaFirmada(editor: Page): Recorrida {
  return {
    editor,
    resultado: { exito: true, numeroFormulario: numeroDe(editor.url()), guardado: true, firmada: true },
  };
}

/** Without a saved draft on the signing screen there is nothing to sign. */
function sinEditor(resultado: ResultadoDiligenciamiento): Recorrida {
  return { editor: null, resultado };
}

/**
 * "No differences" only means something if the robot read the whole form: a
 * run that stopped early compares nothing and must never save.
 */
function problemaDelRecorrido(recorrido: Recorrido): string | null {
  if (recorrido.atascado) {
    return 'El formulario no avanzó de sección';
  }
  const sinLeer = anclasSinLeer(recorrido.leidas);
  const vistas = Object.keys(recorrido.leidas).length;
  return sinLeer.length > 0 ? `Recorrido incompleto: sin leer ${sinLeer.join(',')} (${String(vistas)} casillas vistas)` : null;
}

interface Recorrido {
  leidas: Record<string, number>;
  atascado: boolean;
}

/** Each section: type the inputs, read everything back, move on until there is no "Siguiente". */
function recorrerSecciones(editor: Page, plan: Plan): Promise<Recorrido> {
  return seccionSiguiente(editor, plan, {}, MAXIMO_SECCIONES);
}

async function seccionSiguiente(
  editor: Page,
  plan: Plan,
  leidas: Record<string, number>,
  restantes: number,
): Promise<Recorrido> {
  const campos = await camposDeLaSeccion(editor);
  avisarSeccion(plan.avisar, campos, MAXIMO_SECCIONES - restantes + 1);
  await digitarSeccion(editor, campos, plan.valores, plan.datos);
  const acumuladas = { ...leidas, ...(await leerSeccion(editor)) };
  const paso = restantes > 0 ? await avanzar(editor, campos) : 'atascado';
  if (paso !== 'avanzo') {
    return { leidas: acumuladas, atascado: paso === 'atascado' };
  }
  return seccionSiguiente(editor, plan, acumuladas, restantes - 1);
}

function avisarSeccion(avisar: Avisar, campos: CampoPortal[], numero: number): void {
  const nombre = nombreDeSeccion210(campos.map((c) => c.casilla));
  const cual = nombre ? `${nombre} (sección ${String(numero)})` : `la sección ${String(numero)}`;
  avisar({ etapa: 'diligenciando', mensaje: `Diligenciando ${cual}` });
}

/** Some boxes are plain text (no `value`): those are read, never typed into. */
function camposDeLaSeccion(editor: Page): Promise<CampoPortal[]> {
  return editor.$$eval(EDITOR.campos, (elementos) =>
    elementos.map((e) => {
      const campo = e as HTMLInputElement;
      const esControl = e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement;
      const valor = esControl ? campo.value : (e.textContent ?? '');
      return { casilla: e.id.replace('cs_id_', ''), editable: esControl && !(campo.readOnly || campo.disabled), valor: valor.trim() };
    }),
  );
}

async function digitarSeccion(
  editor: Page,
  campos: CampoPortal[],
  valores: Record<string, number>,
  datos: DatosDiligenciamiento,
): Promise<void> {
  for (const campo of campos.filter((c) => c.editable)) {
    await digitarCampo(editor, campo.casilla, valores, datos);
  }
}

/** Selects take the user's answers; numbers are typed digits-only and the portal formats them. */
async function digitarCampo(
  editor: Page,
  casilla: string,
  valores: Record<string, number>,
  datos: DatosDiligenciamiento,
): Promise<void> {
  const campo = editor.locator(`#cs_id_${casilla}`);
  if (casilla === '286' || casilla === '24') {
    await campo.selectOption(casilla === '286' ? datos.genero : datos.actividadEconomica);
    return;
  }
  const valor = valores[casilla];
  if (valor === undefined) {
    return;
  }
  await campo.fill(String(valor));
  await campo.press('Tab');
}

async function leerSeccion(editor: Page): Promise<Record<string, number>> {
  const campos = await camposDeLaSeccion(editor);
  return Object.fromEntries(campos.map((c) => [c.casilla, montoDelPortal(c.valor)]));
}

type Paso = 'avanzo' | 'ultima' | 'atascado';

/** A section that does not change after "Siguiente" is stuck (usually a validation message). */
async function avanzar(editor: Page, anteriores: CampoPortal[]): Promise<Paso> {
  if (!(await hayAccion(editor, EDITOR.siguienteFormulario))) {
    return 'ultima';
  }
  await pulsarAccion(editor, EDITOR.siguienteFormulario, PAUSA_MS * 4);
  await editor.waitForTimeout(PAUSA_MS);
  const actuales = await camposDeLaSeccion(editor);
  return actuales[0]?.casilla === anteriores[0]?.casilla ? 'atascado' : 'avanzo';
}

/**
 * The save shows a notice whose wording is not mapped yet: its text goes back
 * in `detalle`. Then, only to map it, the robot moves on to the signing step:
 * nothing is typed and no code is requested.
 */
async function guardarYConfirmar(
  editor: Page,
  numeroFormulario: string,
  { esperaMs }: OpcionesDiligenciamiento,
): Promise<Recorrida> {
  const guardo = await pulsarAccion(editor, /^\s*save\s*$/, esperaMs);
  await editor.waitForTimeout(PAUSA_MS * 2);
  if (!guardo) {
    return sinEditor(fallido('estructura_cambiada', `No se encontró el botón de guardar · ${await huellaDePantalla(editor)}`));
  }
  const aviso = (await mapaDeLaPantalla(editor)).avisos.join(' | ');
  const detalle = `${await huellaDePantalla(editor)} · aviso=${aviso}`;
  await pulsarAccion(editor, EDITOR.cerrarAviso, PAUSA_MS * 2);
  const mapaFirma = await mapearFirma(editor);
  const resultado = { exito: true, numeroFormulario, diferencias: [], guardado: true, detalle, mapaFirma };
  return { editor: mapaFirma.pulso === null ? null : editor, resultado };
}

function numeroDe(url: string): string {
  return /idedocumento=(\d+)/.exec(url)?.[1] ?? '';
}

function fallido(motivoFallo: MotivoFalloDian, detalle: string): ResultadoDiligenciamiento {
  return { exito: false, motivoFallo, detalle };
}
