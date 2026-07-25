import { crearAutorizacion, permiteAlcance, textoAutorizacion } from '@turenta/core';
import { NextResponse } from 'next/server';

import { obtenerConexionDian, obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

import type { CredencialesDian, MotivoFalloDian, TipoDocumentoDian } from '@turenta/core';

export const maxDuration = 120;

interface CuerpoConexion {
  tipoDocumento?: string;
  numeroDocumento?: string;
  contrasena?: string;
  titular?: string;
  anioGravable?: number;
}

/**
 * Descarga la exógena del usuario desde el MUISCA. Las credenciales llegan,
 * se usan y se descartan en esta misma petición: NUNCA se guardan (PLAN-DIAN §1).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ mensaje: 'Debes iniciar sesión' }, { status: 401 });
  }
  const cuerpo = (await request.json()) as CuerpoConexion;
  const credenciales = extraerCredenciales(cuerpo);
  if (!credenciales) {
    return NextResponse.json({ mensaje: 'Faltan datos para conectar' }, { status: 400 });
  }
  try {
    return await ejecutarDescarga(credenciales, cuerpo, sesion.usuarioId);
  } finally {
    // Sobrescribir la referencia: nada de credenciales sobrevive a esta petición.
    credenciales.contrasena = '';
  }
}

async function ejecutarDescarga(
  credenciales: CredencialesDian,
  cuerpo: CuerpoConexion,
  usuarioId: string,
): Promise<NextResponse> {
  const anioGravable = cuerpo.anioGravable ?? 2025;
  const titular = cuerpo.titular ?? credenciales.numeroDocumento;
  const autorizacion = crearAutorizacion(
    {
      titularIdentificacion: titular,
      operadorUsuarioId: usuarioId,
      alcances: ['leer_exogena'],
      textoAceptado: textoAutorizacion(titular, ['leer_exogena']),
    },
    new Date(),
  );
  if (!permiteAlcance(autorizacion, 'leer_exogena', new Date())) {
    return NextResponse.json({ mensaje: 'La autorización no es válida' }, { status: 403 });
  }
  await registrarAutorizacion(usuarioId, titular);
  const resultado = await obtenerConexionDian().descargarExogena(credenciales, {
    titularIdentificacion: titular,
    operadorUsuarioId: usuarioId,
    anioGravable,
  });
  if (!resultado.exito || !resultado.contenido) {
    return NextResponse.json({ mensaje: mensajeDeFallo(resultado.motivoFallo) }, { status: 502 });
  }
  return NextResponse.json({
    nombreArchivo: resultado.nombreArchivo ?? 'exogena.xlsx',
    contenidoBase64: Buffer.from(resultado.contenido).toString('base64'),
  });
}

/** Evidencia de la autorización (sin credenciales): quién autorizó, cuándo y para qué. */
async function registrarAutorizacion(usuarioId: string, titular: string): Promise<void> {
  await obtenerRepositorio()
    .registrarActividad(usuarioId, {
      tipo: 'dian_conexion_autorizada',
      descripcion: `Conexión con la DIAN autorizada para consultar la exógena de la cédula ${titular}`,
    })
    .catch(() => null);
}

function extraerCredenciales(cuerpo: CuerpoConexion): CredencialesDian | null {
  const numeroDocumento = (cuerpo.numeroDocumento ?? '').replace(/\D/g, '');
  const contrasena = cuerpo.contrasena ?? '';
  if (numeroDocumento.length < 5 || contrasena.length < 4) {
    return null;
  }
  return {
    tipoDocumento: (cuerpo.tipoDocumento ?? 'CC') as TipoDocumentoDian,
    numeroDocumento,
    contrasena,
  };
}

const MENSAJES: Record<MotivoFalloDian, string> = {
  credenciales_invalidas: 'La DIAN no aceptó esos datos. Revisa tu documento y contraseña.',
  portal_no_disponible: 'El portal de la DIAN no está respondiendo en este momento.',
  estructura_cambiada: 'El portal de la DIAN cambió y no pudimos completar la descarga.',
  requiere_verificacion: 'La DIAN pidió una verificación adicional que debes hacer tú directamente.',
  tiempo_agotado: 'La DIAN tardó demasiado en responder.',
  sin_declaracion: 'No encontramos una declaración presentada de ese año en tu cuenta.',
  desconocido: 'No pudimos completar la conexión.',
};

function mensajeDeFallo(motivo: MotivoFalloDian | undefined): string {
  return MENSAJES[motivo ?? 'desconocido'];
}
