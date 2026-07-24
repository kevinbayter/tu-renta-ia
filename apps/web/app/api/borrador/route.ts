import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generarBorradorCompleto } from '@turenta/adaptadores';
import { fechaVencimiento, obtenerConstantes } from '@turenta/motor-fiscal';
import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

interface CuerpoBorrador {
  declarante: { nombres: string; apellidos: string; identificacion: string };
  resultado: ResultadoDeclaracion;
}

const RUTAS_PLANTILLA = [
  join(process.cwd(), '../../packages/adaptadores/plantillas/formulario-210-ag2025.pdf'),
  join(process.cwd(), 'plantillas/formulario-210-ag2025.pdf'),
];

/** Actividad "borrador descargado" (si hay sesión); nunca rompe la descarga. */
async function registrarDescarga(anioGravable: number): Promise<void> {
  const sesion = await leerSesion().catch(() => null);
  if (!sesion) {
    return;
  }
  await obtenerRepositorio()
    .registrarActividad(sesion.usuarioId, {
      tipo: 'borrador_descargado',
      descripcion: `Borrador 210 del año ${String(anioGravable)} descargado`,
    })
    .catch(() => null);
}

function cargarPlantilla(): Uint8Array {
  const ruta = RUTAS_PLANTILLA.find((r) => existsSync(r));
  if (!ruta) {
    throw new Error('Plantilla del formulario 210 no encontrada');
  }
  return new Uint8Array(readFileSync(ruta));
}

/** Genera y descarga el borrador: formulario 210 oficial diligenciado + resumen. */
export async function POST(request: Request): Promise<Response> {
  const cuerpo = (await request.json()) as CuerpoBorrador;
  try {
    const constantes = obtenerConstantes(cuerpo.resultado.anioGravable);
    const vencimiento = fechaVencimiento(cuerpo.declarante.identificacion, constantes);
    const pdf = await generarBorradorCompleto(
      cargarPlantilla(),
      { ...cuerpo.declarante, fechaVencimiento: vencimiento },
      cuerpo.resultado,
    );
    await registrarDescarga(cuerpo.resultado.anioGravable);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="borrador-210-ag${String(cuerpo.resultado.anioGravable)}.pdf"`,
      },
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error generando el borrador';
    return NextResponse.json({ error: mensaje }, { status: 422 });
  }
}
