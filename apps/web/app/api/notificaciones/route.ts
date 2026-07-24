import { notificacionesDeVencimiento } from '@turenta/core';
import { NextResponse } from 'next/server';

import { obtenerEmail, obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';
import { formatearFechaLarga, vencimientosDe } from '@/lib/vencimientos';

import type { NotificacionNueva } from '@turenta/core';

/**
 * Lista las notificaciones y, de paso, evalúa las reglas de vencimiento de forma
 * idempotente (la clave única evita duplicados). Las críticas también van por correo.
 */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  await evaluarVencimientos(sesion.usuarioId, sesion.email);
  const notificaciones = await obtenerRepositorio().listarNotificaciones(sesion.usuarioId);
  return NextResponse.json({ notificaciones });
}

/** Marca todas como leídas. */
export async function POST(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  await obtenerRepositorio().marcarNotificacionesLeidas(sesion.usuarioId);
  return NextResponse.json({ ok: true });
}

async function evaluarVencimientos(usuarioId: string, email: string): Promise<void> {
  const repositorio = obtenerRepositorio();
  const lista = await repositorio.listarDeclaraciones(usuarioId);
  const vencimientos = vencimientosDe(lista, new Date()).map((v) => ({
    titular: v.titular,
    identificacion: v.identificacion,
    anioGravable: v.anioGravable,
    fechaLegible: formatearFechaLarga(v.fechaIso),
    dias: v.dias,
  }));
  const nuevas = notificacionesDeVencimiento(vencimientos);
  await Promise.all(nuevas.map((n) => crearYAvisar(usuarioId, email, n)));
}

async function crearYAvisar(usuarioId: string, email: string, notificacion: NotificacionNueva): Promise<void> {
  const creada = await obtenerRepositorio().crearNotificacionSiNueva(usuarioId, notificacion);
  if (!creada || !notificacion.esCritica) {
    return;
  }
  await obtenerEmail()
    .enviarAviso(email, notificacion.titulo, notificacion.cuerpo)
    .catch(() => null);
}
