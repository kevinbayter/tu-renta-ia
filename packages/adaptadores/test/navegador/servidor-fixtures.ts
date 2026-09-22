/**
 * Fake MUISCA for the adapter tests. Serves hand-written fixtures and records
 * visits in order, so tests can assert the flow walks the right steps and not
 * merely that it finished without throwing.
 *
 * Listens on port 0 so several test files can run in parallel.
 */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

import { DATOS_210 } from './ayudas-muisca';
import { DECLARACIONES_FICTICIAS, TITULAR_FICTICIO } from './fixtures/datos-ficticios';

import type { Server, ServerResponse } from 'node:http';

/** Failures that can be forced to check the failure-reason mapping. */
export type ModoServidor =
  | 'normal'
  | 'credenciales_malas'
  | 'sin_declaraciones'
  | 'portal_cambiado'
  | 'portal_lento'
  /** The portal's own calculation disagrees with the engine: nothing may be saved. */
  | 'calculo_distinto'
  /** A draft already exists: the SPA lists drafts instead of the suggestion. */
  | 'con_borrador'
  /** The form ends early: the robot must not save a draft it did not fully check. */
  | 'recorrido_corto'
  /** The portal demands the dynamic code to sign. */
  | 'firma_con_codigo'
  /** Signed in an earlier attempt: only "Presentar" is left. */
  | 'ya_firmada'
  /** La cuenta no tiene firma electrónica vigente: el portal ni siquiera abre el formulario. */
  | 'sin_firma_electronica'
  /** El portal abre en el paso de firma, con el borrador completo y sin firmar. */
  | 'en_paso_firma'
  /** Firmante ya autorizado: el portal no pide "Autorizar" y tarda en habilitar "Firmar". */
  | 'firma_ya_autorizada'
  /** La firma vive dentro de un iframe que tapa el diálogo; los botones de fuera están apagados. */
  | 'firma_en_marco'
  /** El portal pide código y el aviso nunca llega a la bandeja: hay que pedírselo al usuario. */
  | 'codigo_sin_aviso'
  /** Firmada en un intento anterior, pero el paso "Firmar" no lo delata: solo falta presentar. */
  | 'firmada_sin_delatar';

export interface MuiscaFalso {
  urlBase: string;
  visitas: string[];
  /** What the draft editor saved (null = never saved). */
  borradorGuardado: () => Record<string, string> | null;
  /** The code the robot typed when signing (null = it never signed). */
  firmadoCon: () => string | null;
  cerrar: () => Promise<void>;
}

const CARPETA = join(import.meta.dirname, 'fixtures');

function leerFixture(nombre: string): string {
  return readFileSync(join(CARPETA, nombre), 'utf8');
}

function cuerpoDe(peticion: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolver) => {
    let datos = '';
    peticion.on('data', (trozo) => (datos += String(trozo)));
    peticion.on('end', () => resolver(datos));
  });
}

interface Credenciales {
  numDocumento?: string;
  password?: string;
  acepta?: boolean;
}

function credencialesValidas(datos: Credenciales): boolean {
  return (
    datos.numDocumento === TITULAR_FICTICIO.documento &&
    datos.password === TITULAR_FICTICIO.contrasena &&
    datos.acepta === true
  );
}

/** Downloadable attachment: what the adapter must capture as a download event. */
const esPdfDelPortal = (ruta: string) => ruta.startsWith('/borrador/') || ruta.startsWith('/acuse/');
const nombreDelPdf = (ruta: string) => (ruta.startsWith('/acuse/') ? 'acuse.pdf' : 'borrador.pdf');

/** El portal entrega PDFs: el borrador con sus cifras y el acuse de la presentación. */
function documentoDelPortal(ruta: string, borrador: Record<string, string> | null): Promise<Uint8Array> {
  return ruta.startsWith('/acuse/')
    ? Promise.resolve(new TextEncoder().encode('acuse-ficticio-de-prueba'))
    : pdfDelBorrador(borrador);
}

function responderPdf(respuesta: import('node:http').ServerResponse, nombre: string, datos: Uint8Array): void {
  respuesta.writeHead(200, { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${nombre}"` });
  respuesta.end(Buffer.from(datos));
}

function responderArchivo(respuesta: import('node:http').ServerResponse, nombre: string, contenido: string): void {
  respuesta.writeHead(200, {
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename="${nombre}"`,
  });
  respuesta.end(contenido);
}

function responderHtml(respuesta: import('node:http').ServerResponse, html: string): void {
  respuesta.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  respuesta.end(html);
}

/**
 * How long the fake portal takes to open its modal and to register the year.
 * Anything that races these delays is a bug: production did, and downloaded
 * nothing.
 */
const RETARDO_NORMAL_MS = 120;
const RETARDO_LENTO_MS = 900;

function retardoDe(modo: ModoServidor): number {
  return modo === 'portal_lento' ? RETARDO_LENTO_MS : RETARDO_NORMAL_MS;
}

function dashboardSegun(modo: ModoServidor): string {
  const html = leerFixture('dashboard.html').replace('__RETARDO__', String(retardoDe(modo)));
  // 'portal_cambiado' simulates DIAN renaming controls: ids stop matching.
  return modo === 'portal_cambiado' ? html.replaceAll('btnExogenaGenerar', 'btnOtroNombre') : html;
}

/** The chosen year lives in the session, exactly as it does in MUISCA. */
interface EstadoExogena {
  anio: string;
}

/** RichFaces postback: the year only counts once the server has answered. */
function registrarAnio(
  estado: EstadoExogena,
  anio: string,
  respuesta: import('node:http').ServerResponse,
  retardoMs: number,
): void {
  setTimeout(() => {
    estado.anio = anio;
    respuesta.writeHead(200, { 'content-type': 'text/xml' });
    respuesta.end('<partial-response/>');
  }, retardoMs);
}

/**
 * With no year registered the portal answers with a page instead of a file:
 * no download event, no error either. That silence is the failure mode this
 * fixture exists to reproduce.
 */
function responderExogena(respuesta: import('node:http').ServerResponse, anio: string): void {
  if (anio === '') {
    return responderHtml(respuesta, '<p>Seleccione un año</p>');
  }
  responderArchivo(respuesta, `reporteExogena${anio}.xlsx`, `exogena-ficticia-${anio}`);
}

function declaracionesSegun(modo: ModoServidor): typeof DECLARACIONES_FICTICIAS | [] {
  return modo === 'sin_declaraciones' ? [] : DECLARACIONES_FICTICIAS;
}

 
function editorSegun(modo: ModoServidor): string {
  return leerFixture('editor210.html')
    .replace('__DESVIO__', modo === 'calculo_distinto' ? '1000' : '0')
    .replace('__CORTO__', String(modo === 'recorrido_corto'))
    .replace('__CON_CODIGO__', String(modo === 'firma_con_codigo' || modo === 'codigo_sin_aviso'))
    .replace('__YA_FIRMADA__', String(modo === 'ya_firmada'))
    .replace('__EN_FIRMA__', String(modo === 'en_paso_firma'))
    .replace('__AUTORIZADA__', String(modo === 'firma_ya_autorizada'))
    .replace('__EN_MARCO__', String(modo === 'firma_en_marco'))
    .replace('__YA_FIRMO__', String(modo === 'firmada_sin_delatar'));
}

/**
 * La bandeja del portal: el aviso con el código solo aparece DESPUÉS de
 * pedirlo, que es lo que el robot espera para saber que ya llegó.
 */
const CUERPO_PREVIO = 'Comunicación de servicio. Generación de la firma electrónica exitosa.';
const CUERPO_CODIGO =
  'Comunicación de servicio Se ha generado una clave dinámica Señor (a) usuario (a): PEREZ PEREZ JUANA ' +
  'A continuación, se entrega la clave dinámica solicitada para realizar el trámite: ZX99120 ' +
  'Tu clave dinámica está vigente desde 20/09/2026 03:59:18 PM hasta 20/09/2026 05:59:18 PM';

function comunicadosSegun(pedido: boolean): string {
  const fila = pedido
    ? '<tr><td>Se informa clave dinámica - Proceso de firmado electrónico</td><td>20/09/2026 15:59</td></tr>'
    : '';
  return leerFixture('comunicados.html')
    .replace('__FILA_CODIGO__', fila)
    .replace('__CUERPO__', pedido ? CUERPO_CODIGO : CUERPO_PREVIO);
}

/** The portal's static screens; null when the route is not one of them. */
function htmlSegun(ruta: string, modo: ModoServidor, codigoPedido: boolean): string | null {
  if (ruta.startsWith('/WebArquitectura') || ruta.startsWith('/WebIdentidadLogin')) {
    return leerFixture('login.html');
  }
  if (ruta === '/firma-marco') {
    return leerFixture('firma-iframe.html');
  }
  if (ruta.startsWith('/WebComunicaciones')) {
    return comunicadosSegun(codigoPedido);
  }
  if (ruta.startsWith('/WebDilIngresoFormRenta210')) {
    return leerFixture('renta210.html')
      .replace('__CON_BORRADOR__', String(modo === 'con_borrador'))
      .replace('__SIN_FIRMA__', String(modo === 'sin_firma_electronica'));
  }
  return ruta.startsWith('/WebFormRenta210v18') ? editorSegun(modo) : null;
}

export async function levantarMuiscaFalso(modo: ModoServidor = 'normal'): Promise<MuiscaFalso> {
  const visitas: string[] = [];
  const estado: EstadoExogena = { anio: '' };
  const abreEnFirma =
    modo === 'en_paso_firma' || modo === 'firma_ya_autorizada' || modo === 'firma_en_marco' || modo === 'firmada_sin_delatar';
  let borrador: Record<string, string> | null = abreEnFirma ? BORRADOR_PREVIO : null;
  let firmadoCon: string | null = null;
  let codigoPedido = false;
  const anotarDelEditor = (ruta: string, crudo: string) => {
    if (ruta === '/editor/firmar') {
      firmadoCon = crudo;
      return;
    }
    borrador = JSON.parse(crudo) as Record<string, string>;
  };

  const servidor = createServer((peticion, respuesta) => {
    const ruta = (peticion.url ?? '').split('?')[0] ?? '';
    visitas.push(ruta);

    const html = htmlSegun(ruta, modo, codigoPedido);
    if (html !== null) {
      return responderHtml(respuesta, html);
    }
    if (ruta === '/autenticar') {
      return void cuerpoDe(peticion).then((crudo) => {
        const datos = JSON.parse(crudo || '{}') as Credenciales;
        const ok = modo !== 'credenciales_malas' && credencialesValidas(datos);
        respuesta.writeHead(200, { 'content-type': 'application/json' });
        respuesta.end(JSON.stringify({ ok, mensaje: ok ? '' : 'Las credenciales no coinciden' }));
      });
    }
    if (ruta.startsWith('/WebDashboard') && peticion.method === 'POST') {
      return void cuerpoDe(peticion).then((anio) =>
        registrarAnio(estado, anio, respuesta, retardoDe(modo)),
      );
    }
    if (ruta.startsWith('/WebDashboard')) {
      return responderHtml(respuesta, dashboardSegun(modo));
    }
    if (ruta === '/editor/solicitar-codigo') {
      codigoPedido = modo !== 'codigo_sin_aviso';
      respuesta.writeHead(200, { 'content-type': 'application/json' });
      return respuesta.end('{}');
    }
    if (ruta === '/editor/guardar' || ruta === '/editor/firmar') {
      return void cuerpoDe(peticion).then((crudo) => {
        anotarDelEditor(ruta, crudo);
        respuesta.writeHead(200, { 'content-type': 'application/json' });
        respuesta.end('{}');
      });
    }
    if (atenderDescarga({ ruta, respuesta, modo, anio: estado.anio, borrador })) {
      return;
    }
    // Icons and the like: an empty 200 is enough; only the src matters.
    respuesta.writeHead(200, { 'content-type': 'image/png' });
    respuesta.end('');
  });

  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  return {
    urlBase: `http://127.0.0.1:${puertoDe(servidor)}`,
    visitas,
    borradorGuardado: () => borrador,
    firmadoCon: () => firmadoCon,
    cerrar: () => new Promise<void>((listo) => servidor.close(() => listo())),
  };
}

interface Descarga {
  ruta: string;
  respuesta: ServerResponse;
  modo: ModoServidor;
  anio: string;
  borrador: Record<string, string> | null;
}

function atenderDescarga({ ruta, respuesta, modo, anio, borrador }: Descarga): boolean {
  if (esPdfDelPortal(ruta)) {
    void documentoDelPortal(ruta, borrador).then((datos) =>
      responderPdf(respuesta, nombreDelPdf(ruta), datos),
    );
    return true;
  }
  if (ruta === '/api/presentadas') {
    respuesta.writeHead(200, { 'content-type': 'application/json' });
    respuesta.end(JSON.stringify(declaracionesSegun(modo)));
    return true;
  }
  if (ruta === '/descargar/exogena') {
    responderExogena(respuesta, anio);
    return true;
  }
  return descargaDeDeclaracion(ruta, respuesta);
}

function descargaDeDeclaracion(ruta: string, respuesta: ServerResponse): boolean {
  if (!ruta.startsWith('/descargar/declaracion/')) {
    return false;
  }
  const formulario = ruta.split('/').pop() ?? '';
  responderArchivo(respuesta, `${formulario}.pdf`, `declaracion-ficticia-${formulario}`);
  return true;
}

function puertoDe(servidor: Server): number {
  const direccion = servidor.address();
  return typeof direccion === 'object' && direccion !== null ? direccion.port : 0;
}

/**
 * PDF real (pdf-lib) con las cifras del borrador: el robot lo lee para
 * verificar sin recorrer el formulario, igual que hace con el del portal.
 */
async function pdfDelBorrador(borrador: Record<string, string> | null): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const documento = await PDFDocument.create();
  const fuente = await documento.embedFont(StandardFonts.Helvetica);
  const pagina = documento.addPage();
  pagina.drawText(`Declaracion 210 ${Object.values(borrador ?? {}).join(' ')}`.slice(0, 900), {
    x: 20,
    y: 700,
    size: 8,
    font: fuente,
  });
  return documento.save();
}

/**
 * El borrador que ya estaba en el portal cuando abre en el paso de firma: las
 * mismas cifras del caso de prueba, para que verificarlo contra su PDF cuadre.
 */
const BORRADOR_PREVIO: Record<string, string> = Object.fromEntries(
  Object.entries(DATOS_210.casillas).map(([casilla, valor]) => [casilla, String(valor)]),
);
