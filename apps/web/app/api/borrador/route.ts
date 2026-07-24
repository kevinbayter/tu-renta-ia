import { generarPdfBorrador210 } from '@turenta/adaptadores';
import { fechaVencimiento, obtenerConstantes } from '@turenta/motor-fiscal';
import { NextResponse } from 'next/server';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

interface CuerpoBorrador {
  declarante: { nombres: string; apellidos: string; identificacion: string };
  resultado: ResultadoDeclaracion;
}

/** Genera y descarga el PDF del borrador 210 con la fecha límite del declarante. */
export async function POST(request: Request): Promise<Response> {
  const cuerpo = (await request.json()) as CuerpoBorrador;
  try {
    const constantes = obtenerConstantes(cuerpo.resultado.anioGravable);
    const vencimiento = fechaVencimiento(cuerpo.declarante.identificacion, constantes);
    const pdf = await generarPdfBorrador210({ ...cuerpo.declarante, fechaVencimiento: vencimiento }, cuerpo.resultado);
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
