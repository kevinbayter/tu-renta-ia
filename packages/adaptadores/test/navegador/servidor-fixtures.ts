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

import { DECLARACIONES_FICTICIAS, TITULAR_FICTICIO } from './fixtures/datos-ficticios';

import type { Server } from 'node:http';

/** Failures that can be forced to check the failure-reason mapping. */
export type ModoServidor =
  | 'normal'
  | 'credenciales_malas'
  | 'sin_declaraciones'
  | 'portal_cambiado'
  | 'portal_lento';

export interface MuiscaFalso {
  urlBase: string;
  visitas: string[];
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

 
export async function levantarMuiscaFalso(modo: ModoServidor = 'normal'): Promise<MuiscaFalso> {
  const visitas: string[] = [];
  const estado: EstadoExogena = { anio: '' };

  const servidor = createServer((peticion, respuesta) => {
    const ruta = (peticion.url ?? '').split('?')[0] ?? '';
    visitas.push(ruta);

    if (ruta.startsWith('/WebArquitectura') || ruta.startsWith('/WebIdentidadLogin')) {
      return responderHtml(respuesta, leerFixture('login.html'));
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
    if (ruta.startsWith('/WebDilIngresoFormRenta210')) {
      return responderHtml(respuesta, leerFixture('renta210.html'));
    }
    if (ruta === '/api/presentadas') {
      respuesta.writeHead(200, { 'content-type': 'application/json' });
      return respuesta.end(JSON.stringify(declaracionesSegun(modo)));
    }
    if (ruta === '/descargar/exogena') {
      return responderExogena(respuesta, estado.anio);
    }
    if (ruta.startsWith('/descargar/declaracion/')) {
      const formulario = ruta.split('/').pop() ?? '';
      return responderArchivo(respuesta, `${formulario}.pdf`, `declaracion-ficticia-${formulario}`);
    }
    // Icons and the like: an empty 200 is enough; only the src matters.
    respuesta.writeHead(200, { 'content-type': 'image/png' });
    respuesta.end('');
  });

  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  return {
    urlBase: `http://127.0.0.1:${puertoDe(servidor)}`,
    visitas,
    cerrar: () => new Promise<void>((listo) => servidor.close(() => listo())),
  };
}

function puertoDe(servidor: Server): number {
  const direccion = servidor.address();
  return typeof direccion === 'object' && direccion !== null ? direccion.port : 0;
}
