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
  '/packages/adaptadores/src/dian/conexion-muisca.ts',
  // Process boundary: travels to the isolated worker over Docker's network.
  '/packages/adaptadores/src/dian/conexion-dian-remota.ts',
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
    const adaptador = readFileSync(
      join(RAIZ, 'packages/adaptadores/src/dian/conexion-muisca.ts'),
      'utf8',
    );
    expect(adaptador).not.toMatch(/tracing\.start|recordVideo|recordHar/);
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
