import { clasificarResultado } from '@turenta/core';
import { NextResponse } from 'next/server';

import { obtenerLlm, obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';
import { formatearFechaLarga, vencimientosDe } from '@/lib/vencimientos';

import type { DeclaracionResumen, PerfilUsuario } from '@turenta/core';

export const maxDuration = 120;

interface CuerpoAsistente {
  mensajes: { rol: 'user' | 'assistant'; contenido: string }[];
}

/** Asistente Fiscal IA: responde dudas con el contexto REAL del usuario; jamás calcula impuestos. */
export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const cuerpo = (await request.json()) as CuerpoAsistente;
  const mensajes = (cuerpo.mensajes ?? []).slice(-12);
  if (mensajes.length === 0) {
    return NextResponse.json({ error: 'Escribe una pregunta' }, { status: 400 });
  }
  try {
    const respuesta = await obtenerLlm().conversar({
      system: await construirSystem(sesion.usuarioId),
      mensajes,
    });
    return NextResponse.json({ respuesta });
  } catch {
    return NextResponse.json({ error: 'El asistente no está disponible en este momento' }, { status: 502 });
  }
}

async function construirSystem(usuarioId: string): Promise<string> {
  const repositorio = obtenerRepositorio();
  const [perfil, declaraciones] = await Promise.all([
    repositorio.obtenerPerfil(usuarioId),
    repositorio.listarDeclaraciones(usuarioId),
  ]);
  return `Eres el Asistente Fiscal de TuRenta AI (renta personas naturales, Colombia, año gravable 2025).

REGLAS:
- Responde en español simple y cálido, máximo 5 frases.
- NUNCA calcules impuestos ni inventes cifras: el cálculo lo hace el motor determinista de la plataforma. Para estimaciones dirige al "Simulador" de esta misma página; para el valor real, al flujo de declaración.
- Usa el CONTEXTO del usuario cuando aplique y di de dónde sale el dato ("según tu declaración guardada...").
- Si la pregunta excede tu alcance (dividendos, activos en el exterior, sucesiones), dilo de frente y sugiere un contador.
- Cierra temas sensibles recordando: "esto es orientación general, no asesoría profesional".

CONTEXTO DEL USUARIO:
${resumenContexto(perfil, declaraciones)}`;
}

function resumenContexto(perfil: PerfilUsuario | null, declaraciones: DeclaracionResumen[]): string {
  const lineas = [`Usuario: ${perfil ? `${perfil.nombres} ${perfil.apellidos}` : 'sin perfil completo'}.`];
  const vencimientos = vencimientosDe(declaraciones, new Date());
  declaraciones.forEach((d) => lineas.push(resumenDeclaracion(d)));
  vencimientos.forEach((v) =>
    lineas.push(`Vencimiento de ${v.titular}: ${formatearFechaLarga(v.fechaIso)} (faltan ${String(v.dias)} días).`),
  );
  if (declaraciones.length === 0) {
    lineas.push('Aún no tiene declaraciones creadas.');
  }
  return lineas.join('\n');
}

function resumenDeclaracion(d: DeclaracionResumen): string {
  const estado = clasificarResultado(d.saldoAFavor, d.saldoAPagar);
  const detalle = {
    en_progreso: `en progreso (paso ${String(d.progreso.paso)} de 4)`,
    saldo_a_favor: `calculada con saldo a favor de $${(d.saldoAFavor ?? 0).toLocaleString('es-CO')}`,
    a_pagar: `calculada con saldo a pagar de $${(d.saldoAPagar ?? 0).toLocaleString('es-CO')}`,
    sin_saldo: 'calculada sin saldo (ni a favor ni a pagar)',
  }[estado];
  return `Declaración ${String(d.anioGravable)} de ${d.titular.nombres} ${d.titular.apellidos} (${d.titular.esPropia ? 'propia' : 'tercero'}): ${detalle}.`;
}
