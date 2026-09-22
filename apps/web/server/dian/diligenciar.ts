import {
  crearAutorizacion,
  detectarCasosNoSoportados,
  permiteAlcance,
  serializarAutorizacion,
  textoAutorizacion,
} from '@turenta/core';

import { accesoDe, guardarSiProcede, marcarUso, olvidarSiCaduco } from './acceso-guardado';
import {
  obtenerConexionDian,
  obtenerEvidenciaDian,
  obtenerLimitadorDian,
  obtenerRepositorio,
} from '@/server/composicion';

import type {
  AlcanceAutorizacion,
  DatosDiligenciamiento,
  DatosPresentacion,
  ResultadoPresentacion,
  GeneroDian,
  HuellaPeticion,
  ProgresoConexion,
  RespuestasEntrevista,
  ResultadoDiligenciamiento,
  SolicitudConexionDian,
} from '@turenta/core';

/**
 * Filling the return in the portal as a draft. Same guarantees as the
 * downloads: rate limit, evidence written BEFORE touching the portal, and the
 * figures come from the return saved in our database, never from the browser.
 */

type Accion = 'diligenciar' | 'presentar';

const ALCANCE_DE: Record<Accion, AlcanceAutorizacion> = {
  diligenciar: 'diligenciar_declaracion',
  presentar: 'presentar_declaracion',
};
const GENEROS: GeneroDian[] = ['1', '2', '3', '4', '6'];

export type CasillasGuardadas = { casillas: Record<string, number>; numeroFormulario?: string } | { error: string };

/** The engine's boxes of the saved return for that taxpayer and year. */
export async function casillasGuardadas(usuarioId: string, titular: string, anio: number): Promise<CasillasGuardadas> {
  const repositorio = obtenerRepositorio();
  const resumen = (await repositorio.listarDeclaraciones(usuarioId)).find(
    (d) => d.titular.identificacion === titular && d.anioGravable === anio,
  );
  const estado = resumen ? ((await repositorio.cargarDeclaracion(usuarioId, resumen.id)) as EstadoGuardado | null) : null;
  const casillas = estado?.resultado?.casillas;
  if (!casillas) {
    return { error: 'Primero calcula y guarda la declaración en TuRenta.' };
  }
  const casos = estado.respuestas ? detectarCasosNoSoportados(estado.respuestas) : [];
  const borrador = estado.borradorDian?.numeroFormulario;
  const conocido = borrador ? { numeroFormulario: borrador } : {};
  return casos.length > 0 ? { error: `Declaración incompleta: ${casos.map((c) => c.etiqueta).join('; ')}` } : { casillas, ...conocido };
}

interface EstadoGuardado {
  resultado?: { casillas?: Record<string, number> };
  respuestas?: RespuestasEntrevista;
  borradorDian?: { numeroFormulario?: string };
}

/** Gender and main activity are not in the engine: the user states them. */
export function datosDelFormulario(cuerpo: Record<string, unknown>): Omit<DatosDiligenciamiento, 'casillas'> | null {
  const genero = String(cuerpo['genero'] ?? '') as GeneroDian;
  const actividadEconomica = String(cuerpo['actividadEconomica'] ?? '');
  return GENEROS.includes(genero) && /^\d{4}$/.test(actividadEconomica) ? { genero, actividadEconomica } : null;
}

type AlProgresar = (progreso: ProgresoConexion) => void;

export function diligenciarEnLaDian(
  solicitud: SolicitudConexionDian,
  datos: DatosDiligenciamiento,
  operador: Operador,
): Promise<{ resultado: ResultadoDiligenciamiento; esperarSegundos: number | null }> {
  return enLaDian(solicitud, datos, operador, 'diligenciar');
}

/** Firma y presenta: la operación irreversible, con su propio alcance. */
export function presentarEnLaDian(
  solicitud: SolicitudConexionDian,
  datos: DatosPresentacion,
  operador: Operador,
): Promise<{ resultado: ResultadoPresentacion; esperarSegundos: number | null }> {
  return enLaDian(solicitud, datos, operador, 'presentar') as Promise<{
    resultado: ResultadoPresentacion;
    esperarSegundos: number | null;
  }>;
}

async function enLaDian(
  solicitud: SolicitudConexionDian,
  datos: DatosPresentacion,
  operador: Operador,
  accion: Accion,
): Promise<{ resultado: ResultadoDiligenciamiento; esperarSegundos: number | null }> {
  const limitador = obtenerLimitadorDian();
  const clave = { usuarioId: operador.usuarioId, numeroDocumento: solicitud.credenciales.numeroDocumento };
  const veredicto = limitador.consultar(clave);
  if (!veredicto.permitido) {
    return { resultado: { exito: false, motivoFallo: 'servicio_no_disponible' }, esperarSegundos: veredicto.esperarSegundos };
  }
  limitador.registrarIntento(clave);
  const resultado = await limitador.conPermiso(() => conEvidencia(solicitud, datos, operador, accion));
  if (resultado.motivoFallo === 'credenciales_invalidas') {
    limitador.registrarFallo(clave);
  }
  return { resultado, esperarSegundos: null };
}

export interface Operador {
  usuarioId: string;
  huella: HuellaPeticion;
  alProgresar?: AlProgresar;
}

async function conEvidencia(
  solicitud: SolicitudConexionDian,
  datos: DatosPresentacion,
  { usuarioId, huella, alProgresar }: Operador,
  accion: Accion,
): Promise<ResultadoDiligenciamiento> {
  const ALCANCE = ALCANCE_DE[accion];
  const alcances = solicitud.alcancesAceptados.includes(ALCANCE) ? solicitud.alcancesAceptados : [ALCANCE];
  const texto = textoAutorizacion(solicitud.titular, alcances, solicitud.enNombreDeOtro);
  const autorizacion = crearAutorizacion(
    { titularIdentificacion: solicitud.titular, operadorUsuarioId: usuarioId, alcances, textoAceptado: serializarAutorizacion(texto) },
    new Date(),
  );
  if (!permiteAlcance(autorizacion, ALCANCE, new Date())) {
    return { exito: false, motivoFallo: 'desconocido', detalle: 'La autorización no incluye diligenciar la declaración' };
  }
  const evidencia = obtenerEvidenciaDian();
  const { id } = await evidencia.registrarAutorizacion(autorizacion, huella);
  const resultado = await operar(solicitud, datos, usuarioId, accion, alProgresar);
  const desenlace = resultado.exito
    ? ({ resultado: 'exitosa' } as const)
    : ({ resultado: 'fallida', motivoFallo: `${resultado.motivoFallo ?? 'desconocido'}: ${resultado.detalle ?? ''}`.slice(0, 200) } as const);
  await evidencia.cerrarAutorizacion(id, desenlace, new Date()).catch(() => null);
  return resultado;
}

async function operar(
  solicitud: SolicitudConexionDian,
  datos: DatosPresentacion,
  usuarioId: string,
  accion: Accion,
  alProgresar: AlProgresar = () => undefined,
): Promise<ResultadoDiligenciamiento> {
  const acceso = await accesoDe(usuarioId, solicitud.titular);
  const contexto = {
    titularIdentificacion: solicitud.titular,
    operadorUsuarioId: usuarioId,
    anioGravable: solicitud.anioGravable,
    modoIngreso: solicitud.modoIngreso,
    // Sin esto el worker no sella el sobre y "recordar mi acceso" no guarda nada.
    ...(solicitud.recordarAcceso === true ? { recordarAcceso: true } : {}),
    ...(acceso.cifrado ? { cifrado: acceso.cifrado } : {}),
  };
  const conexion = obtenerConexionDian();
  const resultado = await (accion === 'presentar'
    ? conexion.presentarDeclaracion(solicitud.credenciales, contexto, datos, alProgresar)
    : conexion.diligenciarDeclaracion(solicitud.credenciales, contexto, datos, alProgresar));
  await sincronizarAcceso(resultado, usuarioId, solicitud, acceso.id);
  return resultado;
}

/** Guardar el acceso si se pidió, olvidarlo si dejó de servir, y marcar su uso. */
function sincronizarAcceso(
  resultado: ResultadoDiligenciamiento,
  usuarioId: string,
  solicitud: SolicitudConexionDian,
  accesoId: string | undefined,
): Promise<unknown> {
  return Promise.all([
    guardarSiProcede(resultado, usuarioId, solicitud.titular, {
      tipoDocumento: solicitud.credenciales.tipoDocumento,
      numeroDocumento: solicitud.credenciales.numeroDocumento,
    }),
    olvidarSiCaduco(resultado, usuarioId, solicitud.titular),
    resultado.exito ? marcarUso(accesoId, new Date()) : Promise.resolve(),
  ]);
}
