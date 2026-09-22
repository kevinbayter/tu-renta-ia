import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Static guards for rules that cannot be left to good intentions (PLAN-DIAN §4).
 * They fail in CI before the defect ships, which is the only thing that helps
 * with a secret: once leaked, there is no undo.
 */

const RAIZ = join(import.meta.dirname, '..');

function archivosBajo(dir: string, extensiones: string[]): string[] {
  const entradas = readdirSync(dir, { withFileTypes: true });
  return entradas.flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      return entrada.name === 'node_modules' ? [] : archivosBajo(ruta, extensiones);
    }
    return extensiones.some((e) => ruta.endsWith(e)) ? [ruta] : [];
  });
}

function existe(ruta: string): boolean {
  try {
    return statSync(ruta).isDirectory();
  } catch {
    return false;
  }
}

const CARPETAS_FUENTE = ['packages/core/src', 'packages/adaptadores/src', 'apps/web'];

/**
 * The only two places where the password may leave its wrapper. Adding one
 * means editing this list, which is exactly when someone must justify it.
 */
const SALIDAS_AUTORIZADAS = [
  // Written into the portal form: the legitimate final destination.
  '/packages/adaptadores/src/dian/sesion-muisca.ts',
  // Process boundary: travels to the isolated worker over Docker's network.
  '/packages/adaptadores/src/dian/conexion-dian-remota.ts',
  // Escrita en la ventana de firma: la contraseña de la firma electrónica ES
  // la de la cuenta (Res. 000227 de 2025, art. 1.7.4.2). Se revela aquí, al
  // escribirla, y no antes: así no viaja en claro por el flujo de firma.
  '/packages/adaptadores/src/dian/campos-firma-210.ts',
];

describe('la contraseña de la DIAN no puede escaparse', () => {
  it('revelar() solo aparece en los puntos de salida autorizados', () => {
    // Anywhere else means someone took the value out of the Secreto, and that
    // is where it ends up in a log, a response or the database.
    const archivosConUso = CARPETAS_FUENTE.filter((c) => existe(join(RAIZ, c)))
      .flatMap((carpeta) => archivosBajo(join(RAIZ, carpeta), ['.ts', '.tsx']))
      .filter((archivo) => !archivo.includes('.next'))
      .filter((archivo) => readFileSync(archivo, 'utf8').includes('.revelar()'))
      .map((archivo) => archivo.replace(RAIZ, ''));
    expect(archivosConUso.sort()).toEqual([...SALIDAS_AUTORIZADAS].sort());
  });

  it('nadie imprime la contraseña por consola', () => {
    const sospechosas = CARPETAS_FUENTE.filter((c) => existe(join(RAIZ, c)))
      .flatMap((carpeta) => archivosBajo(join(RAIZ, carpeta), ['.ts', '.tsx']))
      .filter((archivo) => !archivo.includes('.next'))
      .flatMap((archivo) =>
        readFileSync(archivo, 'utf8')
          .split('\n')
          .filter((linea) => /console\.\w+\(/.test(linea) && /contrasena|password|credenciales/i.test(linea))
          .map((linea) => `${archivo.replace(RAIZ, '')}: ${linea.trim()}`),
      );
    expect(sospechosas).toEqual([]);
  });

  it('las trazas de Playwright están prohibidas: graban el DOM y la contraseña', () => {
    // tracing.start, recordVideo and recordHar store the whole session.
    const ficheros = ['conexion-muisca', 'sesion-muisca', 'exogena-muisca', 'declaraciones-muisca'];
    ficheros.forEach((nombre) => {
      const codigo = readFileSync(join(RAIZ, `packages/adaptadores/src/dian/${nombre}.ts`), 'utf8');
      expect(codigo).not.toMatch(/tracing\.start|recordVideo|recordHar/);
    });
  });
});

describe('las fixtures del MUISCA falso no pueden traer datos reales', () => {
  it('todo número largo de las fixtures es evidentemente inventado', () => {
    // The likeliest failure mode here is pasting HTML from a real mapping
    // session: it would carry the taxpayer's ID and form numbers.
    const carpeta = join(RAIZ, 'packages/adaptadores/test/navegador');
    const contenido = archivosBajo(carpeta, ['.html', '.ts']).map((a) => ({
      archivo: a.replace(RAIZ, ''),
      texto: readFileSync(a, 'utf8'),
    }));
    const reales = contenido.flatMap(({ archivo, texto }) =>
      [...texto.matchAll(/\b\d{7,}\b/g)]
        .map((m) => m[0])
        .filter((numero) => !esInventado(numero))
        .map((numero) => `${archivo}: ${numero}`),
    );
    expect(reales).toEqual([]);
  });
});

/** Made up = all digits identical, or the declared fictitious document. */
function esInventado(numero: string): boolean {
  return new Set(numero).size === 1 || numero === '1000000001';
}

/**
 * Las pruebas se escriben calcando pantallas del portal, y de ahí es fácil
 * arrastrar más de la cuenta, también fuera de `test/navegador`. No se listan
 * datos a prohibir —listarlos aquí sería publicarlos—: se exige que todo lo que
 * TIENE FORMA de dato personal sea de los ficticios. Lista blanca, no negra.
 */
describe('ninguna prueba del adaptador lleva datos personales reales', () => {
  const contenido = archivosBajo(join(RAIZ, 'packages/adaptadores/test'), ['.html', '.ts', '.json']).map((a) => ({
    archivo: a.replace(RAIZ, ''),
    texto: readFileSync(a, 'utf8'),
  }));
  const hallazgos = (patron: RegExp, esFicticio: (valor: string) => boolean): string[] =>
    contenido.flatMap(({ archivo, texto }) =>
      [...texto.matchAll(patron)]
        .map((m) => m[1] ?? '')
        .filter((valor) => !esFicticio(valor))
        .map((valor) => `${archivo}: ${valor}`),
    );

  it('los números de formulario de la DIAN son inventados', () => {
    // Uno real tiene trece cifras sin patrón (2118…). Los de prueba repiten una
    // sola o son la secuencia 1234…
    const ficticio = (valor: string) => new Set(valor).size === 1 || valor === '1234567890123';
    expect(hallazgos(/\b(\d{13})\b/g, ficticio)).toEqual([]);
  });

  it('toda cédula o NIT que acompaña a una persona es la ficticia', () => {
    const documentos = /(?:NIT|C\.?C\.?|usuario)\s*:?\s*(?:\d{2}-)?(\d{6,10})\b/gi;
    expect(hallazgos(documentos, (valor) => valor === '1000000001')).toEqual([]);
  });

  it('los nombres de personas son ficticios', () => {
    const nombres = /Nombre:\s*([A-ZÁÉÍÓÚÑ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ]{3,}){1,3})/g;
    expect(hallazgos(nombres, (valor) => /\b(PEREZ|FICTICIO|PRUEBA)\b/.test(valor))).toEqual([]);
  });
});
