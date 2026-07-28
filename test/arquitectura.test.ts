import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Tests de arquitectura (patrón hexagonal): verifican con los imports REALES
 * que las capas hexagonales no se mezclen. Complementan las reglas ESLint.
 *
 *   apps/web → core → motor-fiscal   |   adaptadores implementa puertos de core
 */

const RAIZ = join(import.meta.dirname, '..');

function listarArchivosTs(dir: string): string[] {
  const entradas = readdirSync(dir);
  return entradas.flatMap((nombre) => expandirEntrada(join(dir, nombre)));
}

function expandirEntrada(ruta: string): string[] {
  if (statSync(ruta).isDirectory()) {
    return listarArchivosTs(ruta);
  }
  return ruta.endsWith('.ts') || ruta.endsWith('.tsx') ? [ruta] : [];
}

function importsDe(archivo: string): string[] {
  const contenido = readFileSync(archivo, 'utf8');
  const regex = /(?:^|\n)\s*(?:import|export)[^'"\n]*from\s+['"]([^'"]+)['"]/g;
  return [...contenido.matchAll(regex)].map((m) => m[1] as string);
}

function violaciones(carpeta: string, prohibidos: RegExp[]): string[] {
  const archivos = listarArchivosTs(join(RAIZ, carpeta));
  return archivos.flatMap((archivo) =>
    importsDe(archivo)
      .filter((imp) => prohibidos.some((p) => p.test(imp)))
      .map((imp) => `${archivo.replace(RAIZ, '')} importa "${imp}"`),
  );
}

const LIBS_INFRA = [/^next(\/|$)/, /^react(\/|$)/, /^@prisma\//, /^ai$/, /^exceljs$/, /^pdf-parse/, /^node:/];

describe('arquitectura hexagonal', () => {
  it('motor-fiscal es dominio puro: no importa NADA externo (solo relativos)', () => {
    const prohibidos = [/^[^.]/]; // cualquier import que no sea relativo
    expect(violaciones('packages/motor-fiscal/src', prohibidos)).toEqual([]);
  });

  it('core no importa adaptadores, frameworks ni node builtins', () => {
    const prohibidos = [/^@turenta\/adaptadores/, /^zod$/, ...LIBS_INFRA];
    expect(violaciones('packages/core/src', prohibidos)).toEqual([]);
  });

  it('core solo conoce motor-fiscal y shared dentro del workspace', () => {
    const archivos = listarArchivosTs(join(RAIZ, 'packages/core/src'));
    const internos = archivos
      .flatMap(importsDe)
      .filter((imp) => imp.startsWith('@turenta/'))
      .filter((imp) => !/^@turenta\/(motor-fiscal|shared)/.test(imp));
    expect(internos).toEqual([]);
  });

  it('adaptadores no importa apps ni el paquete web', () => {
    const prohibidos = [/^@turenta\/web/, /apps\/web/];
    expect(violaciones('packages/adaptadores/src', prohibidos)).toEqual([]);
  });

  it('playwright solo vive en el adaptador del MUISCA', () => {
    // Si se cuela en otro sitio, apps/web vuelve a arrastrar Chromium y el
    // aislamiento del worker (PLAN-DIAN §2) deja de existir.
    const archivos = [
      ...listarArchivosTs(join(RAIZ, 'packages')),
      ...listarArchivosTs(join(RAIZ, 'apps/web/app')),
      ...listarArchivosTs(join(RAIZ, 'apps/web/components')),
      ...listarArchivosTs(join(RAIZ, 'apps/web/server')),
    ];
    const conPlaywright = archivos
      .filter((archivo) => !archivo.includes('node_modules') && !archivo.includes('/test/'))
      .filter((archivo) => importsDe(archivo).some((imp) => /^playwright/.test(imp)))
      .map((archivo) => archivo.replace(RAIZ, ''));
    const fuera = conPlaywright.filter((a) => !a.startsWith('/packages/adaptadores/src/dian/'));
    expect(fuera).toEqual([]);
  });

  it('la UI no habla con adaptadores: solo con core y con rutas HTTP', () => {
    const prohibidos = [/^@turenta\/adaptadores/];
    expect(violaciones('apps/web/components', prohibidos)).toEqual([]);
  });

  it('shared no contiene lógica de negocio (no importa motor-fiscal ni core)', () => {
    const prohibidos = [/^@turenta\/(motor-fiscal|core|adaptadores)/];
    expect(violaciones('packages/shared/src', prohibidos)).toEqual([]);
  });
});
