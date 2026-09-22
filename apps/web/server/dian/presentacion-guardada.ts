/**
 * Una declaración presentada deja de ser un borrador: TuRenta guarda el número
 * de formulario y la fecha del acuse para no volver a ofrecer presentarla.
 *
 * El acuse en sí no se guarda aquí: se le entrega al usuario en el momento y,
 * después, se descarga del portal con el flujo de declaraciones presentadas.
 */

import { obtenerRepositorio } from '@/server/composicion';

export interface Presentacion {
  numeroFormulario: string;
  presentadaEn: string;
  nombreAcuse: string;
}

interface EstadoConPresentacion {
  presentacion?: Presentacion;
  borradorDian?: { numeroFormulario: string };
  [clave: string]: unknown;
}

export function registrarPresentacion(
  usuarioId: string,
  titularIdentificacion: string,
  anioGravable: number,
  presentacion: Presentacion,
): Promise<void> {
  return conEstado(usuarioId, titularIdentificacion, anioGravable, (estado) => ({ ...estado, presentacion }));
}

async function conEstado(
  usuarioId: string,
  titularIdentificacion: string,
  anioGravable: number,
  cambiar: (estado: EstadoConPresentacion) => EstadoConPresentacion,
): Promise<void> {
  const repositorio = obtenerRepositorio();
  const resumen = (await repositorio.listarDeclaraciones(usuarioId)).find(
    (d) => d.titular.identificacion === titularIdentificacion && d.anioGravable === anioGravable,
  );
  if (!resumen) {
    return;
  }
  const estado = ((await repositorio.cargarDeclaracion(usuarioId, resumen.id)) ?? {}) as EstadoConPresentacion;
  await repositorio.guardarDeclaracion(usuarioId, anioGravable, resumen.titular, cambiar(estado));
}

/**
 * El número del borrador en el portal: con él, la próxima corrida abre el
 * editor por su URL y se salta el menú del portal, que cambia de sitio.
 */
export async function registrarBorradorDian(
  usuarioId: string,
  titularIdentificacion: string,
  anioGravable: number,
  numeroFormulario: string,
): Promise<void> {
  return conEstado(usuarioId, titularIdentificacion, anioGravable, (estado) => ({
    ...estado,
    borradorDian: { numeroFormulario },
  }));
}
