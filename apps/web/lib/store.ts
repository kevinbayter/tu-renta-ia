import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { RESPUESTAS_INICIALES } from './tipos';

import type { Declarante, DocumentoProcesado, MensajeChat, RespuestasEntrevista, ResultadoDeclaracion } from './tipos';

export type PasoWizard = 'documentos' | 'entrevista' | 'revision' | 'resultado';

interface EstadoDeclaracion {
  paso: PasoWizard;
  documentos: DocumentoProcesado[];
  respuestas: RespuestasEntrevista;
  mensajes: MensajeChat[];
  entrevistaCompleta: boolean;
  resultado: ResultadoDeclaracion | null;
  declarante: Declarante;
  /** true = a nombre propio; false = de un tercero; null = flujo anónimo sin titular definido. */
  esPropia: boolean | null;
  declaracionId: string | null;

  irAPaso: (paso: PasoWizard) => void;
  actualizarDeclarante: (parcial: Partial<Declarante>) => void;
  establecerTitular: (declarante: Declarante, esPropia: boolean, declaracionId: string | null) => void;
  establecerDeclaracionId: (id: string) => void;
  agregarDocumento: (doc: DocumentoProcesado) => void;
  eliminarDocumento: (id: string) => void;
  actualizarRespuestas: (parcial: Partial<RespuestasEntrevista>) => void;
  agregarActivoManual: (descripcion: string, valor: number) => void;
  eliminarActivoManual: (indice: number) => void;
  agregarMensaje: (mensaje: MensajeChat) => void;
  marcarEntrevistaCompleta: () => void;
  guardarResultado: (resultado: ResultadoDeclaracion) => void;
  hidratar: (estado: Partial<EstadoDeclaracion>) => void;
  reiniciar: () => void;
}

const ESTADO_INICIAL = {
  paso: 'documentos' as PasoWizard,
  documentos: [] as DocumentoProcesado[],
  respuestas: RESPUESTAS_INICIALES,
  mensajes: [] as MensajeChat[],
  entrevistaCompleta: false,
  resultado: null,
  declarante: { nombres: '', apellidos: '', identificacion: '' } as Declarante,
  esPropia: null as boolean | null,
  declaracionId: null as string | null,
};

type SetEstado = (
  parcial: Partial<EstadoDeclaracion> | ((s: EstadoDeclaracion) => Partial<EstadoDeclaracion>),
) => void;

/** Una declaración usa UNA sola exógena: subir una nueva reemplaza la anterior. */
function agregarConExogenaUnica(existentes: DocumentoProcesado[], nuevo: DocumentoProcesado): DocumentoProcesado[] {
  if (nuevo.tipo !== 'exogena') {
    return [...existentes, nuevo];
  }
  return [...existentes.filter((d) => d.tipo !== 'exogena'), nuevo];
}

function accionesGenerales(set: SetEstado): Partial<EstadoDeclaracion> {
  return {
    irAPaso: (paso) => set({ paso }),
    actualizarDeclarante: (parcial) => set((s) => ({ declarante: { ...s.declarante, ...parcial } })),
    establecerTitular: (declarante, esPropia, declaracionId) => set({ declarante, esPropia, declaracionId }),
    establecerDeclaracionId: (id) => set({ declaracionId: id }),
    agregarDocumento: (doc) => set((s) => ({ documentos: agregarConExogenaUnica(s.documentos, doc) })),
    eliminarDocumento: (id) => set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) })),
    agregarMensaje: (mensaje) => set((s) => ({ mensajes: [...s.mensajes, mensaje] })),
    marcarEntrevistaCompleta: () => set({ entrevistaCompleta: true }),
    guardarResultado: (resultado) => set({ resultado }),
    hidratar: (estado) => set(sanearExogenaUnica(estado)),
    reiniciar: () => set(ESTADO_INICIAL),
  };
}

function accionesRespuestas(set: SetEstado): Partial<EstadoDeclaracion> {
  return {
    actualizarRespuestas: (parcial) => set((s) => ({ respuestas: { ...s.respuestas, ...parcial } })),
    agregarActivoManual: (descripcion, valor) =>
      set((s) => ({
        respuestas: {
          ...s.respuestas,
          activosManuales: [...s.respuestas.activosManuales, { descripcion, valor }],
        },
      })),
    eliminarActivoManual: (indice) =>
      set((s) => ({
        respuestas: {
          ...s.respuestas,
          activosManuales: s.respuestas.activosManuales.filter((_, i) => i !== indice),
        },
      })),
  };
}

/** Sanea estados guardados antes de la regla de exógena única: conserva solo la última subida. */
function sanearExogenaUnica<T extends Partial<EstadoDeclaracion>>(estado: T): T {
  if (!estado.documentos) {
    return estado;
  }
  const ultimaExogena = estado.documentos.filter((d) => d.tipo === 'exogena').at(-1);
  return {
    ...estado,
    documentos: estado.documentos.filter((d) => d.tipo !== 'exogena' || d === ultimaExogena),
  };
}

function migrarEstadoPersistido(persistido: unknown): EstadoDeclaracion {
  return sanearExogenaUnica(persistido as EstadoDeclaracion);
}

export const useDeclaracion = create<EstadoDeclaracion>()(
  persist(
    (set) => ({
      ...ESTADO_INICIAL,
      ...accionesGenerales(set),
      ...accionesRespuestas(set),
    }) as EstadoDeclaracion,
    { name: 'turenta-declaracion-ag2025', version: 1, migrate: migrarEstadoPersistido },
  ),
);
